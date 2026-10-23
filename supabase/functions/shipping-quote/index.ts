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

function generateFallbackOptions(
  carrier: CarrierRow,
  totals: { weight: number; length: number; width: number; height: number; value: number },
  cleanCep: string,
  originCep: string,
): QuoteOption[] {
  const options: QuoteOption[] = [];
  const serviceCodes = (carrier.services ?? "1,2,3,4").split(",").map(s => s.trim());
  const hasSedex = serviceCodes.some(s => s === "2" || s === "9");
  const hasPac = serviceCodes.some(s => s === "1" || s === "04510");

  if (hasPac) {
    const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, "pac", originCep);
    options.push({ name: "Correios PAC", days, price, carrier: "Correios", gateway: "manual", service_id: "04510" });
  }
  if (hasSedex) {
    const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, "sedex", originCep);
    options.push({ name: "Correios SEDEX", days, price, carrier: "Correios", gateway: "manual", service_id: "04014" });
  }
  if (!hasPac && !hasSedex) {
    const { price, days } = estimateCost(totals.weight, totals.length, totals.width, totals.height, totals.value, cleanCep, carrier.code, originCep);
    options.push({ name: carrier.name, days, price, carrier: carrier.name, gateway: "manual", service_id: "" });
  }
  return options;
}

async function quoteMelhorEnvio(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  products: QuoteRequest["products"],
  totals: { weight: number; length: number; width: number; height: number; value: number },
): Promise<QuoteOption[]> {
  const options: QuoteOption[] = [];
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
          if (item.error) continue;
          if (item.price) {
            options.push({
              name: item.name ?? carrier.name,
              days: parseInt(item.delivery_time?.min ?? item.delivery_time ?? "5") || 5,
              price: parseFloat(item.custom_price ?? item.price),
              carrier: item.company?.name ?? carrier.name,
              gateway: "melhorenvio",
              service_id: String(item.id ?? ""),
            });
          }
        }
      }
    }
  } catch {
    // silent — fallback below
  }

  if (options.length === 0) {
    return generateFallbackOptions(carrier, totals, cleanCep, originCep);
  }

  return options;
}

async function quoteSuperFrete(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  totals: { weight: number; length: number; width: number; height: number; value: number },
): Promise<QuoteOption[]> {
  const options: QuoteOption[] = [];
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
            name: item.name ?? "Serviço",
            days: parseInt(item.delivery_time ?? item.days ?? "5") || 5,
            price: parseFloat(item.price),
            carrier: item.company?.name ?? "SuperFrete",
            gateway: "superfrete",
            service_id: String(item.id ?? ""),
          });
        }
      }
    }
  } catch {
    // silent — fallback below
  }

  if (options.length === 0) {
    return generateFallbackOptions(carrier, totals, cleanCep, originCep);
  }

  return options;
}

async function quoteFrenet(
  carrier: CarrierRow,
  originCep: string,
  cleanCep: string,
  products: QuoteRequest["products"],
): Promise<QuoteOption[]> {
  const options: QuoteOption[] = [];
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
              name: item.ServiceDescription ?? carrier.name,
              days: parseInt(item.DeliveryTime) || 5,
              price: parseFloat(item.ShippingPrice),
              carrier: item.Carrier ?? carrier.name,
              gateway: "manual",
              service_id: String(item.ServiceCode ?? ""),
            });
          }
        }
      }
    }
  } catch {
    // silent — fallback below
  }

  return options;
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

    // Split carriers: those with valid API keys go to live API calls;
    // those without tokens get local estimate fallback immediately.
    const apiCarriers = carriers.filter(c => c.provider === "melhor_envio" && c.api_key);
    const superfreteCarriers = carriers.filter(c => c.provider === "superfrete" && c.api_key);
    const frenetCarriers = carriers.filter(c => c.provider === "frenet" && c.api_key);
    const noTokenCarriers = carriers.filter(c =>
      !c.api_key ||
      (!["melhor_envio", "superfrete", "frenet"].includes(c.provider))
    );

    // Run all API calls in parallel; no-token carriers use local estimates.
    const [meResults, sfResults, frResults] = await Promise.all([
      Promise.allSettled(apiCarriers.map(c => quoteMelhorEnvio(c, originCep, cleanCep, products, totals))),
      Promise.allSettled(superfreteCarriers.map(c => quoteSuperFrete(c, originCep, cleanCep, totals))),
      Promise.allSettled(frenetCarriers.map(c => quoteFrenet(c, originCep, cleanCep, products))),
    ]);

    const options: QuoteOption[] = [];

    for (const settled of [...meResults, ...sfResults, ...frResults]) {
      if (settled.status === "fulfilled") {
        options.push(...settled.value);
      }
    }

    // Local estimate fallback for carriers without API tokens
    for (const carrier of noTokenCarriers) {
      options.push(...generateFallbackOptions(carrier, totals, cleanCep, originCep));
    }

    // Deduplicate by name + price, keeping the first (highest priority) occurrence
    const seen = new Set<string>();
    const dedupedOptions = options.filter(opt => {
      const key = `${opt.name}-${opt.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (dedupedOptions.length === 0) {
      // Absolute last resort: generate basic PAC + SEDEX so the customer can always checkout
      const pacEst = estimateCost(totalWeight, maxLength, maxWidth, maxHeight, totalValue, cleanCep, "pac", originCep);
      const sedexEst = estimateCost(totalWeight, maxLength, maxWidth, maxHeight, totalValue, cleanCep, "sedex", originCep);
      dedupedOptions.push(
        { name: "Correios PAC", days: pacEst.days, price: pacEst.price, carrier: "Correios", gateway: "manual", service_id: "04510" },
        { name: "Correios SEDEX", days: sedexEst.days, price: sedexEst.price, carrier: "Correios", gateway: "manual", service_id: "04014" },
      );
    }

    // Sort by price ascending so cheapest option appears first
    dedupedOptions.sort((a, b) => a.price - b.price);

    return new Response(
      JSON.stringify({ options: dedupedOptions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
