/*
# Add origin_cep column to store_settings

1. Modified Tables
- `store_settings`: adds `origin_cep` (text, nullable) — the store's warehouse/origin postal code used for shipping quotes
  - Nullable so existing settings work without changes; the admin fills it in from the Settings page.
  - Used by the shipping-quote edge function as the "from" CEP when calling Melhor Envio, Frenet, or Correios APIs.

2. Security
- No RLS changes. Existing policies on store_settings remain unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'origin_cep') THEN
    ALTER TABLE store_settings ADD COLUMN origin_cep text;
  END IF;
END $$;
