-- Add videos column to product_reviews so customers can attach video clips alongside photos.
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS videos text[] NOT NULL DEFAULT '{}';

-- No RLS policy changes needed: existing insert/update/select policies already cover all columns
-- of product_reviews (column-level privileges are not restricted on this table).