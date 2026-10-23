/*
# Add shipping gateway tracking to orders

1. Plain-English explanation
- When the customer chooses a shipping option at checkout, the option can come
  from different quoting platforms (Melhor Envio or SuperFrete). To issue the
  shipping label in the correct platform later, the order must record which
  platform (gateway) provided the chosen service.

2. Modified tables
- `orders`: adds `shipping_gateway` (text, nullable) — stores 'melhorenvio'
  or 'superfrete' depending on which platform the customer's chosen quote
  came from; also adds `shipping_service_id` (text, nullable) — stores the
  platform's service code for the chosen option.

3. Security
- No RLS changes: the new columns are plain data columns on the existing
  `orders` table, which already has RLS policies in place.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_gateway text;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_service_id text;