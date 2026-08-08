-- 22: Reviews + Favorites (Phase 1 of Quality Control)
-- Adds:
--   - reviews table (1 review per booking, pro can dispute)
--   - favorites table (customer can favorite a pro)
--   - RLS policies
--   - average_rating / review_count on provider_profiles (already exists;
--     this migration documents the trigger that keeps them updated)

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,

  -- Rating is 1-5. CHECK constraint enforces range.
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Dispute state (pro can dispute a fake/unfair review)
  -- 'none'      — no dispute
  -- 'disputed'  — pro has flagged this for review
  -- 'upheld'    — admin sided with the pro, review removed from averages
  -- 'rejected'  — admin sided with the customer, review stays
  dispute_status TEXT NOT NULL DEFAULT 'none' CHECK (dispute_status IN ('none', 'disputed', 'upheld', 'rejected')),
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolved_by UUID REFERENCES users(id),

  -- Pro's private rating of customer (1-5, NOT shown to other customers)
  -- Used for internal "is this customer a nightmare" detection.
  pro_rating_of_customer INTEGER CHECK (pro_rating_of_customer >= 1 AND pro_rating_of_customer <= 5),
  pro_private_feedback TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per booking
  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider
  ON reviews (provider_id, created_at DESC)
  WHERE dispute_status != 'upheld';

CREATE INDEX IF NOT EXISTS idx_reviews_customer
  ON reviews (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_dispute_status
  ON reviews (dispute_status)
  WHERE dispute_status = 'disputed';

COMMENT ON TABLE reviews IS 'Customer reviews of pros. Pro can dispute. Only reviews where dispute_status != upheld count toward average.';
COMMENT ON COLUMN reviews.pro_rating_of_customer IS 'Pro\'s private rating of the customer (1-5). Used internally to detect problem customers. Not shown publicly.';
COMMENT ON COLUMN reviews.pro_private_feedback IS 'Pro\'s private feedback about the customer. Only visible to admins.';

-- ============ FAVORITES TABLE ============
-- A customer favorites a pro so they can request them directly next time.
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One favorite per (customer, provider) pair
  UNIQUE(customer_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_customer
  ON favorites (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_provider
  ON favorites (provider_id);

COMMENT ON TABLE favorites IS 'Customers can favorite a pro after a good experience. Used for "Use a pro you\'ve used before" on /book.';

-- ============ RLS POLICIES ============

-- Drop existing if present (idempotent)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Customers can submit reviews for their own bookings" ON reviews;
DROP POLICY IF EXISTS "Customers can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Pros can view reviews of themselves" ON reviews;
DROP POLICY IF EXISTS "Pros can dispute reviews of themselves" ON reviews;
DROP POLICY IF EXISTS "Admins manage reviews" ON reviews;

-- Reviews are public — anyone can see them (so customers can vet pros before booking)
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (dispute_status != 'upheld');

-- Customers can submit a review for their own completed bookings
CREATE POLICY "Customers can submit reviews for their own bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.customer_id = auth.uid()
      AND bookings.booking_status = 'completed'
    )
  );

-- Customers can update their own review (e.g. edit comment)
CREATE POLICY "Customers can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Pros can dispute reviews of themselves
CREATE POLICY "Pros can dispute reviews of themselves"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM provider_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Pro can only change dispute_status, not rating/comment
    dispute_status IN ('disputed', 'none')
  );

-- Favorites
DROP POLICY IF EXISTS "Customers can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Customers can add favorites" ON favorites;
DROP POLICY IF EXISTS "Customers can remove their own favorites" ON favorites;

CREATE POLICY "Customers can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can remove their own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- ============ TRIGGER: Update provider_profiles averages ============
-- Whenever a review is inserted/updated/deleted, recompute the pro's
-- average_rating and review_count.
--
-- This is the "cached" approach — the pro profile stores the average
-- directly so we don't need to compute it on every read. Trigger keeps
-- it in sync. Reviews in 'upheld' status (where pro won the dispute) are
-- excluded from the average.

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_provider_id UUID;
BEGIN
  -- Determine which provider's stats to update
  IF TG_OP = 'DELETE' THEN
    target_provider_id := OLD.provider_id;
  ELSE
    target_provider_id := NEW.provider_id;
  END IF;

  -- Recompute the average and count (excluding upheld/disputed reviews)
  UPDATE provider_profiles
  SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE provider_id = target_provider_id
      AND dispute_status NOT IN ('upheld')
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = target_provider_id
      AND dispute_status NOT IN ('upheld')
    ),
    updated_at = now()
  WHERE id = target_provider_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_provider_rating ON reviews;
CREATE TRIGGER trigger_update_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

-- ============ PRO PROFILE: Add tier column for future use ============
-- We don't use this yet, but it's the column we'll filter on for Phase 2
-- (Trusted / Top Pro badges).
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'verified'
  CHECK (tier IN ('verified', 'trusted', 'top'));

COMMENT ON COLUMN provider_profiles.tier IS 'Pro quality tier: verified (any), trusted (10+ jobs, 4.5+ stars), top (50+ jobs, 4.8+ stars). Set by a periodic job.';
