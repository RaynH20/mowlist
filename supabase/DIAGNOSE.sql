-- ============================================================================
-- MowList — read-only database diagnostic
--
-- Paste this whole file into the Supabase SQL Editor and hit Run. It changes
-- NOTHING. Each block returns one small table; send the results back and we can
-- stop guessing about what's actually in the live database.
-- ============================================================================


-- 1. Who is allowed to UPDATE bookings?
--    EXPECTED after migration 27: rows for providers, admins AND customers.
--    If there is no customer row, "Approve & Release Payment" is a silent no-op.
SELECT
  policyname,
  cmd,
  qual        AS using_expression,
  with_check  AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings'
ORDER BY cmd, policyname;


-- 2. Does the booking_status CHECK allow every status the app writes?
--    Must include: requested, booked, provider_assigned, on_the_way, arrived,
--    in_progress, pending_review, completed, cancelled, disputed, refunded.
--    Also check payment_status allows: pending, authorized, captured, failed,
--    refunded, partially_refunded.
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public'
  AND rel.relname IN ('bookings', 'payments')
  AND con.contype = 'c'
ORDER BY rel.relname, con.conname;


-- 3. Do the columns the payment code depends on actually exist?
--    Anything showing 'MISSING' will break capture or payouts.
SELECT c.needed AS column_name,
       CASE WHEN col.column_name IS NULL THEN 'MISSING' ELSE 'ok' END AS status
FROM (VALUES
  ('payment_intent_id'), ('payment_captured_at'), ('stripe_transfer_id'),
  ('provider_paid_at'), ('provider_payout_amount'), ('platform_fee'),
  ('ready_for_review_at'), ('auto_capture_at'), ('reviewed_at'),
  ('customer_approved_at'), ('completed_at'), ('dispute_reason'),
  ('disputed_at'), ('selected_addons')
) AS c(needed)
LEFT JOIN information_schema.columns col
  ON col.table_schema = 'public'
 AND col.table_name = 'bookings'
 AND col.column_name = c.needed
ORDER BY status DESC, column_name;


-- 4. Bookings stuck awaiting review, and whether they can actually be captured.
--    A NULL payment_intent_id means the money can never be collected.
SELECT
  id,
  booking_status,
  payment_status,
  estimated_price,
  provider_id IS NOT NULL AS has_pro,
  payment_intent_id IS NOT NULL AS can_capture,
  ready_for_review_at,
  auto_capture_at
FROM public.bookings
WHERE booking_status IN ('pending_review', 'disputed')
ORDER BY ready_for_review_at DESC NULLS LAST
LIMIT 25;


-- 5. Is the hourly auto-capture cron job actually scheduled?
--    Empty result = the 24h auto-release never runs.
SELECT jobid, schedule, jobname, active
FROM cron.job
ORDER BY jobid;


-- 6. Pros and their Stripe Connect state. `payouts_enabled = false` means we
--    cannot transfer money to them, no matter how many jobs they complete.
SELECT
  display_name,
  stripe_connect_account_id IS NOT NULL AS has_connect_account,
  stripe_connect_charges_enabled,
  stripe_connect_payouts_enabled,
  stripe_connect_onboarding_complete
FROM public.provider_profiles
ORDER BY display_name;
