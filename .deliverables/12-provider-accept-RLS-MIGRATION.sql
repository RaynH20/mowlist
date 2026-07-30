-- Fix: Allow providers to ACCEPT unassigned bookings (claim them).
-- The current "Providers can update assigned bookings" policy only allows
-- updates where provider_id already matches, so pros can never accept a
-- new booking (which has provider_id = NULL).
--
-- Fix: Allow updates when provider_id matches OR is NULL, but REQUIRE
-- the new provider_id to be the current pro's id. This means a pro can
-- claim an unassigned booking, but can't change other things on it.

DROP POLICY IF EXISTS "Providers can update assigned bookings" ON bookings;
CREATE POLICY "Providers can update assigned or accept unassigned bookings" ON bookings
  FOR UPDATE USING (
    provider_id = public.current_provider_id()
    OR provider_id IS NULL
  )
  WITH CHECK (
    provider_id = public.current_provider_id()
  );
