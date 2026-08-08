-- 19: Add selected_addons column to bookings
-- Stores the add-on services the customer added to their Lawn Mowing
-- booking. Each entry is { id, name, price, icon }.
--
-- Format: JSONB array, e.g.
--   [
--     {"id":"edging","name":"Edging","price":15,"icon":"✂️"},
--     {"id":"leaf_blowing","name":"Leaf Blowing","price":20,"icon":"🍂"}
--   ]
--
-- Total addon price is added to the base price in the application
-- (see src/lib/addons.ts calculateAddonTotal). Pro payout is
-- 80% of the full total (base + addons), same as base.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;

-- Optional: index for analytics queries that filter by addon
-- (e.g. "how many customers added edging in Q3?")
CREATE INDEX IF NOT EXISTS idx_bookings_selected_addons
  ON bookings USING gin (selected_addons);

-- Comment for future devs
COMMENT ON COLUMN bookings.selected_addons IS
  'Array of add-on services the customer selected. Each item: {id, name, price, icon}. Empty array if none.';
