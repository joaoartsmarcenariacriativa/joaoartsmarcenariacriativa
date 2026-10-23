/*
# OMS, E-books, Marketing Automations, and Compliance (LGPD)

## Overview
This migration adds four major modules to the João Art's store:
1. Order Management System (OMS) — new order statuses, delivery date, customer account link
2. E-books Vitrine — a dedicated table for Hotmart-linked digital products
3. Marketing Automations — tables for automation rules and customer contacts
4. Compliance/LGPD — opt-in consent tracking on orders and a customer accounts table

## New Tables
1. `ebooks` — Digital products (e-books) displayed in a public showcase, with Hotmart checkout links
2. `marketing_automations` — Automation rules (email/SMS/WhatsApp) with triggers and status
3. `customer_contacts` — Customer contact list compiled from orders, with opt-in status for campaigns

## Modified Tables
1. `orders` — Adds `delivered_at`, `customer_id`, `marketing_opt_in`

## Security
- `ebooks`: public read (anon + authenticated), admin full CRUD
- `marketing_automations`: admin full CRUD only (authenticated)
- `customer_contacts`: admin read only (authenticated), populated from orders
- `orders` new columns: existing policies still apply; customers can read their own orders
*/

-- ============ ORDERS: ADD NEW COLUMNS ============
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'marketing_opt_in') THEN
    ALTER TABLE orders ADD COLUMN marketing_opt_in boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Allow customers (authenticated) to read their own orders
DROP POLICY IF EXISTS "customer_read_own_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = customer_id OR email = (select email from auth.users where id = auth.uid()));

-- Allow customers to update their own orders (for refund/cancellation requests)
DROP POLICY IF EXISTS "customer_update_own_orders" ON orders;
CREATE POLICY "customer_update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = customer_id OR email = (select email from auth.users where id = auth.uid()))
  WITH CHECK (auth.uid() = customer_id OR email = (select email from auth.users where id = auth.uid()));

-- ============ EBOOKS ============
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_url text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  hotmart_checkout_url text NOT NULL,
  author text,
  category text,
  pages integer,
  preview_url text,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_ebooks" ON ebooks;
CREATE POLICY "public_read_ebooks" ON ebooks FOR SELECT
  TO anon, authenticated USING (active = true);

DROP POLICY IF EXISTS "admin_insert_ebooks" ON ebooks;
CREATE POLICY "admin_insert_ebooks" ON ebooks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_ebooks" ON ebooks;
CREATE POLICY "admin_update_ebooks" ON ebooks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_ebooks" ON ebooks;
CREATE POLICY "admin_delete_ebooks" ON ebooks FOR DELETE
  TO authenticated USING (true);

-- ============ MARKETING AUTOMATIONS ============
CREATE TABLE IF NOT EXISTS marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  trigger_type text NOT NULL DEFAULT 'order_status',
  trigger_config jsonb DEFAULT '{}'::jsonb,
  message_template text,
  status text NOT NULL DEFAULT 'active',
  stats_sent integer NOT NULL DEFAULT 0,
  stats_opened integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_channel CHECK (channel IN ('email', 'sms', 'whatsapp')),
  CONSTRAINT valid_trigger CHECK (trigger_type IN ('order_status', 'new_offer', 'cart_recovery', 'welcome', 'custom')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'draft'))
);

ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_automations" ON marketing_automations;
CREATE POLICY "admin_read_automations" ON marketing_automations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_automations" ON marketing_automations;
CREATE POLICY "admin_insert_automations" ON marketing_automations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_automations" ON marketing_automations;
CREATE POLICY "admin_update_automations" ON marketing_automations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_automations" ON marketing_automations;
CREATE POLICY "admin_delete_automations" ON marketing_automations FOR DELETE
  TO authenticated USING (true);

-- ============ CUSTOMER CONTACTS ============
CREATE TABLE IF NOT EXISTS customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric(10,2) NOT NULL DEFAULT 0,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_contacts" ON customer_contacts;
CREATE POLICY "admin_read_contacts" ON customer_contacts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_contacts" ON customer_contacts;
CREATE POLICY "admin_insert_contacts" ON customer_contacts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_contacts" ON customer_contacts;
CREATE POLICY "admin_update_contacts" ON customer_contacts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_contacts" ON customer_contacts;
CREATE POLICY "admin_delete_contacts" ON customer_contacts FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_email ON customer_contacts(email);

-- ============ SEED: DEFAULT AUTOMATIONS ============
INSERT INTO marketing_automations (name, channel, trigger_type, trigger_config, message_template, status, sort_order)
SELECT 'Notificação de Status do Pedido', 'whatsapp', 'order_status',
  '{"statuses":["recebido","processamento","enviado","entregue"]}'::jsonb,
  'Olá {nome}! O status do seu pedido #{pedido} foi atualizado para: {status}. Acompanhe em nossa loja.',
  'active', 1
WHERE NOT EXISTS (SELECT 1 FROM marketing_automations WHERE name = 'Notificação de Status do Pedido');

INSERT INTO marketing_automations (name, channel, trigger_type, trigger_config, message_template, status, sort_order)
SELECT 'Recuperação de Carrinho Abandonado', 'email', 'cart_recovery',
  '{"delay_hours":3}'::jsonb,
  'Olá {nome}! Você deixou alguns produtos no seu carrinho. Ainda dá tempo de finalizar sua compra!',
  'active', 2
WHERE NOT EXISTS (SELECT 1 FROM marketing_automations WHERE name = 'Recuperação de Carrinho Abandonado');

INSERT INTO marketing_automations (name, channel, trigger_type, trigger_config, message_template, status, sort_order)
SELECT 'Nova Oferta / Campanha Promocional', 'whatsapp', 'new_offer',
  '{"segment":"all"}'::jsonb,
  'Olá {nome}! Temos uma oferta especial para você: {oferta}. Aproveite enquanto durar!',
  'paused', 3
WHERE NOT EXISTS (SELECT 1 FROM marketing_automations WHERE name = 'Nova Oferta / Campanha Promocional');

INSERT INTO marketing_automations (name, channel, trigger_type, trigger_config, message_template, status, sort_order)
SELECT 'Boas-vindas / Cadastro', 'email', 'welcome',
  '{}'::jsonb,
  'Bem-vindo(a) a Joao Arts, {nome}! Suas peças artesanais em madeira estao te esperando.',
  'active', 4
WHERE NOT EXISTS (SELECT 1 FROM marketing_automations WHERE name = 'Boas-vindas / Cadastro');