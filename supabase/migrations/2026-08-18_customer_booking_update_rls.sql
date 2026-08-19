-- ============================================================================
-- MIGRATION 27 — Customers can update their own bookings (approve / dispute)
-- ============================================================================
--
-- ROOT CAUSE OF THE "APPROVE & RELEASE PAYMENT DOES NOTHING" BUG.
--
-- The `bookings` table has RLS enabled with these policies:
--   * SELECT — customers, providers, admins
--   * INSERT — customers
--   * UPDATE — providers, admins
--
-- There has never been an UPDATE policy for customers. So when the customer
-- clicks "Approve & Release Payment", the UPDATE matches ZERO rows. Postgres
-- does not treat that as an error, and PostgREST returns 204 with no error —
-- so the client believed the write succeeded, flipped the card optimistically,
-- and then the next fetch showed `pending_review` again. That looked exactly
-- like a stale cache, which is why it was so hard to pin down.
--
-- This migration:
--   1. Adds a customer UPDATE policy on bookings.
--   2. Adds a BEFORE UPDATE trigger so the new policy can't be abused — a
--      customer can approve, dispute, or cancel, and cannot touch price,
--      payment status, or who the job is assigned to.
--
-- Idempotent: safe to run more than once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Guardrail trigger — runs BEFORE the policy lets an update through
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_customer_booking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Service role (edge functions, pg_cron, the Stripe webhook) has no
  -- auth.uid(). Those callers are trusted — let them through untouched.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only police updates made BY the booking's own customer. Pro and admin
  -- updates are governed by their own policies.
  IF auth.uid() IS DISTINCT FROM OLD.customer_id THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ) INTO is_admin;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- A customer may NEVER change money or assignment.
  IF NEW.estimated_price        IS DISTINCT FROM OLD.estimated_price
     OR NEW.final_price            IS DISTINCT FROM OLD.final_price
     OR NEW.platform_fee           IS DISTINCT FROM OLD.platform_fee
     OR NEW.provider_payout_amount IS DISTINCT FROM OLD.provider_payout_amount
     OR NEW.payment_status         IS DISTINCT FROM OLD.payment_status
     OR NEW.customer_id            IS DISTINCT FROM OLD.customer_id
     OR NEW.provider_id            IS DISTINCT FROM OLD.provider_id
  THEN
    RAISE EXCEPTION
      'Customers cannot modify pricing, payment status, or job assignment';
  END IF;

  -- A customer may only make these status transitions.
  IF NEW.booking_status IS DISTINCT FROM OLD.booking_status THEN
    IF NOT (
         (OLD.booking_status = 'pending_review'
            AND NEW.booking_status IN ('completed', 'disputed'))
      OR (OLD.booking_status IN ('requested', 'booked', 'provider_assigned')
            AND NEW.booking_status = 'cancelled')
    ) THEN
      RAISE EXCEPTION
        'Customers cannot change booking status from % to %',
        OLD.booking_status, NEW.booking_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_enforce_customer_booking_update ON public.bookings;
CREATE TRIGGER trg_enforce_customer_booking_update
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_booking_update();


-- ---------------------------------------------------------------------------
-- 2. The missing policy
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
CREATE POLICY "Customers can update own bookings" ON public.bookings
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());
