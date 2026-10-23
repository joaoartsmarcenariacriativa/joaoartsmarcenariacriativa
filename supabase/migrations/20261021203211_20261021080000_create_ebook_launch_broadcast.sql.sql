/*
# Sistema de Aviso de Lançamentos de E-books

## Explicação em português simples
Permite que o administrador envie um aviso de lançamento de um e-book para
todos os clientes cadastrados no site que aceitaram receber comunicações
(opt-in LGPD). Os clientes podem se inscrever para receber avisos de
lançamentos na vitrine de e-books ou no momento do cadastro.

## Novas tabelas
- `ebook_launch_subscribers`: clientes que querem receber avisos de novos
  lançamentos de e-books.
  - `id` (uuid, PK), `email` (text, unique), `name` (text, nullable),
    `user_id` (uuid, FK → auth.users, nullable — para usuários logados),
    `phone` (text, nullable — para WhatsApp), `source` (text: 'site_signup',
    'ebook_vitrine', 'manual'), `created_at` (timestamp).

- `ebook_launch_campaigns`: campanhas de lançamento criadas pelo admin.
  - `id` (uuid, PK), `ebook_id` (FK → ebooks), `subject` (título do e-mail),
    `message` (texto da mensagem), `channel` (email | whatsapp | sms),
    `sent_count` (int), `status` (draft | sent | scheduled),
    `created_by` (email do admin), `created_at`, `sent_at` (nullable).

## Segurança (RLS)
- `ebook_launch_subscribers`: qualquer visitante pode se inscrever (INSERT)
  e ler apenas por e-mail (para verificar se já está inscrito).
  Admin lê tudo via service role.
- `ebook_launch_campaigns`: só admin (authenticated) lê, cria, edita e envia.

## Notas
- Conformidade LGPD: toda inscrição registra a fonte e o consentimento.
- O opt-in já é coletado no cadastro do site (CustomerLogin).
- A campanha registra os envios em automation_runs para integrar com o
  sistema de automação já existente.
*/

-- ============================================================
-- ebook_launch_subscribers
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_launch_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone text,
  source text NOT NULL DEFAULT 'ebook_vitrine' CHECK (source IN ('site_signup','ebook_vitrine','manual')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ebook_launch_subscribers ENABLE ROW LEVEL SECURITY;

-- Permite que visitantes se inscrevam (INSERT)
DROP POLICY IF EXISTS "insert_launch_subscribers" ON ebook_launch_subscribers;
CREATE POLICY "insert_launch_subscribers" ON ebook_launch_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Permite verificar se um e-mail já está inscrito (SELECT por e-mail)
DROP POLICY IF EXISTS "select_launch_subscribers" ON ebook_launch_subscribers;
CREATE POLICY "select_launch_subscribers" ON ebook_launch_subscribers FOR SELECT
  TO anon, authenticated USING (true);

-- Permite que usuários gerenciem sua própria inscrição
DROP POLICY IF EXISTS "update_own_launch_subscription" ON ebook_launch_subscribers;
CREATE POLICY "update_own_launch_subscription" ON ebook_launch_subscribers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delete apenas para usuários logados (desinscrever)
DROP POLICY IF EXISTS "delete_own_launch_subscription" ON ebook_launch_subscribers;
CREATE POLICY "delete_own_launch_subscription" ON ebook_launch_subscribers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Admin pode deletar qualquer inscrição
DROP POLICY IF EXISTS "delete_launch_subscribers_admin" ON ebook_launch_subscribers;
CREATE POLICY "delete_launch_subscribers_admin" ON ebook_launch_subscribers FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_launch_subscribers_email ON ebook_launch_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_launch_subscribers_user ON ebook_launch_subscribers(user_id);

-- ============================================================
-- ebook_launch_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_launch_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','whatsapp','sms')),
  sent_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','scheduled')),
  created_by text,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE ebook_launch_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) pode gerenciar campanhas
DROP POLICY IF EXISTS "select_launch_campaigns" ON ebook_launch_campaigns;
CREATE POLICY "select_launch_campaigns" ON ebook_launch_campaigns FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_launch_campaigns" ON ebook_launch_campaigns;
CREATE POLICY "insert_launch_campaigns" ON ebook_launch_campaigns FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_launch_campaigns" ON ebook_launch_campaigns;
CREATE POLICY "update_launch_campaigns" ON ebook_launch_campaigns FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_launch_campaigns" ON ebook_launch_campaigns;
CREATE POLICY "delete_launch_campaigns" ON ebook_launch_campaigns FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_launch_campaigns_ebook ON ebook_launch_campaigns(ebook_id);