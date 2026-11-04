/*
# Lock down sensitive columns from public (anon) access

## Problem
The `store_settings` and `shipping_carriers` tables had `USING (true)` policies
for all CRUD operations scoped to `anon, authenticated`. This meant any visitor
could SELECT all columns — including `mp_access_token`, `mp_client_secret`,
`resend_api_key` on `store_settings` and `api_key` on `shipping_carriers` — and
could also INSERT/UPDATE/DELETE rows.

## Changes
1. `store_settings`:
   - Revoke ALL privileges from `anon` on the table.
   - Grant `anon` SELECT only on public-safe columns (store name, contact info,
     social links, announcement, free shipping config, pix discount, installments,
     logo, color, footer text, origin CEP, mp_enabled, mp_environment — NOT the
     secret keys/tokens).
   - Drop the `USING (true)` INSERT/UPDATE/DELETE policies for anon.
   - Keep SELECT policy as `USING (true)` (the row is public store config).
   - Keep INSERT/UPDATE/DELETE policies scoped to `authenticated` only with
     `is_store_admin()` check.
2. `shipping_carriers`:
   - Revoke ALL privileges from `anon` on the table.
   - Grant `anon` SELECT only on safe columns (id, name, code, provider,
     environment, services, enabled, sort_order — NOT `api_key`, `api_url`).
   - Keep SELECT policy `USING (true)` for anon read of enabled carriers.
   - Restrict INSERT/UPDATE/DELETE policies to `authenticated` with
     `is_store_admin()` check.
3. Both tables: keep `authenticated` full access for admin panel operations.
*/

-- ===================== store_settings =====================

-- Revoke everything from anon first
REVOKE ALL PRIVILEGES ON store_settings FROM anon;

-- Grant anon SELECT only on public-safe columns
GRANT SELECT (
  id,
  store_name,
  store_short_name,
  store_tagline,
  logo_url,
  primary_color,
  announcement_text,
  announcement_enabled,
  whatsapp_number,
  whatsapp_message,
  email_contact,
  instagram_url,
  facebook_url,
  free_shipping_enabled,
  free_shipping_threshold,
  pix_discount_percent,
  max_installments,
  cnpj,
  footer_about,
  origin_cep,
  mp_enabled,
  mp_environment
) ON store_settings TO anon;

-- Drop the old anon-friendly INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "admin_insert_store_settings" ON store_settings;
DROP POLICY IF EXISTS "admin_update_store_settings" ON store_settings;

-- Keep the public SELECT policy (already exists, reaffirm)
-- public_read_store_settings already has USING(true) — that's fine for the
-- single public config row, since anon can only SELECT safe columns now.

-- Create admin-only write policies scoped to is_store_admin()
CREATE POLICY "admin_insert_store_settings_v2"
  ON store_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_store_admin());

CREATE POLICY "admin_update_store_settings_v2"
  ON store_settings FOR UPDATE
  TO authenticated
  USING (is_store_admin())
  WITH CHECK (is_store_admin());

-- Ensure authenticated keeps full table access
GRANT SELECT, INSERT, UPDATE, DELETE ON store_settings TO authenticated;

-- ===================== shipping_carriers =====================

-- Revoke everything from anon
REVOKE ALL PRIVILEGES ON shipping_carriers FROM anon;

-- Grant anon SELECT only on safe columns (no api_key, no api_url)
GRANT SELECT (
  id,
  name,
  code,
  provider,
  environment,
  services,
  enabled,
  sort_order
) ON shipping_carriers TO anon;

-- Drop old USING(true) write policies
DROP POLICY IF EXISTS "insert_shipping_carriers" ON shipping_carriers;
DROP POLICY IF EXISTS "update_shipping_carriers" ON shipping_carriers;
DROP POLICY IF EXISTS "delete_shipping_carriers" ON shipping_carriers;

-- Create admin-only write policies
CREATE POLICY "admin_insert_shipping_carriers"
  ON shipping_carriers FOR INSERT
  TO authenticated
  WITH CHECK (is_store_admin());

CREATE POLICY "admin_update_shipping_carriers"
  ON shipping_carriers FOR UPDATE
  TO authenticated
  USING (is_store_admin())
  WITH CHECK (is_store_admin());

CREATE POLICY "admin_delete_shipping_carriers"
  ON shipping_carriers FOR DELETE
  TO authenticated
  USING (is_store_admin());

-- Ensure authenticated keeps full access
GRANT SELECT, INSERT, UPDATE, DELETE ON shipping_carriers TO authenticated;
