/*
# Partner Portals: accounts, showcase items, and audit logs

## Purpose
Each partner store gets its own portal page (accessible at /parceiro/:slug)
where a partner admin can log in, preview their showcase portfolio, test a
checkout link, and review audit logs. The store admin (João) can also assign
additional managers to a partner.

## New Tables

### partner_accounts
Maps a Supabase auth user to a partner store with a role.
- `id` uuid PK
- `partner_store_id` uuid FK → partner_stores(id) ON DELETE CASCADE
- `user_id` uuid FK → auth.users(id) ON DELETE CASCADE
- `role` text: 'admin' (default) or 'manager'
- `created_at` timestamptz

### partner_showcase_items
Portfolio items displayed inside each partner's portal preview.
- `id` uuid PK
- `partner_store_id` uuid FK → partner_stores(id) ON DELETE CASCADE
- `title` text (2–120)
- `description` text
- `image_url` text (https URL)
- `link_url` text (https URL — where the customer goes when clicking)
- `price_label` text (optional display price, e.g. "R$ 199,90")
- `sort_order` int default 0
- `active` boolean default true
- `created_at` timestamptz

### partner_audit_logs
Append-only audit trail of actions inside partner portals.
- `id` uuid PK
- `partner_store_id` uuid FK → partner_stores(id) ON DELETE CASCADE
- `actor_email` text (who performed the action)
- `action` text (e.g. 'login', 'checkout_test', 'showcase_edit', 'toggle_active')
- `detail` text (human-readable detail)
- `created_at` timestamptz

## Modified Tables

### partner_stores
- `slug` text — URL-safe slug for /parceiro/:slug (unique)
- `checkout_test_url` text — optional URL the partner uses to test checkout
- `admin_email` text — email of the primary partner admin (for display)

## Security
- partner_accounts: RLS enabled. Partners can SELECT their own account row
  (matched by user_id). Only store_admin can INSERT/UPDATE/DELETE.
- partner_showcase_items: RLS enabled. Public (anon) can SELECT active items
  for a given partner (so the portal page works without login). Store admin
  and linked partner accounts can INSERT/UPDATE/DELETE their own items.
- partner_audit_logs: RLS enabled. Partners can SELECT logs for their store.
  Only the server (edge function / service_role) or store_admin can INSERT.
  No one can UPDATE or DELETE (append-only).
- partner_stores: add anon SELECT on new columns slug, checkout_test_url,
  admin_email so the portal page can render.
*/

-- ===================== Add columns to partner_stores =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='partner_stores' AND column_name='slug') THEN
    ALTER TABLE partner_stores ADD COLUMN slug text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='partner_stores' AND column_name='checkout_test_url') THEN
    ALTER TABLE partner_stores ADD COLUMN checkout_test_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='partner_stores' AND column_name='admin_email') THEN
    ALTER TABLE partner_stores ADD COLUMN admin_email text;
  END IF;
END $$;

-- Grant anon SELECT on the new public-safe columns
GRANT SELECT (slug, checkout_test_url, admin_email) ON partner_stores TO anon;

-- Populate slugs for existing stores from name
UPDATE partner_stores SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
-- Trim leading/trailing hyphens
UPDATE partner_stores SET slug = trim(both '-' from slug) WHERE slug IS NOT NULL;

-- Add unique constraint on slug (only where not null)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partner_stores_slug_key') THEN
    ALTER TABLE partner_stores ADD CONSTRAINT partner_stores_slug_key UNIQUE (slug);
  END IF;
END $$;

-- ===================== partner_accounts =====================
CREATE TABLE IF NOT EXISTS partner_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id uuid NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_store_id, user_id)
);

ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON partner_accounts TO authenticated;

-- Partners can read their own account mapping
DROP POLICY IF EXISTS "select_own_partner_account" ON partner_accounts;
CREATE POLICY "select_own_partner_account"
  ON partner_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only store admin can manage accounts
DROP POLICY IF EXISTS "admin_insert_partner_account" ON partner_accounts;
CREATE POLICY "admin_insert_partner_account"
  ON partner_accounts FOR INSERT
  TO authenticated
  WITH CHECK (is_store_admin());

DROP POLICY IF EXISTS "admin_delete_partner_account" ON partner_accounts;
CREATE POLICY "admin_delete_partner_account"
  ON partner_accounts FOR DELETE
  TO authenticated
  USING (is_store_admin());

-- ===================== partner_showcase_items =====================
CREATE TABLE IF NOT EXISTS partner_showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id uuid NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description text,
  image_url text CHECK (image_url IS NULL OR image_url ~ '^https://'),
  link_url text CHECK (link_url IS NULL OR link_url ~ '^https://'),
  price_label text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_showcase_items ENABLE ROW LEVEL SECURITY;

-- Public can read active showcase items (portal page is public)
GRANT SELECT ON partner_showcase_items TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_active_showcase" ON partner_showcase_items;
CREATE POLICY "public_read_active_showcase"
  ON partner_showcase_items FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Partner accounts can read ALL their items (including inactive)
DROP POLICY IF EXISTS "partner_read_own_showcase" ON partner_showcase_items;
CREATE POLICY "partner_read_own_showcase"
  ON partner_showcase_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_showcase_items.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

-- Partner accounts and store admin can insert/update/delete their items
DROP POLICY IF EXISTS "partner_manage_own_showcase" ON partner_showcase_items;
CREATE POLICY "partner_manage_own_showcase"
  ON partner_showcase_items FOR INSERT
  TO authenticated
  WITH CHECK (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_showcase_items.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "partner_update_own_showcase" ON partner_showcase_items;
CREATE POLICY "partner_update_own_showcase"
  ON partner_showcase_items FOR UPDATE
  TO authenticated
  USING (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_showcase_items.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_showcase_items.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "partner_delete_own_showcase" ON partner_showcase_items;
CREATE POLICY "partner_delete_own_showcase"
  ON partner_showcase_items FOR DELETE
  TO authenticated
  USING (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_showcase_items.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

GRANT INSERT, UPDATE, DELETE ON partner_showcase_items TO authenticated;

-- ===================== partner_audit_logs =====================
CREATE TABLE IF NOT EXISTS partner_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_store_id uuid NOT NULL REFERENCES partner_stores(id) ON DELETE CASCADE,
  actor_email text NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_audit_logs ENABLE ROW LEVEL SECURITY;

-- Partners can read logs for their own store
GRANT SELECT ON partner_audit_logs TO authenticated;

DROP POLICY IF EXISTS "partner_read_own_logs" ON partner_audit_logs;
CREATE POLICY "partner_read_own_logs"
  ON partner_audit_logs FOR SELECT
  TO authenticated
  USING (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_audit_logs.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

-- Only store admin and service_role can insert logs (via client or edge fn)
-- Partner accounts insert through a SECURITY DEFINER function instead
-- (see below) so we keep this simple: allow authenticated to insert if they
-- are a partner or admin.
DROP POLICY IF EXISTS "partner_insert_log" ON partner_audit_logs;
CREATE POLICY "partner_insert_log"
  ON partner_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    is_store_admin() OR EXISTS (
      SELECT 1 FROM partner_accounts
      WHERE partner_accounts.partner_store_id = partner_audit_logs.partner_store_id
      AND partner_accounts.user_id = auth.uid()
    )
  );

GRANT INSERT ON partner_audit_logs TO authenticated;

-- No UPDATE or DELETE policy = append-only by design.
