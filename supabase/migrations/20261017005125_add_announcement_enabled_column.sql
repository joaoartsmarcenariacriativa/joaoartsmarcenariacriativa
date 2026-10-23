/*
# Add announcement_enabled column to store_settings

1. Modified Tables
- `store_settings`: adds `announcement_enabled` boolean column (default true)
  so the admin can toggle the top announcement bar on/off without deleting the text.

2. Security
- No RLS changes. Existing policies on store_settings remain unchanged.

3. Notes
- Default is `true` so the announcement bar stays visible for existing stores.
- The column is nullable-safe with a default, so old inserts still work.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'announcement_enabled'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN announcement_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;
