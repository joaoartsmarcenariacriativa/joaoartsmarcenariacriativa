/*
# Protect shipping carrier credentials

1. Plain-English explanation
- Shipping carrier records contain private API tokens used only by the server
  to request quotes and issue labels.
- Visitors do not need to read these records; the checkout calls the secure
  shipping function instead.

2. Modified tables
- `shipping_carriers`: public anonymous reads are removed. Authenticated
  administrator screens can still read and update configured carriers.

3. Security changes
- Replaces the anonymous SELECT policy with an authenticated-only SELECT policy.
- The server-side shipping function uses the service role and is not affected.
- No data is deleted and no existing columns are changed.
*/

DROP POLICY IF EXISTS "select_shipping_carriers" ON shipping_carriers;
CREATE POLICY "select_shipping_carriers"
ON shipping_carriers FOR SELECT
TO authenticated
USING (true);