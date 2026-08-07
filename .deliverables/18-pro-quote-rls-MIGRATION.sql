-- 18: Pros can view & quote submitted quote requests
-- Without this, the pro side "Available Jobs" page can't see custom jobs
-- (e.g. "Large yard, 2 acres, need full service every 2 weeks") and customers'
-- "Pending Quotes" stay in limbo forever.

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Pros can view submitted quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Pros can update quote requests to add quotes" ON quote_requests;
DROP POLICY IF EXISTS "Admins manage quote requests" ON quote_requests;

-- Pros see quote requests that are in 'submitted' status (no pro assigned yet)
CREATE POLICY "Pros can view submitted quote requests"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'pro'
    )
  );

-- Pros can update a quote request to add a quoted_price and move status to 'quoted'
CREATE POLICY "Pros can update quote requests to add quotes"
  ON quote_requests FOR UPDATE
  TO authenticated
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'pro'
    )
  )
  WITH CHECK (
    status = 'quoted' OR status = 'submitted'
  );

-- Admins (service role) have full access — covered by default service_role bypass
