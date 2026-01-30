-- ============================================================================
-- Add venue_id to matches and weekly_events tables
-- ============================================================================
-- This migration adds optional venue_id foreign keys to matches and weekly_events
-- to track which venue each match/event was held at.
-- ============================================================================

-- Add venue_id to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- Add venue_id to weekly_events table
ALTER TABLE weekly_events
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_matches_venue_id ON matches(venue_id);
CREATE INDEX IF NOT EXISTS idx_weekly_events_venue_id ON weekly_events(venue_id);
