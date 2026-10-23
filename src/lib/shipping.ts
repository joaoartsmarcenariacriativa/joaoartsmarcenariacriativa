import type { ShippingQuoteOption } from '@/types';

export interface ShippingQuoteResult {
  options: ShippingQuoteOption[];
  error: string | null;
  warnings: string[] | null;
}

export async function fetchShippingQuote(
  cep: string,
  products: Array<{
    weight_g: number;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    declared_value: number;
    quantity: number;
  }>,
): Promise<ShippingQuoteResult> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shipping-quote`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cep, products }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return { options: [], error: (errBody as Record<string, string>)?.error ?? `Erro ${response.status}`, warnings: null };
    }

    const data = await response.json();
    if (data.error) {
      return { options: [], error: data.error, warnings: data.warnings ?? null };
    }
    return {
      options: (data.options ?? []) as ShippingQuoteOption[],
      error: null,
      warnings: data.warnings ?? null,
    };
  } catch {
    return { options: [], error: 'Não foi possível conectar ao serviço de frete.', warnings: null };
  }
}
