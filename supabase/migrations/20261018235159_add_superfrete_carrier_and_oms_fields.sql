-- Adiciona SuperFrete como transportadora disponível (multi-gateway com Melhor Envio).
-- A Kangu permanece desativada/descontinuada conforme requisito.

INSERT INTO shipping_carriers (name, code, provider, api_key, api_url, environment, services, enabled, sort_order, extra_config)
VALUES (
  'SuperFrete',
  'superfrete',
  'superfrete',
  NULL,
  NULL,
  'production',
  'pac,sedex,jadlog,loggi',
  true,
  20,
  '{}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider;

-- Adiciona coluna para marcar pedidos que precisam emissão manual de etiqueta
-- (quando a automação de compra falha por falta de saldo na transportadora).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS manual_label_required boolean NOT NULL DEFAULT false;

-- Adiciona coluna para registrar qual gateway de frete foi escolhido
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_carrier_name text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_service_name text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS label_purchase_error text;
