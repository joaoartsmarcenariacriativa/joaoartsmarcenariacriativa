/*
# Add environment column to shipping_carriers

1. Modified Tables
- `shipping_carriers`: adds `environment` (text, default 'production') — controls whether to use the sandbox or production API endpoint
  - Values: 'production' or 'sandbox'
  - Default is 'production' so existing carriers use the real API by default.

2. Security
- No RLS changes. Existing policies remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipping_carriers' AND column_name = 'environment') THEN
    ALTER TABLE shipping_carriers ADD COLUMN environment text NOT NULL DEFAULT 'production';
  END IF;
END $$;
