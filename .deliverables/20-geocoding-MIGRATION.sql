-- 20: Geocoding support for addresses (GPS geofencing)
-- Adds lat/lng columns to addresses so we can:
--   1. Show a map of the job site to the pro
--   2. Verify the pro is actually AT the job site when they mark complete
--      (prevents the "snap a photo at home, get paid, never mow" scam)
--
-- This is part of the "Escrow + Proof Matrix" anti-fraud pattern.

-- Add the columns if not already there
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS geocode_source TEXT;

-- Index for fast distance lookups (B-tree on lat/lng combo is fine for v1;
-- PostGIS would be better at scale, but we don't have it on free tier)
CREATE INDEX IF NOT EXISTS idx_addresses_lat_lng
  ON addresses (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment for future devs
COMMENT ON COLUMN addresses.latitude IS 'GPS latitude, set when the address is geocoded. Used for live tracking + geofence checks.';
COMMENT ON COLUMN addresses.longitude IS 'GPS longitude, set when the address is geocoded. Used for live tracking + geofence checks.';
COMMENT ON COLUMN addresses.geocoded_at IS 'When the address was last geocoded. NULL means it has never been geocoded (e.g. legacy addresses).';
COMMENT ON COLUMN addresses.geocode_source IS 'Which geocoder produced these coords: nominatim, manual, etc. NULL = not geocoded.';
