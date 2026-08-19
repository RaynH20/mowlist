-- ============================================================================
-- MIGRATION 28 — Payment plumbing: link PaymentIntents, record pro payouts
-- ============================================================================
--
-- Two problems this fixes:
--
-- 1. `capture-payment` reads `bookings.payment_intent_id` to know which
--    PaymentIntent to charge — but nothing ever wrote that column, and on some
--    databases the column doesn't exist at all. Every capture failed with
--    "No payment intent on this booking", so authorized funds were never
--    collected and simply expired after 7 days.
--
-- 2. MowList now pays pros with separate transfers (created at capture time)
--    rather than destination charges, so we need somewhere to record the
--    transfer.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_intent_id     TEXT,
  ADD COLUMN IF NOT EXISTS payment_captured_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id    TEXT,
  ADD COLUMN IF NOT EXISTS provider_paid_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent
  ON public.bookings(payment_intent_id);


-- ---------------------------------------------------------------------------
-- Backfill payment_intent_id from the payments table for anything already paid
-- ---------------------------------------------------------------------------
UPDATE public.bookings b
SET payment_intent_id = p.stripe_payment_intent_id
FROM public.payments p
WHERE p.booking_id = b.id
  AND p.stripe_payment_intent_id IS NOT NULL
  AND b.payment_intent_id IS NULL;


-- ---------------------------------------------------------------------------
-- Make sure the payments.status CHECK allows the values the webhook writes.
-- The original schema allowed pending/authorized/captured/failed/refunded/
-- partially_refunded; a later rebuild of the table dropped the constraint.
-- Either way, end up with one known-good constraint.
-- ---------------------------------------------------------------------------
-- Any legacy rows written with the invalid 'succeeded' status become 'captured'
-- FIRST, so the constraint below can be applied cleanly.
UPDATE public.payments SET status = 'captured' WHERE status = 'succeeded';

DO $$
BEGIN
  ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
  ALTER TABLE public.payments
    ADD CONSTRAINT payments_status_check
    CHECK (status IN (
      'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
    ));
EXCEPTION WHEN others THEN
  -- If existing rows violate the constraint, don't block the migration —
  -- report it instead. Run the SELECT below to see the offenders.
  RAISE NOTICE 'Could not re-apply payments_status_check: %', SQLERRM;
END $$;
