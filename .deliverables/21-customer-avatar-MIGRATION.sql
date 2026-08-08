-- 21: Add avatar_url to customer_profiles
-- Lets customers upload a profile photo or pick a premade icon,
-- so they have a visual identity throughout the app (in job cards,
-- reviews, chats, etc.).

ALTER TABLE customer_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_source TEXT;  -- 'uploaded' | 'preset' | 'gravatar'

-- Customer avatars in the same bucket as job photos
-- (reuse 'avatars' folder, public read, owner can write/update)
CREATE POLICY IF NOT EXISTS "Customers can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

CREATE POLICY IF NOT EXISTS "Customers can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

CREATE POLICY IF NOT EXISTS "Customers can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = (SELECT auth.uid()::text)
  );

-- Comment for future devs
COMMENT ON COLUMN customer_profiles.avatar_url IS 'Public URL to the customer profile photo, or null for default initials.';
COMMENT ON COLUMN customer_profiles.avatar_source IS 'How the avatar was set: uploaded (real photo), preset (chose from icon library), gravatar (auto from email).';
