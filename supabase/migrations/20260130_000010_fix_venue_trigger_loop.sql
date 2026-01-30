-- ========================================================================
-- HOTFIX: Fix circular trigger in venue rating system
-- ========================================================================
-- This fixes the "stack depth limit exceeded" error when inserting venue ratings.
-- The issue was that trigger_venues_updated_at (on venues BEFORE UPDATE)
-- was called by update_venue_updated_at(), creating an infinite loop.
-- Solution: Add a check to prevent the function from triggering itself.

-- Drop and recreate the function with a guard condition
DROP FUNCTION IF EXISTS update_venue_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_venue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE venue_uuid UUID;
  BEGIN
    -- Get venue_id from the changed row
    IF TG_TABLE_NAME = 'venues' THEN
      venue_uuid := NEW.id;
    ELSIF TG_TABLE_NAME = 'venue_ratings' THEN
      venue_uuid := NEW.venue_id;
    ELSIF TG_TABLE_NAME = 'venue_rating_helpful_votes' THEN
      SELECT venue_id INTO venue_uuid FROM venue_ratings WHERE id = NEW.rating_id;
    ELSIF TG_TABLE_NAME = 'venue_comments' THEN
      SELECT venue_id INTO venue_uuid FROM venue_ratings WHERE id = NEW.rating_id;
    END IF;

    -- Update venue timestamp
    IF venue_uuid IS NOT NULL THEN
      -- GUARD: Only update if the timestamp is actually stale
      -- This prevents the recursive trigger loop
      UPDATE venues 
      SET updated_at = NOW() 
      WHERE id = venue_uuid 
      AND updated_at < NOW() - INTERVAL '1 second';
    END IF;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
