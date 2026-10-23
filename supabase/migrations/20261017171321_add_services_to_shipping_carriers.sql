/*
# Add services column to shipping_carriers

1. Modified Tables
- `shipping_carriers`: adds `services` (text, nullable) — comma-separated list of Melhor Envio service codes to query (e.g. "1,2,18")
  - When null/empty, the edge function defaults to "1,2,3,4,18" (PAC, SEDEX, Jadlog Package, Jadlog Express, Azul Cargo).
  - Only used by the melhor_envio provider; ignored by manual/frenet.

2. Security
- No RLS changes. Existing policies remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipping_carriers' AND column_name = 'services') THEN
    ALTER TABLE shipping_carriers ADD COLUMN services text;
  END IF;
END $$;

-- Set a sensible default for existing melhor_envio carriers
UPDATE shipping_carriers SET services = '1,2,3,4' WHERE provider = 'melhor_envio' AND services IS NULL;
