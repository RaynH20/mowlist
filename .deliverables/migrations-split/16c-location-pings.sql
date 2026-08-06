-- Part 3: Create pro_location_pings table for live tracking
CREATE TABLE IF NOT EXISTS pro_location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_location_pings_booking ON pro_location_pings(booking_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_location_pings_provider ON pro_location_pings(provider_id, recorded_at DESC);

ALTER TABLE pro_location_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view pro location for own active bookings" ON pro_location_pings
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid()
        AND booking_status IN ('on_the_way', 'arrived', 'in_progress')
    )
  );

CREATE POLICY "Providers can view own location pings" ON pro_location_pings
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can insert own location pings" ON pro_location_pings
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage location pings" ON pro_location_pings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
