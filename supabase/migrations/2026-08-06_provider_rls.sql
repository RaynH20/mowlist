-- Migration: Allow customers to see their pro's info
-- Created: 2026-08-06
--
-- Why: The "Public can view verified providers" policy only works
-- if a pro has been formally verified. Most pros in the system don't
-- have this set, so the customer-side query for provider name/info
-- returns 400 (no row-level access). This blocks:
--   - getCustomerBookings from showing provider_name
--   - Booking confirmation from showing pro details
--   - Dashboard "Coming up" cards from showing "Pro: <name>"
--
-- Fix: add a policy that lets customers SELECT any provider who is
-- assigned to one of their bookings. Combined with the existing
-- "Public can view verified providers" policy, this means:
--   - Verified pros: public + customers-with-bookings
--   - Unverified pros with a booking: only their customers
--   - Anyone else: nobody

CREATE POLICY "Customers can view their assigned provider" ON provider_profiles
  FOR SELECT USING (
    id IN (
      SELECT provider_id FROM bookings
      WHERE customer_id = auth.uid()
        AND provider_id IS NOT NULL
    )
  );
