-- SQL Migration: Auto-match trigger for new bookings on MowList
-- This script automates the dispatching loop. When a booking status is set to 'pushed_to_radar',
-- it triggers a lookup of the closest standby pro and writes to the 'pending_offers' table.

-- Create the trigger function
CREATE OR REPLACE FUNCTION trigger_auto_match_standby()
RETURNS TRIGGER AS $$
DECLARE
  matched_pro RECORD;
  expiry_time TIMESTAMPTZ;
BEGIN
  -- We only want to auto-match if the booking status is changed to 'pushed_to_radar'
  IF NEW.booking_status = 'pushed_to_radar' THEN
    -- 1. Find the closest standby provider within a 15-mile radius
    SELECT * INTO matched_pro 
    FROM match_standby_provider(NEW.lat, NEW.lng, 15.0) -- 15 mile radius search
    LIMIT 1;

    -- 2. If a standby provider is found, spawn an instant offer!
    IF matched_pro.provider_id IS NOT NULL THEN
      expiry_time := NOW() + INTERVAL '60 seconds'; -- Uber-style 60s accept window
      
      -- Create the offer record
      INSERT INTO pending_offers (
        booking_id,
        provider_id,
        expires_at,
        response
      ) VALUES (
        NEW.id,
        matched_pro.provider_id,
        expiry_time,
        NULL -- response starts as NULL (pending)
      );

      -- Update booking status to 'matching_pending' to prevent double-matching
      NEW.booking_status := 'matching_pending';
    ELSE
      -- No active pro online in the area. Mark as 'searching_failed'
      -- The React frontend RadarMatching will detect this and transition to the backup booking board
      NEW.booking_status := 'searching_failed';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger function to your existing bookings table
DROP TRIGGER IF EXISTS tr_bookings_auto_match_standby ON bookings;
CREATE TRIGGER tr_bookings_auto_match_standby
  BEFORE INSERT OR UPDATE OF booking_status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_match_standby();
