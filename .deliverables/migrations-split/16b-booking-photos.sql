-- Part 2: Add photo columns to bookings + create booking_photos table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS before_photo_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS after_photo_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pro_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pro_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS tracking_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS tracking_ended_at TIMESTAMP WITH TIME ZONE;

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

CREATE POLICY "Customers can view own booking photos" ON booking_photos
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
  );

CREATE POLICY "Providers can view assigned booking photos" ON booking_photos
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can upload photos for assigned bookings" ON booking_photos
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage booking photos" ON booking_photos
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
