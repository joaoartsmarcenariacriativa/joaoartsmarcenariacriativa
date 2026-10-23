/*
# Create shipping_carriers table

1. New Tables
- `shipping_carriers`
  - `id` (uuid, primary key)
  - `name` (text) — display name shown to customers (e.g. "Correios PAC", "SEDEX", "JadLog")
  - `code` (text, unique) — internal code identifying the carrier/service (e.g. "correios_pac", "sedex", "jadlog_express")
  - `provider` (text) — which API provider to use: "correios", "melhor_envio", "frenet", "manual"
  - `api_key` (text, nullable) — API token/key for the provider, if needed
  - `api_url` (text, nullable) — custom API endpoint URL, if needed
  - `enabled` (boolean, default true) — whether this carrier is active and shown to customers
  - `sort_order` (integer, default 0) — display ordering
  - `extra_config` (jsonb, default '{}') — any extra provider-specific config (contract numbers, service codes, etc.)
  - `created_at` (timestamptz)

2. Seed data
- Inserts default Correios PAC and SEDEX carriers (provider = "manual", no API key needed) so shipping quotes work immediately.

3. Security
- Enable RLS on `shipping_carriers`.
- SELECT: `TO anon, authenticated` — the storefront (anon key) needs to see which carriers are available.
- INSERT/UPDATE/DELETE: `TO authenticated` — only admin can manage carriers.
*/

CREATE TABLE IF NOT EXISTS shipping_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  provider text NOT NULL DEFAULT 'manual',
  api_key text,
  api_url text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_shipping_carriers" ON shipping_carriers;
CREATE POLICY "select_shipping_carriers"
ON shipping_carriers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_shipping_carriers" ON shipping_carriers;
CREATE POLICY "insert_shipping_carriers"
ON shipping_carriers FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_shipping_carriers" ON shipping_carriers;
CREATE POLICY "update_shipping_carriers"
ON shipping_carriers FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_shipping_carriers" ON shipping_carriers;
CREATE POLICY "delete_shipping_carriers"
ON shipping_carriers FOR DELETE
TO authenticated USING (true);

-- Seed default carriers (idempotent)
INSERT INTO shipping_carriers (name, code, provider, enabled, sort_order)
SELECT 'Correios PAC', 'correios_pac', 'manual', true, 1
WHERE NOT EXISTS (SELECT 1 FROM shipping_carriers WHERE code = 'correios_pac');

INSERT INTO shipping_carriers (name, code, provider, enabled, sort_order)
SELECT 'Correios SEDEX', 'correios_sedex', 'manual', true, 2
WHERE NOT EXISTS (SELECT 1 FROM shipping_carriers WHERE code = 'correios_sedex');
