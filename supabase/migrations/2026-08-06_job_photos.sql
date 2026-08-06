-- Migration: Add before/after job photos + status events
-- Created: 2026-08-06
--
-- Adds:
-- 1. before_photo_url and after_photo_url to bookings table
-- 2. booking_photos table for multiple photos per job
-- 3. booking_status_events already exists (verify in schema.sql)
-- 4. Helper view: latest_status for each booking
--
-- Photos are REQUIRED to mark a job complete (enforced in app code).
-- If a pro marks status=completed without uploading after_photo_url,
-- the API should reject the update (logic in updateBookingProgress).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS before_photo_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS after_photo_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pro_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS tracking_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tracking_ended_at TIMESTAMP WITH TIME ZONE;

-- Multiple photos per job (for multi-step jobs, before/during/after)
CREATE TABLE IF NOT EXISTS booking_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'during', 'after', 'issue', 'completion')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_photos_booking_id ON booking_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_type ON booking_photos(booking_id, photo_type);

ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

-- Customers can view photos for their own bookings
CREATE POLICY "Customers can view own booking photos" ON booking_photos
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
  );

-- Providers can view photos for their assigned bookings
CREATE POLICY "Providers can view assigned booking photos" ON booking_photos
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

-- Providers can insert photos for their assigned bookings
CREATE POLICY "Providers can upload photos for assigned bookings" ON booking_photos
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

-- Service role can manage (for edge functions / admin)
CREATE POLICY "Service role can manage booking photos" ON booking_photos
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- Track when pro's GPS was last updated (for live tracking)
-- ============================================================
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

-- Customers can view location pings for their own active bookings
CREATE POLICY "Customers can view pro location for own active bookings" ON pro_location_pings
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE customer_id = auth.uid()
        AND booking_status IN ('on_the_way', 'arrived', 'in_progress')
    )
  );

-- Providers can view + insert their own location pings
CREATE POLICY "Providers can view own location pings" ON pro_location_pings
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can insert own location pings" ON pro_location_pings
  FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

-- Service role can manage
CREATE POLICY "Service role can manage location pings" ON pro_location_pings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
