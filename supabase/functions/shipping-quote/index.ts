import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuoteRequest {
  cep: string;
  products: Array<{
    weight_g: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    declared_value: number;
    quantity: number;
  }>;
}

interface QuoteOption {
  name: string;
  days: number;
  price: number;
  carrier: string;
  gateway: "melhorenvio" | "superfrete" | "manual";
  service_id: string;
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
  enabled: boolean;
  sort_order: number;
}

function estimateCost(
  totalWeight: number,
  maxLength: number,
  maxWidth: number,
  maxHeight: number,
  totalValue: number,
  cleanCep: string,
  carrierCode: string,
  originCep: string,
): { price: number; days: number } {
  const baseCost = (totalWeight / 1000) * 12.5;
  const dimCost = (maxLength * maxWidth * maxHeight) / 6000 * 8;
  const valueCost = totalValue * 0.01;
  const cepNum = parseInt(cleanCep.slice(0, 5));
  const originNum = parseInt(originCep.slice(0, 5)) || 1000;
  const distanceFactor = 1 + (Math.abs(cepNum - originNum) / 10000);

  if (carrierCode.includes("sedex") || carrierCode.includes("express")) {
    const pacPrice = (baseCost + dimCost + valueCost + 15) * distanceFactor;
    const sedexPrice = Math.round((pacPrice * 1.8 + 10) * 100) / 100;
    const pacDays = Math.floor(Math.abs(cepNum - originNum) / 2000) + 4;
    const sedexDays = Math.max(1, Math.floor(pacDays / 2.5));
    return { price: sedexPrice, days: sedexDays };
  }

  const pacPrice = Math.round((baseCost + dimCost + valueCost + 15) * distanceFactor * 100) / 100;
  const pacDays = Math.floor(Math.abs(cepNum - originNum) / 2000) + 4;
  return { price: pacPrice, days: pacDays };
}

function getMelhorEnvioUrl(carrier: CarrierRow): string {
  if (carrier.api_url) return carrier.api_url;
  const isSandbox = carrier.environment === "sandbox";
  const base = isSandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br";
  return `${base}/api/v2/me/shipment/calculate`;
}

function getSuperFreteUrl(carrier: CarrierRow): string {
  if (carrier.api_url) return carrier.api_url;
  const isSandbox = carrier.environment === "sandbox";
  const base = isSandbox
    ? "https://sandbox.superfrete.com"
    : "https://api.superfrete.com";
  return `${base}/api/v0/calculator`;
}

// Corre um provedor de cotação e devolve as opções + erros. Roda em paralelo
// via Promise.allSettled para Melhor Envio e SuperFrete não se bloquearem.
async function quoteMelhorEnvio(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  products: QuoteRequest["products"],
  totals: { weight: number; length: number; width: number; height: number; value: number },
): Promise<{ options: QuoteOption[]; errors: string[] }> {
  const options: QuoteOption[] = [];
  const errors: string[] = [];
  const apiUrl = getMelhorEnvioUrl(carrier);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${carrier.api_key}`,
        "User-Agent": "Joao-Arts-Loja (contato@joaoarts.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: cleanCep },
        products: products.map(p => ({
          id: "1",
          width: p.width_cm,
          height: p.height_cm,
          length: p.length_cm,
          weight: p.weight_g / 1000,
          insurance_value: p.declared_value,
          quantity: p.quantity,
        })),
        options: {
          receipt: false,
          own_hand: false,
        },
        services: carrier.services ?? "1,2,3,4",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.error) {
            if (!String(item.error).toLowerCase().includes("não atende") && !String(item.error).toLowerCase().includes("nao atende")) {
              errors.push(`${carrier.name}: ${item.error}`);
            }
            continue;
          }
          if (item.price) {
            options.push({
              name: `${item.name ?? carrier.name} (via Melhor Envio)`,
              days: parseInt(item.delivery_time?.min ?? item.delivery_time ?? "5") || 5,
              price: parseFloat(item.custom_price ?? item.price),
              carrier: item.company?.name ?? carrier.name,
              gateway: "melhorenvio",
              service_id: String(item.id ?? ""),
            });
          }
        }
      } else if (data.error) {
        errors.push(`${carrier.name}: ${data.error}`);
      }
    } else {
      const errBody = await response.text().catch(() => "");
      let errMsg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed.message ?? parsed.error ?? errMsg;
      } catch { /* not JSON */ }
      errors.push(`${carrier.name} (${carrier.environment}): ${errMsg}`);
    }
  } catch (fetchErr) {
    errors.push(`${carrier.name}: erro de conexão - ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }

  // Fallback: se a API do Melhor Envio não retornou opções, usa estimativa
  // para o cliente não ficar sem frete na tela.
  if (options.length === 0) {
    const serviceCodes = (carrier.services ?? "1,2,3,4").split(",").map(s => s.trim());
    const hasSedex = serviceCodes.some(s => s === "2" || s === "9");
    const hasPac = serviceCodes.some(s => s === "1" || s === "04510");
    if (hasPac) {
      const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, "pac", originCep);
      options.push({ name: "Correios PAC (estimativa) (via Melhor Envio)", days, price, carrier: "Correios", gateway: "melhorenvio", service_id: "1" });
    }
    if (hasSedex) {
      const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, "sedex", originCep);
      options.push({ name: "Correios SEDEX (estimativa) (via Melhor Envio)", days, price, carrier: "Correios", gateway: "melhorenvio", service_id: "2" });
    }
    if (!hasPac && !hasSedex) {
      const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, carrier.code, originCep);
      options.push({ name: `${carrier.name} (estimativa) (via Melhor Envio)`, days, price, carrier: carrier.name, gateway: "melhorenvio", service_id: "" });
    }
  }

  return { options, errors };
}

