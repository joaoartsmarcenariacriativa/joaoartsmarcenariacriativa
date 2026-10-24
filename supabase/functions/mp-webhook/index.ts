import { createClient } from "npm:@supabase/supabase-js@2";
// webhook atualizado: usa gateway/service_id para emissao e mantem recusados como recebido

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MPNotification {
  action?: string;
  data?: { id?: string };
  type?: string;
}

interface CarrierRow {
  id: string;
  name: string;
  code: string;
  provider: string;
  api_key: string | null;
  api_url: string | null;
  environment: string;
  services: string | null;
}

/**
 * Tenta comprar a etiqueta de frete automaticamente na transportadora escolhida.
 * Retorna { trackingCode } em caso de sucesso, ou { error } em caso de falha
 * (ex.: falta de saldo). A falha NÃO quebra o fluxo do pedido — o pedido
 * permanece "processamento" e é marcado para emissão manual.
 */
async function tryBuyLabel(
  carrier: CarrierRow,
  order: {
    id: string;
    order_number: string;
    cep: string;
    address: string;
    city: string | null;
    state: string | null;
    customer_name: string;
    total: number;
    shipping_carrier_name: string | null;
    shipping_service_name: string | null;
    shipping_gateway: string | null;
    shipping_service_id: string | null;
  },
  originCep: string,
): Promise<{ trackingCode?: string; error?: string }> {
  if (!carrier.api_key) {
    return { error: "Transportadora sem API key configurada" };
  }
  const cleanCep = order.cep.replace(/\D/g, "");

  try {
    if (carrier.provider === "melhor_envio") {
      const isSandbox = carrier.environment === "sandbox";
      const base = isSandbox
        ? "https://sandbox.melhorenvio.com.br"
        : "https://melhorenvio.com.br";
      const apiUrl = carrier.api_url ?? `${base}/api/v2/me/shipment/print`;

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${carrier.api_key}`,
          "User-Agent": "Joao-Arts-Loja (contato@joaoarts.com.br)",
        },
        body: JSON.stringify({
          orders: [order.id],
          to: {
            name: order.customer_name,
            postal_code: cleanCep,
            address: order.address,
            city: order.city ?? "",
            state: order.state ?? "",
          },
          from: { postal_code: originCep },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const tracking = data.tracking ?? data.protocol ?? data.id;
        if (tracking) return { trackingCode: String(tracking) };
        return { error: "Resposta sem código de rastreio" };
      }
      const errBody = await resp.text().catch(() => "");
      return { error: `HTTP ${resp.status}: ${errBody.slice(0, 200)}` };
    }

    if (carrier.provider === "superfrete") {
      const isSandbox = carrier.environment === "sandbox";
      const base = isSandbox
        ? "https://api.hmg.superfrete.com"
        : "https://api.superfrete.com";
      const apiUrl = carrier.api_url ?? `${base}/v1/label`;

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${carrier.api_key}`,
        },
        body: JSON.stringify({
          order_number: order.id,
          to: {
            name: order.customer_name,
            postal_code: cleanCep,
            address: order.address,
            city: order.city ?? "",
            state: order.state ?? "",
          },
          from: { postal_code: originCep },
          service: order.shipping_service_id ?? carrier.services ?? "pac",
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const tracking = data.tracking_number ?? data.tracking ?? data.id;
        if (tracking) return { trackingCode: String(tracking) };
        return { error: "Resposta sem código de rastreio" };
      }
      const errBody = await resp.text().catch(() => "");
      return { error: `HTTP ${resp.status}: ${errBody.slice(0, 200)}` };
    }

    return { error: `Compra automática não suportada para ${carrier.provider}` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as MPNotification;

    // Mercado Pago envia notificações do tipo "payment" com action "payment.created"
    // ou "payment.updated". O campo data.id contém o ID do pagamento.
    if (body.type !== "payment" || !body.data?.id) {
      // Confirmação silenciosa para tipos não relevantes
      return new Response(
        JSON.stringify({ received: true, ignored: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const paymentId = body.data.id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca as credenciais do MP para consultar o status do pagamento
    const { data: settings } = await supabase
      .from("store_settings")
      .select("mp_access_token, mp_environment, origin_cep, store_name, email_contact, whatsapp_number")
      .eq("id", 1)
      .maybeSingle();

    const s = settings as {
      mp_access_token: string | null;
      mp_environment: string | null;
      origin_cep: string | null;
      store_name: string | null;
      email_contact: string | null;
      whatsapp_number: string | null;
    } | null;

    if (!s?.mp_access_token) {
      return new Response(
        JSON.stringify({ error: "MP access token não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Consulta o pagamento na API do MP
    const isSandbox = s.mp_environment === "sandbox";
    const mpApiBase = isSandbox
      ? "https://api.mercadopago.com"
      : "https://api.mercadopago.com";
    const mpResp = await fetch(`${mpApiBase}/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${s.mp_access_token}` },
    });

    if (!mpResp.ok) {
      return new Response(
        JSON.stringify({ error: `Erro ao consultar pagamento MP: HTTP ${mpResp.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payment = await mpResp.json() as {
      status: string;
      external_reference?: string;
    };

    const orderNumber = payment.external_reference;
    if (!orderNumber) {
      return new Response(
        JSON.stringify({ error: "Pagamento sem external_reference (order_number)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Busca o pedido pelo order_number
    const { data: orderData } = await supabase
      .from("orders")
      .select("id, order_number, cep, address, city, state, customer_name, total, status, shipping_carrier_name, shipping_service_name, shipping_gateway, shipping_service_id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    const order = orderData as {
      id: string;
      order_number: string;
      cep: string;
      address: string;
      city: string | null;
      state: string | null;
      customer_name: string;
      total: number;
      status: string;
      shipping_carrier_name: string | null;
      shipping_service_name: string | null;
      shipping_gateway: string | null;
      shipping_service_id: string | null;
    } | null;

    if (!order) {
      return new Response(
        JSON.stringify({ error: `Pedido ${orderNumber} não encontrado` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Status do pagamento MP: approved, pending, rejected, cancelled, refunded
    if (payment.status === "approved") {
      // Pagamento aprovado → pedido muda para "processamento"
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processamento",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // Tenta compra automática de etiqueta na transportadora escolhida
      const originCep = (s.origin_cep ?? "").replace(/\D/g, "");
      const carrierName = order.shipping_carrier_name;

      if (carrierName && originCep.length === 8) {
        let carrierQuery = supabase
          .from("shipping_carriers")
          .select("*")
          .eq("enabled", true)
          .limit(1);

        if (order.shipping_gateway === "melhorenvio") {
          carrierQuery = carrierQuery.eq("provider", "melhor_envio");
        } else if (order.shipping_gateway === "superfrete") {
          carrierQuery = carrierQuery.eq("provider", "superfrete");
        } else {
          carrierQuery = carrierQuery.or(`name.eq.${carrierName},code.eq.${carrierName}`);
        }

        const { data: carrierRow } = await carrierQuery.maybeSingle();

        const carrier = carrierRow as CarrierRow | null;

        if (carrier?.api_key) {
          const result = await tryBuyLabel(carrier, order, originCep);

          if (result.trackingCode) {
            // Sucesso: etiqueta comprada, status → enviado
            await supabase
              .from("orders")
              .update({
                tracking_code: result.trackingCode,
                status: "enviado",
                manual_label_required: false,
                label_purchase_error: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          } else {
            // Falha (ex.: falta de saldo): mantém processamento, marca manual
            await supabase
              .from("orders")
              .update({
                manual_label_required: true,
                label_purchase_error: result.error ?? "Erro desconhecido",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);
          }
        }
      }

      return new Response(
        JSON.stringify({ received: true, order: orderNumber, status: "approved", processed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          status: "recebido",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return new Response(
        JSON.stringify({ received: true, order: orderNumber, status: "cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // pending ou outros: apenas registra
    await supabase
      .from("orders")
      .update({
        payment_status: payment.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ received: true, order: orderNumber, status: payment.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
