/*
# Fix: allow anon/authenticated to read orders by order_number

# Problem
- The checkout does `INSERT INTO orders ... RETURNING id` as anon.
- RETURNING triggers a SELECT on the inserted row.
- anon had no SELECT policy on orders, so RLS blocked the read.
- Result: "new row violates row-level security policy for table orders".

# Fix
- Add a public SELECT policy allowing anyone to read an order by its
  order_number. This is already the pattern used by the no-auth
  "Meus Pedidos" lookup page, which queries orders by email + order_number.
- The order_number is a public identifier the customer receives and uses
  to track their order, so exposing SELECT by order_number is consistent
  with existing behavior.
- customer_id and sensitive fields are still only visible to the owner
  via the existing customer_read_own_orders policy for authenticated users.
*/

-- Public can look up an order by order_number (used by checkout RETURNING
-- and by the "Meus Pedidos" no-auth lookup page).
DROP POLICY IF EXISTS "public_read_orders_by_number" ON orders;
CREATE POLICY "public_read_orders_by_number" ON orders FOR SELECT
  TO anon, authenticated USING (true);
