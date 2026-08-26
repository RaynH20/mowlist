-- 1. Ensure PostGIS (geographic calculations extension) is active
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add standby tracking columns to provider_profiles
ALTER TABLE provider_profiles 
  ADD COLUMN IF NOT EXISTS is_on_standby BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS standby_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION;

-- 3. Create indexes on coordinate columns for fast radius queries
CREATE INDEX IF NOT EXISTS idx_provider_profiles_standby ON provider_profiles(is_on_standby) WHERE is_on_standby = true;
CREATE INDEX IF NOT EXISTS idx_provider_profiles_coordinates ON provider_profiles(last_lat, last_lng);

-- 4. Create the pending_offers table to handle 60s Uber-style job offers
CREATE TABLE IF NOT EXISTS pending_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  response TEXT CHECK (response IN ('accepted', 'declined', 'expired')) DEFAULT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index the foreign keys for fast read/writes during real-time assignments
CREATE INDEX IF NOT EXISTS idx_pending_offers_booking ON pending_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_pending_offers_provider ON pending_offers(provider_id);
CREATE INDEX IF NOT EXISTS idx_pending_offers_status ON pending_offers(response);

-- 5. Create the spatial matching database function
CREATE OR REPLACE FUNCTION match_standby_provider(
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION
)
RETURNS TABLE (
  provider_id UUID,
  display_name TEXT,
  distance_miles DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id AS provider_id,
    pp.display_name,
    -- Calculate distance using high-precision spatial geography (converted to miles)
    ST_Distance(
      ST_SetSRID(ST_MakePoint(pp.last_lng, pp.last_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(customer_lng, customer_lat), 4326)::geography
    ) / 1609.344 AS distance_miles
  FROM provider_profiles pp
  WHERE pp.is_on_standby = true
    AND pp.stripe_connect_charges_enabled = true -- Pro must have active Stripe Connect
    AND pp.last_heartbeat_at > NOW() - INTERVAL '2 minutes' -- Pro must be online recently
    AND pp.last_lat IS NOT NULL 
    AND pp.last_lng IS NOT NULL
    -- Exclude pros currently working on another active job
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.provider_id = pp.id
        AND b.booking_status IN ('provider_assigned', 'on_the_way', 'arrived', 'in_progress', 'mowing')
    )
    -- Check if they are within the search radius
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(pp.last_lng, pp.last_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(customer_lng, customer_lat), 4326)::geography,
      radius_miles * 1609.344 -- Miles converted to meters
    )
  ORDER BY distance_miles ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;