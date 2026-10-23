/*
# Add payment gateway settings to store_settings

1. Modified Tables
- `store_settings`: adds columns for Mercado Pago integration:
  - `mp_access_token` (text, nullable): token de acesso do Mercado Pago
  - `mp_public_key` (text, nullable): chave pública do Mercado Pago
  - `mp_environment` (text, default 'sandbox'): ambiente — 'sandbox' ou 'production'
  - `mp_enabled` (boolean, default false): liga/desliga o Mercado Pago como gateway
  - `mp_client_id` (text, nullable): ID do aplicativo no Mercado Pago
  - `mp_client_secret` (text, nullable): secret do aplicativo no Mercado Pago

2. Notes
- Todas as colunas são nullable ou têm defaults seguros.
- O gateway começa desativado (mp_enabled = false) até que o lojista configure suas credenciais.
- O ambiente padrão é sandbox para testes antes de ir a produção.
*/

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS mp_access_token text,
  ADD COLUMN IF NOT EXISTS mp_public_key text,
  ADD COLUMN IF NOT EXISTS mp_environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS mp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mp_client_id text,
  ADD COLUMN IF NOT EXISTS mp_client_secret text;
