/*
# Add free shipping enabled toggle to store settings

1. Modified Tables
- `store_settings`: adds `free_shipping_enabled` boolean column (default false).
  When false, the "free shipping above threshold" promotion is turned OFF and
  customers always pay the calculated freight. When true, the existing
  `free_shipping_threshold` behavior applies.

2. Notes
- Existing rows are seeded with `free_shipping_enabled = false` so the store
  starts with the promotion disabled, matching the owner's current intent.
- The `free_shipping_threshold` column is kept unchanged; the new boolean only
  gates whether it is honored at checkout.
*/

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS free_shipping_enabled boolean NOT NULL DEFAULT false;

UPDATE store_settings SET free_shipping_enabled = false WHERE id = 1;
