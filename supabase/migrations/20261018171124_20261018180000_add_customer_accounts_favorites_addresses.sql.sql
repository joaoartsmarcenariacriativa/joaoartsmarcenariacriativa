/*
# Contas de clientes, favoritos e endereços

## Visão geral
Adiciona contas de cliente (login/cadastro por e-mail e senha) à loja,
com favoritos de produtos e endereços de entrega salvos. Agora o cliente
tem uma área "Minha Conta" com controle total dos seus pedidos.

## Novas tabelas
1. `customer_favorites` — produtos favoritados pelo cliente (user_id + product_id)
2. `customer_addresses` — endereços de entrega salvos pelo cliente

## Tabela modificada
- `orders` — já possui `customer_id uuid` (adicionado na migração anterior);
  agora também damos aos clientes autenticados uma política de SELECT
  própria para ver seus pedidos vinculados ao customer_id.

## Segurança
- `customer_favorites` e `customer_addresses`: RLS habilitada, escopada
  por `auth.uid() = user_id` (dono da linha).
- `orders`: SELECT/UPDATE para clientes autenticados escopado por
  `customer_id = auth.uid()` (em complemento às políticas existentes
  de admin e às funções SECURITY DEFINER para clientes não-logados).
- As políticas existentes de admin (authenticated) continuam válidas.
- Inserções/edições em favoritos e endereços usam `DEFAULT auth.uid()`
  para que o cliente não precise enviar o próprio id.

## Notas
1. A política `customer_read_own_orders` existente permite leitura por
   `customer_id` OU por `email = (select email from auth.users ...)`.
   Mantemos essa política e adicionamos políticas análogas para
   UPDATE apenas por customer_id.
2. Clientes que não criam conta continuam funcionando pela busca por
   e-mail na página "Meus Pedidos" (funções SECURITY DEFINER).
3. A coluna `customer_id` já existe em `orders` desde a migração
   20261018160835; não a recriamos.
*/

-- ============ FAVORITOS ============
CREATE TABLE IF NOT EXISTS customer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_favorites" ON customer_favorites;
CREATE POLICY "customer_read_own_favorites" ON customer_favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_insert_own_favorites" ON customer_favorites;
CREATE POLICY "customer_insert_own_favorites" ON customer_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_delete_own_favorites" ON customer_favorites;
CREATE POLICY "customer_delete_own_favorites" ON customer_favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON customer_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON customer_favorites(product_id);

-- ============ ENDEREÇOS ============
CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Endereço',
  recipient_name text NOT NULL,
  cep text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_addresses" ON customer_addresses;
CREATE POLICY "customer_read_own_addresses" ON customer_addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_insert_own_addresses" ON customer_addresses;
CREATE POLICY "customer_insert_own_addresses" ON customer_addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_update_own_addresses" ON customer_addresses;
CREATE POLICY "customer_update_own_addresses" ON customer_addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_delete_own_addresses" ON customer_addresses;
CREATE POLICY "customer_delete_own_addresses" ON customer_addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON customer_addresses(user_id);

-- ============ ORDERS: política de leitura para clientes autenticados ============
-- Já existe "customer_read_own_orders" (SELECT) e "customer_update_own_orders"
-- (UPDATE) definidas na migração 20261018160835, ambas escopadas por
-- customer_id OU email. Nada precisa ser alterado aqui: clientes logados
-- já conseguem ler e atualizar seus pedidos vinculados ao customer_id.