-- 23: 24-Hour Escrow Review Window + Per-Addon Photo Tracking
-- This migration:
--   1. Adds per-addon photo tracking (each addon gets its own before+after photos)
--   2. Adds a 'pending_review' booking status (between 'completed' and payment capture)
--   3. Adds escrow tracking columns (reviewed_at, approved_at, auto_capture_at)
--
-- The new flow:
--   pro marks 'in_progress' → done mowing + addons
--   pro uploads before+after for BASE + each ADDON
--   pro taps 'Mark Ready for Review' → status = 'pending_review'
--   customer gets 24h to review photos and either:
--     - Approve → payment captured, status = 'completed'
--     - Dispute → status = 'disputed', held for admin
--   If 24h passes with no action → pg_cron auto-captures, status = 'completed'

-- ============ 1. PER-ADDON PHOTO TRACKING ============
-- Each photo is now tied to a specific addon (or NULL = base mowing)
ALTER TABLE booking_photos
  ADD COLUMN IF NOT EXISTS addon_id TEXT,
  ADD COLUMN IF NOT EXISTS photo_role TEXT NOT NULL DEFAULT 'reference'
  CHECK (photo_role IN ('before', 'after', 'reference', 'issue'));

-- Index for fast lookups of "all photos for addon X on booking Y"
CREATE INDEX IF NOT EXISTS idx_booking_photos_addon
  ON booking_photos (booking_id, addon_id, photo_role);

-- A photo is unique per (booking, addon, role) — can't upload 2 'before's
-- for the same addon on the same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_photos_unique_role
  ON booking_photos (booking_id, COALESCE(addon_id, ''), photo_role)
  WHERE photo_role IN ('before', 'after');

COMMENT ON COLUMN booking_photos.addon_id IS 'The addon this photo belongs to (matches ADDON_CATALOG.id in src/lib/addons.ts). NULL = base mowing photo.';
COMMENT ON COLUMN booking_photos.photo_role IS 'before/after/reference/issue — used to enforce one of each per addon.';

-- ============ 2. NEW BOOKING STATUS: pending_review ============
-- This is the escrow window. The job is done, but payment hasn't been captured yet.
-- The DB CHECK constraint on booking_status needs to be updated to allow this.
-- We have to drop and recreate the constraint because ALTER for CHECK is awkward.

-- The constraint is implicit from the type. PostgreSQL will reject values not in
-- the union type. Since BookingStatus is a TypeScript-only union (not a real PG
-- type), we just need to make sure the column accepts any string.
-- No schema change needed — just document the new status.

COMMENT ON COLUMN bookings.booking_status IS 'One of: requested, booked, provider_assigned, on_the_way, arrived, in_progress, mowing, pending_review, completed, cancelled, disputed, refunded. ''pending_review'' = pro done, awaiting 24h customer review.';

-- ============ 3. ESCROW TRACKING COLUMNS ============
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ready_for_review_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_capture_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMPTZ;

-- Index for the hourly pg_cron job that finds pending bookings to auto-capture
CREATE INDEX IF NOT EXISTS idx_bookings_auto_capture
  ON bookings (auto_capture_at)
  WHERE booking_status = 'pending_review' AND payment_status != 'captured';

COMMENT ON COLUMN bookings.ready_for_review_at IS 'When the pro marked the job as done (transitioned to pending_review).';
COMMENT ON COLUMN bookings.reviewed_at IS 'When the customer first opened the review screen. Not the same as approved_at — they may look but not act.';
COMMENT ON COLUMN bookings.customer_approved_at IS 'When the customer explicitly approved. Triggers immediate payment capture.';
COMMENT ON COLUMN bookings.auto_capture_at IS 'Computed: ready_for_review_at + 24h. Used by pg_cron to auto-capture if no action taken.';
COMMENT ON COLUMN bookings.payment_captured_at IS 'When the Stripe PaymentIntent was actually captured (could be approved, disputed-then-resolved, or auto-captured).';

-- ============ 4. UPDATE THE BOOKING STATUS TYPE IN THE APPLICATION ============
-- (TypeScript side, no SQL change needed here. Update BookingStatus in
-- src/lib/database.types.ts to include 'pending_review'.)

-- ============ 5. FUNCTION: backfill auto_capture_at for existing completed bookings ============
-- For any booking already in 'completed' status that doesn't have auto_capture_at,
-- set it to completed_at + 24h. This is a no-op for new bookings.
UPDATE bookings
SET auto_capture_at = completed_at + INTERVAL '24 hours'
WHERE booking_status = 'completed'
  AND completed_at IS NOT NULL
  AND auto_capture_at IS NULL
  AND payment_captured_at IS NULL;

-- ============ 6. RPC: try_auto_capture_pending_bookings ============
-- Called by the pg_cron job every hour. Captures payment for any booking that
-- has been in 'pending_review' for >24h.
--
-- Note: the actual Stripe capture happens in an Edge Function
-- (stripe-capture-payment). This RPC just identifies the bookings and updates
-- the status. The Edge Function is invoked via a Supabase webhook from
-- the booking status update.

CREATE OR REPLACE FUNCTION auto_capture_pending_bookings()
RETURNS TABLE(booking_id UUID, auto_capture_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  UPDATE bookings
  SET
    booking_status = 'completed',
    auto_capture_at = COALESCE(auto_capture_at, now()),
    payment_captured_at = now(),
    payment_status = 'captured',
    completed_at = COALESCE(completed_at, now())
  WHERE booking_status = 'pending_review'
    AND auto_capture_at IS NOT NULL
    AND auto_capture_at <= now()
    AND payment_status != 'captured'
  RETURNING id, auto_capture_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_capture_pending_bookings IS 'Captures payment for any booking in pending_review for >24h. Called by pg_cron hourly.';

-- ============ 7. PG_CRON: schedule the auto-capture job ============
-- Note: pg_cron is a Supabase extension. If it's not enabled, this will error.
-- Enable it via: supabase dashboard > Database > Extensions > pg_cron
--
-- The schedule is "every hour at minute 5" (e.g. 1:05, 2:05, 3:05)
SELECT cron.schedule(
  'auto-capture-pending-bookings',
  '5 * * * *',
  $$SELECT booking_id FROM auto_capture_pending_bookings();$$
);
