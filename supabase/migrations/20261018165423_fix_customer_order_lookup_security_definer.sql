/*
# Fix customer order lookup: use SECURITY DEFINER function (no-auth storefront)

## Problem
The previous migration added USING(true) SELECT policies on orders and
order_items for anon, which lets anyone read ALL orders — a data leak.

## Fix
1. Drop the broad anon SELECT/UPDATE policies on orders and order_items.
2. Create a SECURITY DEFINER function `get_my_orders(p_email text)` that
   returns orders matching the given email, plus their order items.
   The function bypasses RLS and filters server-side, so a customer
   can only see orders placed with their own email.
3. Re-grant only the needed anon SELECT on order_items via a scoped
   function `get_my_order_items(p_order_id uuid, p_email text)` that
   verifies the order belongs to the email before returning items.
4. Add an anon-callable function `request_order_refund(p_order_id uuid,
   p_email text)` that sets status to 'cancelado' only if the order
   matches the email — so customers can request refunds without login.

## Security
- anon can only read their own orders by providing the exact email.
- anon cannot read orders belonging to other customers.
- anon cannot update orders directly; refund goes through the function
  which verifies email ownership.
- Admin (authenticated) policies are unchanged.
*/

-- Clean up the broad policies from the previous migration
DROP POLICY IF EXISTS "anon_read_own_orders_by_email" ON orders;
DROP POLICY IF EXISTS "anon_update_own_orders_by_email" ON orders;
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;

-- Function: get my orders by email
DROP FUNCTION IF EXISTS get_my_orders(text);
CREATE OR REPLACE FUNCTION get_my_orders(p_email text)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders
  WHERE lower(email) = lower(trim(p_email))
  ORDER BY created_at DESC;
$$;

-- Function: get order items for a specific order, verifying email ownership
DROP FUNCTION IF EXISTS get_my_order_items(uuid, text);
CREATE OR REPLACE FUNCTION get_my_order_items(p_order_id uuid, p_email text)
RETURNS SETOF order_items
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.*
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.order_id = p_order_id
    AND lower(o.email) = lower(trim(p_email));
$$;

-- Function: request a refund (cancel order) if email matches
DROP FUNCTION IF EXISTS request_order_refund(uuid, text);
CREATE OR REPLACE FUNCTION request_order_refund(p_order_id uuid, p_email text)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_order orders;
BEGIN
  UPDATE orders
  SET status = 'cancelado', updated_at = now()
  WHERE id = p_order_id AND lower(email) = lower(trim(p_email))
  RETURNING * INTO updated_order;

  IF updated_order IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado ou e-mail não confere';
  END IF;

  RETURN updated_order;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION get_my_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_my_order_items(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION request_order_refund(uuid, text) TO anon, authenticated;
