import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckoutItem {
  id: string;
  title: string;
  description: string;
  picture_url: string;
  category_id: string;
  quantity: number;
  unit_price: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    cep: string;
    address: string;
    city: string;
    state: string;
  };
  shippingCost: number;
  total: number;
  paymentMethod: "pix" | "card" | "boleto";
  backUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as CheckoutRequest;

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum item no carrinho." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings } = await supabase
      .from("store_settings")
      .select("mp_enabled, mp_environment, mp_access_token, mp_public_key, store_name")
      .eq("id", 1)
      .maybeSingle();

    const s = settings as {
      mp_enabled: boolean | null;
      mp_environment: string | null;
      mp_access_token: string | null;
      mp_public_key: string | null;
      store_name: string | null;
    } | null;

    if (!s?.mp_enabled) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago não está ativado. Acesse Pagamentos no painel admin para configurar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = s.mp_access_token;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access Token do Mercado Pago não configurado. Acesse Pagamentos no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isSandbox = s.mp_environment === "sandbox";

    // Constrói os items da preferência — inclui o frete como item separado se houver
    const preferenceItems: Array<{
      id: string;
      title: string;
      description: string;
      picture_url: string;
      category_id: string;
      quantity: number;
      unit_price: number;
    }> = body.items.map(item => ({
      id: item.id,
      title: item.title.slice(0, 255),
      description: item.description.slice(0, 255),
      picture_url: item.picture_url,
      category_id: item.category_id || "others",
      quantity: item.quantity,
      unit_price: Math.round(item.unit_price * 100) / 100,
    }));

    // O frete NÃO entra como item — vai no nó shipments (mode: not_specified),
    // conforme a documentação oficial do Checkout Pro. Isso evita duplicidade
    // de cobrança e previne discrepância entre o total exibido e o cobrado.
    const paymentMethods: {
      installments?: number;
      default_installments?: number;
    } = {};

    if (body.paymentMethod === "card") {
      paymentMethods.installments = body.total > 0 ? Math.min(12, Math.max(1, Math.floor(body.total / 50))) : 1;
      paymentMethods.default_installments = 1;
    }

    const payer: Record<string, unknown> = {
      name: body.customer.name,
      email: body.customer.email,
    };

    if (body.customer.phone) {
      const digits = body.customer.phone.replace(/\D/g, "");
      if (digits.length >= 10) {
        payer.phone = {
          area_code: digits.slice(-11, -9) || undefined,
          number: digits.slice(-9) || undefined,
        };
      }
    }

    if (body.customer.address) {
      payer.address = {
        zip_code: body.customer.cep?.replace(/\D/g, "") || undefined,
        street_name: body.customer.address,
        city_name: body.customer.city || undefined,
        federal_unit: body.customer.state || undefined,
      };
    }

    const preferenceBody: Record<string, unknown> = {
      items: preferenceItems,
      payer,
      external_reference: body.orderNumber,
      shipments: {
        mode: "not_specified",
        cost: Math.round(body.shippingCost * 100) / 100,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      back_urls: {
        success: `${body.backUrl}?status=success&order=${body.orderNumber}`,
        pending: `${body.backUrl}?status=pending&order=${body.orderNumber}`,
        failure: `${body.backUrl}?status=failure&order=${body.orderNumber}`,
      },
      auto_return: "approved",
      payment_methods: paymentMethods,
      statement_descriptor: (s.store_name ?? "Joao Arts").slice(0, 22),
    };

    const apiUrl = "https://api.mercadopago.com/checkout/preferences";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = typeof data.message === "string" ? data.message
        : Array.isArray(data.cause) ? data.cause.map((c: { description?: string }) => c.description).join("; ")
        : data.error || `HTTP ${response.status}`;
      return new Response(
        JSON.stringify({ error: `Mercado Pago: ${errMsg}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Em sandbox, usar sandbox_init_point; em produção, init_point
    const initPoint = isSandbox ? (data.sandbox_init_point || data.init_point) : (data.init_point || data.sandbox_init_point);

    if (!initPoint) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago não retornou URL de checkout. Verifique se as credenciais estão corretas.", preference_id: data.id }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ init_point: initPoint, preference_id: data.id, sandbox: isSandbox }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