async function quoteSuperFrete(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  totals: { weight: number; length: number; width: number; height: number; value: number },
): Promise<{ options: QuoteOption[]; errors: string[] }> {
  const options: QuoteOption[] = [];
  const errors: string[] = [];
  const apiUrl = getSuperFreteUrl(carrier);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${carrier.api_key}`,
        "User-Agent": "Joao-Arts-Loja (contato@joaoarts.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: cleanCep },
        services: carrier.services ?? "1,2,17,3",
        options: {
          own_hand: false,
          receipt: false,
          insurance_value: totals.value,
          use_insurance_value: totals.value > 0,
        },
        package: {
          weight: totals.weight / 1000,
          length: totals.length,
          width: totals.width,
          height: totals.height,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const quotes = Array.isArray(data) ? data : (data.quotes ?? data.data ?? []);
      for (const item of quotes) {
        if (item.has_error) continue;
        if (item.price != null) {
          options.push({
            name: `${item.name ?? "Serviço"} (via SuperFrete)`,
            days: parseInt(item.delivery_time ?? item.days ?? "5") || 5,
            price: parseFloat(item.price),
            carrier: item.company?.name ?? "SuperFrete",
            gateway: "superfrete",
            service_id: String(item.id ?? ""),
          });
        }
      }
    } else {
      const errBody = await response.text().catch(() => "");
      let errMsg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errBody);
        errMsg = parsed.message ?? parsed.error ?? errMsg;
      } catch { /* not JSON */ }
      errors.push(`${carrier.name} (${carrier.environment}): ${errMsg}`);
    }
  } catch (fetchErr) {
    errors.push(`${carrier.name}: erro de conexão - ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }

  return { options, errors };
}

