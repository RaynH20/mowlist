-- Part 1: Create storage bucket for job photos + RLS policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Pros can upload job photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'job-photos'
    AND auth.uid() IN (
      SELECT pp.user_id FROM provider_profiles pp
      JOIN bookings b ON b.provider_id = pp.id
      WHERE b.id::text = SPLIT_PART(name, '/', 2)
    )
  );

CREATE POLICY "Customers can view own booking photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'job-photos'
    AND SPLIT_PART(name, '/', 2) IN (
      SELECT id::text FROM bookings WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Pros can view assigned booking photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'job-photos'
    AND SPLIT_PART(name, '/', 2) IN (
      SELECT b.id::text FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );
