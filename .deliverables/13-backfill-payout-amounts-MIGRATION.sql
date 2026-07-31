-- Backfill provider_payout_amount and platform_fee for completed bookings
-- that don't have these set yet. The webhook only started saving these
-- in the latest version, so all pre-existing completed bookings show $0.
--
-- Source: derive from the linked payment record when available (most accurate).
--          Fallback: 85% of estimated_price (the pro's share, 15% MowList fee).
--
-- This is safe to run multiple times.

UPDATE bookings b
SET
  provider_payout_amount = COALESCE(
    p.pro_payout_amount,
    ROUND((b.estimated_price * 0.85)::numeric, 2)
  ),
  platform_fee = COALESCE(
    p.platform_fee,
    ROUND((b.estimated_price * 0.15)::numeric, 2)
  )
FROM payments p
WHERE p.booking_id = b.id
  AND p.status = 'succeeded'
  AND b.provider_payout_amount IS NULL;

-- Also handle bookings that don't have a matching payment record yet
UPDATE bookings
SET
  provider_payout_amount = ROUND((estimated_price * 0.85)::numeric, 2),
  platform_fee = ROUND((estimated_price * 0.15)::numeric, 2)
WHERE provider_payout_amount IS NULL
  AND booking_status IN ('completed', 'booked', 'provider_assigned', 'in_progress')
  AND estimated_price IS NOT NULL
  AND estimated_price > 0;
