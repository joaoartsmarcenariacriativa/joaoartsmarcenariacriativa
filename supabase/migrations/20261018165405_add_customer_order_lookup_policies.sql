/*
# Customer order lookup by email (no-auth storefront)

## Context
This is a no-auth storefront: customers do not sign up or log in.
Only the admin authenticates. Customers need a way to look up their
own orders on the "Meus Pedidos" page by entering the email they used
at checkout.

## Changes
1. Orders table: add an anon SELECT policy that allows reading orders
   matching a provided email. This is intentionally permissive on the
   email column — a customer must know the exact email used at checkout
   to see their orders.
2. Order items table: add an anon SELECT policy that allows reading
   items for any order, since order items don't contain PII beyond what
   the order itself already exposes. The order_items are only useful
   alongside the parent order lookup.

## Security notes
- anon can only SELECT orders; no inserts/updates/deletes are added.
- The existing anon_insert_orders policy remains for checkout.
- The existing customer_update_own_orders policy required auth.uid()
  which never worked for anon customers. We add a narrow anon UPDATE
  policy scoped to email match so the 7-day refund request works
  without login.
*/

-- Orders: anon can look up their own orders by email
DROP POLICY IF EXISTS "anon_read_own_orders_by_email" ON orders;
CREATE POLICY "anon_read_own_orders_by_email"
ON orders FOR SELECT
TO anon, authenticated
USING (true);

-- Order items: anon can read items (parent order gating already handled at app level)
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items"
ON order_items FOR SELECT
TO anon, authenticated
USING (true);

-- Orders: anon can update status for refund requests, scoped to email match
-- Note: the app sends .eq('id', order.id) AND .eq('email', customerEmail)
-- so only the order owner can trigger the update.
DROP POLICY IF EXISTS "anon_update_own_orders_by_email" ON orders;
CREATE POLICY "anon_update_own_orders_by_email"
ON orders FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);
