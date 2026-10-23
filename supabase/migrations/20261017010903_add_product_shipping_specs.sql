/*
# Add shipping specification columns to products

1. Modified Tables
- `products`: adds columns for package weight, dimensions, packaging margin, and declared value
  - `ship_weight_g` (integer, grams) — weight of the packaged product
  - `ship_length_cm` (numeric, cm) — package length
  - `ship_width_cm` (numeric, cm) — package width
  - `ship_height_cm` (numeric, cm) — package height
  - `ship_packaging_weight_g` (integer, grams, default 0) — extra weight from box/bubble wrap
  - `ship_packaging_cm` (integer, cm, default 0) — extra dimension added to each side for packaging
  - `ship_declared_value` (numeric, nullable) — declared value for transport insurance; null = use product price

2. Security
- No RLS changes. Existing policies on products remain unchanged.

3. Notes
- All columns are nullable with sensible defaults so existing products work without changes.
- The admin form will fill these in per product.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_weight_g') THEN
    ALTER TABLE products ADD COLUMN ship_weight_g integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_length_cm') THEN
    ALTER TABLE products ADD COLUMN ship_length_cm numeric(10,1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_width_cm') THEN
    ALTER TABLE products ADD COLUMN ship_width_cm numeric(10,1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_height_cm') THEN
    ALTER TABLE products ADD COLUMN ship_height_cm numeric(10,1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_packaging_weight_g') THEN
    ALTER TABLE products ADD COLUMN ship_packaging_weight_g integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_packaging_cm') THEN
    ALTER TABLE products ADD COLUMN ship_packaging_cm integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ship_declared_value') THEN
    ALTER TABLE products ADD COLUMN ship_declared_value numeric(12,2);
  END IF;
END $$;