async function quoteFrenet(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  products: QuoteRequest["products"],
): Promise<{ options: QuoteOption[]; errors: string[] }> {
  const options: QuoteOption[] = [];
  const errors: string[] = [];
  const apiUrl = carrier.api_url ?? "https://api.frenet.com.br/shipping/quote";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "token": carrier.api_key ?? "",
      },
      body: JSON.stringify({
        SellerCEP: originCep,
        BuyerCEP: cleanCep,
        ShippingItemContainer: products.map(p => ({
          Weight: p.weight_g / 1000,
          Length: p.length_cm,
          Width: p.width_cm,
          Height: p.height_cm,
          Amount: p.declared_value,
          Quantity: p.quantity,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ShippingSevicesArray) {
        for (const item of data.ShippingSevicesArray) {
          if (item.Error === false && item.ShippingPrice) {
            options.push({
              name: `${item.ServiceDescription ?? carrier.name} (via Frenet)`,
              days: parseInt(item.DeliveryTime) || 5,
              price: parseFloat(item.ShippingPrice),
              carrier: item.Carrier ?? carrier.name,
              gateway: "manual",
              service_id: String(item.ServiceCode ?? ""),
            });
          } else if (item.Error === true && item.Msg) {
            errors.push(`${carrier.name}: ${item.Msg}`);
          }
  }
      }
    } else {
      errors.push(`${carrier.name}: HTTP ${response.status}`);
    }
  } catch (fetchErr) {
    errors.push(`${carrier.name}: erro de conexão - ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }

  return { options, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { cep, products } = await req.json() as QuoteRequest;

    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      return new Response(
        JSON.stringify({ error: "CEP inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum produto para cotação" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cleanCep = cep.replace(/\D/g, "");

    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;
    let totalValue = 0;

    for (const p of products) {
      totalWeight += p.weight_g * p.quantity;
      maxLength = Math.max(maxLength, p.length_cm);
      maxWidth = Math.max(maxWidth, p.width_cm);
      maxHeight = Math.max(maxHeight, p.height_cm);
      totalValue += p.declared_value * p.quantity;
    }

    const minDim = 16;
    maxLength = Math.max(maxLength, minDim);
    maxWidth = Math.max(maxWidth, minDim);
    maxHeight = Math.max(maxHeight, minDim);
    totalWeight = Math.max(totalWeight, 300);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingsData } = await supabase
      .from("store_settings")
      .select("origin_cep")
      .eq("id", 1)
      .maybeSingle();

    const originCep = (settingsData as { origin_cep?: string } | null)?.origin_cep?.replace(/\D/g, "") ?? "";
    if (originCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: "CEP de origem da loja não configurado. Acesse Configurações no painel admin para cadastrar o CEP do seu estoque." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: carriersData } = await supabase
      .from("shipping_carriers")
      .select("*")
      .eq("enabled", true)
      .order("sort_order");

    const carriers = (carriersData as CarrierRow[]) ?? [];

    if (carriers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma transportadora ativa. Acesse Transportadoras no painel admin para configurar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totals = { weight: totalWeight, length: maxLength, width: maxWidth, height: maxHeight, value: totalValue };

    // Busca em paralelo: Melhor Envio, SuperFrete e Frenet rodam ao mesmo
    // tempo, cada gateway independente. Provedores "manual" (estimativa
    // local) ficam síncronos — são cálculos locais instantâneos.
    const apiCarriers = carriers.filter(c => c.provider === "melhor_envio" && c.api_key);
    const superfreteCarriers = carriers.filter(c => c.provider === "superfrete" && c.api_key);
    const frenetCarriers = carriers.filter(c => c.provider === "frenet" && c.api_key);
    const manualCarriers = carriers.filter(c =>
      !["melhor_envio", "superfrete", "frenet"].includes(c.provider) ||
      (["melhor_envio", "superfrete", "frenet"].includes(c.provider) && !c.api_key)
    );

    const [meResults, sfResults, frResults] = await Promise.all([
      Promise.allSettled(apiCarriers.map(c => quoteMelhorEnvio(c, originCep, cleanCep, products, totals))),
      Promise.allSettled(superfreteCarriers.map(c => quoteSuperFrete(c, originCep, cleanCep, totals))),
      Promise.allSettled(frenetCarriers.map(c => quoteFrenet(c, originCep, cleanCep, products))),
    ]);

    const options: QuoteOption[] = [];
    const apiErrors: string[] = [];

    for (const settled of [...meResults, ...sfResults, ...frResults]) {
      if (settled.status === "fulfilled") {
        options.push(...settled.value.options);
        apiErrors.push(...settled.value.errors);
      } else {
        apiErrors.push(`Erro inesperado: ${settled.reason instanceof Error ? settled.reason.message : String(settled.reason)}`);
      }
    }

    for (const carrier of manualCarriers) {
      const { price, days } = estimateCost(totalWeight, maxLength, maxWidth, maxHeight, totalValue, cleanCep, carrier.code, originCep);
      options.push({
        name: carrier.name,
        days,
        price,
        carrier: carrier.name,
        gateway: "manual",
        service_id: "",
      });
    }

    if (options.length === 0 && apiErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: `Nenhuma opção de frete retornada. Erros das APIs: ${apiErrors.join(" | ")}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ options, warnings: apiErrors.length > 0 ? apiErrors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
