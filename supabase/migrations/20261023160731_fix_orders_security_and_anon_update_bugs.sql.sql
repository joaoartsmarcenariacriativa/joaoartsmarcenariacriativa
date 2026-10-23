/*
# Security fix: eliminate broad public SELECT on orders + fix anon UPDATE bugs

## Problems found
1. CRITICAL: `public_read_orders_by_number` SELECT policy uses USING(true),
   letting ANYONE read ALL orders via the REST API (names, emails, totals,
   addresses, etc.) — a full data leak.
2. OrderReturnPage and checkout MP-notes update call `.update()` as anon,
   but there is no anon UPDATE policy on orders — these updates silently fail.
3. `trigger_order_status_automation()` is a trigger function (not meant to be
   called by clients) but is EXECUTE-able by anon and authenticated.

## Fix
1. Drop `public_read_orders_by_number` SELECT policy.
2. Drop `anon_insert_orders` INSERT policy (replaced by create_order function).
3. Create `create_order(p_payload jsonb)` SECURITY DEFINER function: inserts an
   order and returns the full row — replaces checkout's direct insert+RETURNING.
4. Create `process_payment_return(p_order_number text, p_payment_status text)`
   SECURITY DEFINER function: reads the order by number, updates payment_status
   and order status, returns minimal public info (order_number, total, name).
5. Create `set_order_notes(p_order_id uuid, p_notes text)` SECURITY DEFINER
   function: for the checkout to record the MP preference ID.
6. Revoke EXECUTE on trigger_order_status_automation from anon and authenticated.
*/

-- 1. Drop the leaky SELECT policy
DROP POLICY IF EXISTS "public_read_orders_by_number" ON orders;

-- 2. Drop the anon INSERT policy (function replaces it)
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;

-- 3. create_order function
CREATE OR REPLACE FUNCTION create_order(p_payload jsonb)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order orders;
BEGIN
  INSERT INTO orders (
    order_number, customer_name, email, phone, cep, address,
    city, state, total, shipping_cost, status, payment_method,
    payment_status, marketing_opt_in, customer_id,
    shipping_carrier_name, shipping_service_name, shipping_gateway,
    shipping_service_id
  ) VALUES (
    p_payload->>'order_number',
    p_payload->>'customer_name',
    p_payload->>'email',
    p_payload->>'phone',
    p_payload->>'cep',
    p_payload->>'address',
    p_payload->>'city',
    p_payload->>'state',
    (p_payload->>'total')::numeric,
    (p_payload->>'shipping_cost')::numeric,
    COALESCE(p_payload->>'status', 'recebido'),
    p_payload->>'payment_method',
    COALESCE(p_payload->>'payment_status', 'pending'),
    COALESCE((p_payload->>'marketing_opt_in')::boolean, false),
    NULLIF(p_payload->>'customer_id', '')::uuid,
    NULLIF(p_payload->>'shipping_carrier_name', ''),
    NULLIF(p_payload->>'shipping_service_name', ''),
    NULLIF(p_payload->>'shipping_gateway', ''),
    NULLIF(p_payload->>'shipping_service_id', '')
  )
  RETURNING * INTO new_order;

  RETURN new_order;
END;
$$;

-- 4. process_payment_return function
CREATE OR REPLACE FUNCTION process_payment_return(
  p_order_number text,
  p_payment_status text
)
RETURNS TABLE(order_number text, total numeric, customer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number text;
  v_total numeric;
  v_customer_name text;
BEGIN
  SELECT o.order_number, o.total, o.customer_name
    INTO v_order_number, v_total, v_customer_name
  FROM orders o
  WHERE o.order_number = p_order_number;

  IF v_order_number IS NULL THEN
    RETURN;
  END IF;

  IF p_payment_status = 'success' THEN
    UPDATE orders SET payment_status = 'paid', status = 'processamento', updated_at = now()
    WHERE order_number = p_order_number;
  ELSIF p_payment_status = 'pending' THEN
    UPDATE orders SET payment_status = 'pending', updated_at = now()
    WHERE order_number = p_order_number;
  ELSE
    UPDATE orders SET payment_status = 'failed', status = 'recebido', updated_at = now()
    WHERE order_number = p_order_number;
  END IF;

  RETURN QUERY SELECT v_order_number, v_total, v_customer_name;
END;
$$;

-- 5. set_order_notes function (for MP preference ID)
CREATE OR REPLACE FUNCTION set_order_notes(p_order_id uuid, p_notes text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE orders SET notes = p_notes, updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- Grant execute on the public-facing functions
GRANT EXECUTE ON FUNCTION create_order(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_payment_return(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_order_notes(uuid, text) TO anon, authenticated;

-- 6. Revoke EXECUTE on the trigger function — it should only fire via trigger, not via RPC
REVOKE EXECUTE ON FUNCTION trigger_order_status_automation() FROM anon, authenticated;