-- ============================================================================
-- Venue & Court Rating System Migration
-- ============================================================================
-- This migration creates tables for venue management, multi-dimensional ratings,
-- reviews, helpful votes, comments, and analytics for the Padelapp venue rating
-- system.
--
-- Tables created:
-- - venues: Venue profiles with attributes (surface, lighting, amenities)
-- - venue_ratings: Multi-dimensional ratings (1-5 stars per dimension)
-- - venue_rating_helpful_votes: Helpful/not helpful votes on reviews
-- - venue_comments: Comments/replies to reviews
--
-- Views created:
-- - venue_analytics: Materialized view for venue statistics and analytics
--
-- Triggers created:
-- - refresh_venue_analytics_trigger: Auto-refresh materialized view on rating changes
--
-- RLS policies:
-- - Group-scoped access control
-- - Admin-only write permissions for venue management
-- - Member-only rating submission
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: venues
-- ============================================================================
-- Stores venue profiles with physical attributes and amenities
-- ============================================================================
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  website VARCHAR(255),
  phone VARCHAR(50),
  num_courts INTEGER NOT NULL CHECK (num_courts > 0),
  surface_type VARCHAR(50) NOT NULL CHECK (surface_type IN ('glass', 'cement', 'artificial_grass', 'other')),
  indoor_outdoor VARCHAR(20) NOT NULL CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  lighting VARCHAR(50) NOT NULL CHECK (lighting IN ('led', 'fluorescent', 'natural', 'none')),
  climate_control BOOLEAN NOT NULL DEFAULT FALSE,
  has_showers BOOLEAN NOT NULL DEFAULT FALSE,
  has_changing_rooms BOOLEAN NOT NULL DEFAULT FALSE,
  has_lockers BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking BOOLEAN NOT NULL DEFAULT FALSE,
  has_bar_restaurant BOOLEAN NOT NULL DEFAULT FALSE,
  has_water_fountain BOOLEAN NOT NULL DEFAULT FALSE,
  has_wifi BOOLEAN NOT NULL DEFAULT FALSE,
  has_equipment_rental BOOLEAN NOT NULL DEFAULT FALSE,
  photos JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES players(id) ON DELETE SET NULL,

  CONSTRAINT venues_slug_group_unique UNIQUE(group_id, slug)
);

-- Indexes for efficient queries
CREATE INDEX idx_venues_group_id ON venues(group_id);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_created_by ON venues(created_by);

-- ============================================================================
-- TABLE: venue_ratings
-- ============================================================================
-- Stores multi-dimensional ratings submitted by players
-- ============================================================================
CREATE TABLE IF NOT EXISTS venue_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

  -- Rating dimensions (1-5 stars each)
  court_quality INTEGER NOT NULL CHECK (court_quality BETWEEN 1 AND 5),
  lighting INTEGER NOT NULL CHECK (lighting BETWEEN 1 AND 5),
  comfort INTEGER NOT NULL CHECK (comfort BETWEEN 1 AND 5),
  amenities INTEGER NOT NULL CHECK (amenities BETWEEN 1 AND 5),
  accessibility INTEGER NOT NULL CHECK (accessibility BETWEEN 1 AND 5),
  atmosphere INTEGER NOT NULL CHECK (atmosphere BETWEEN 1 AND 5),

  -- Overall rating as weighted average (computed column)
  overall_rating NUMERIC(3,1) GENERATED ALWAYS AS (
    (court_quality * 0.30) +
    (lighting * 0.20) +
    (comfort * 0.15) +
    (amenities * 0.15) +
    (accessibility * 0.10) +
    (atmosphere * 0.10)
  ) STORED,

  -- Optional text review
  review_text TEXT CHECK (
    review_text IS NULL OR
    (LENGTH(review_text) >= 10 AND LENGTH(review_text) <= 500)
  ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT venue_ratings_venue_player_unique UNIQUE(venue_id, player_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_venue_ratings_venue_id ON venue_ratings(venue_id);
CREATE INDEX idx_venue_ratings_player_id ON venue_ratings(player_id);
CREATE INDEX idx_venue_ratings_group_id ON venue_ratings(group_id);
CREATE INDEX idx_venue_ratings_created_at ON venue_ratings(created_at DESC);

-- ============================================================================
-- TABLE: venue_rating_helpful_votes
-- ============================================================================
-- Stores helpful/not helpful votes on venue reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS venue_rating_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES venue_ratings(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT venue_rating_helpful_votes_unique UNIQUE(rating_id, voter_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_venue_rating_helpful_votes_rating_id ON venue_rating_helpful_votes(rating_id);
CREATE INDEX idx_venue_rating_helpful_votes_voter_id ON venue_rating_helpful_votes(voter_id);

-- ============================================================================
-- TABLE: venue_comments
-- ============================================================================
-- Stores comments/replies to venue reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS venue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES venue_ratings(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (LENGTH(comment_text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_venue_comments_rating_id ON venue_comments(rating_id);
CREATE INDEX idx_venue_comments_created_at ON venue_comments(created_at DESC);

-- ============================================================================
-- FUNCTION: update_venue_updated_at
-- ============================================================================
-- Updates the venue's updated_at timestamp when any venue-related data changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_venue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Get venue_id from the changed row
  DECLARE venue_uuid UUID;
  BEGIN
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
      UPDATE venues SET updated_at = NOW() WHERE id = venue_uuid;
    END IF;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all venue-related tables
CREATE TRIGGER trigger_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_updated_at();

CREATE TRIGGER trigger_venue_ratings_updated_at
  AFTER INSERT OR UPDATE OR DELETE ON venue_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_updated_at();

CREATE TRIGGER trigger_venue_rating_helpful_votes_updated_at
  AFTER INSERT OR UPDATE OR DELETE ON venue_rating_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_updated_at();

CREATE TRIGGER trigger_venue_comments_updated_at
  AFTER INSERT OR UPDATE OR DELETE ON venue_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_updated_at();

-- ============================================================================
-- MATERIALIZED VIEW: venue_analytics
-- ============================================================================
-- Aggregates venue statistics for analytics dashboard
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS venue_analytics AS
SELECT
  v.id AS venue_id,
  v.group_id,
  v.name,
  v.slug,
  COUNT(DISTINCT vr.id) AS total_ratings,
  ROUND(AVG(vr.overall_rating)::numeric, 2) AS avg_overall_rating,
  ROUND(AVG(vr.court_quality)::numeric, 2) AS avg_court_quality,
  ROUND(AVG(vr.lighting)::numeric, 2) AS avg_lighting,
  ROUND(AVG(vr.comfort)::numeric, 2) AS avg_comfort,
  ROUND(AVG(vr.amenities)::numeric, 2) AS avg_amenities,
  ROUND(AVG(vr.accessibility)::numeric, 2) AS avg_accessibility,
  ROUND(AVG(vr.atmosphere)::numeric, 2) AS avg_atmosphere,
  COALESCE(SUM(CASE WHEN vrhv.is_helpful = TRUE THEN 1 ELSE 0 END), 0) AS total_helpful_votes,
  COALESCE(SUM(CASE WHEN vrhv.is_helpful = FALSE THEN 1 ELSE 0 END), 0) AS total_not_helpful_votes,
  COALESCE(COUNT(DISTINCT vc.id), 0) AS total_comments,
  MAX(vr.created_at) AS last_rating_at,
  MAX(v.updated_at) AS last_updated_at
FROM venues v
LEFT JOIN venue_ratings vr ON vr.venue_id = v.id
LEFT JOIN venue_rating_helpful_votes vrhv ON vrhv.rating_id = vr.id
LEFT JOIN venue_comments vc ON vc.rating_id = vr.id
GROUP BY v.id, v.group_id, v.name, v.slug;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX venue_analytics_venue_id_unique ON venue_analytics(venue_id);
CREATE INDEX venue_analytics_group_id ON venue_analytics(group_id);

-- ============================================================================
-- FUNCTION: refresh_venue_analytics
-- ============================================================================
-- Refreshes the materialized view (concurrently if it exists)
-- Note: Trigger functions must return trigger type
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_venue_analytics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY venue_analytics;
  RETURN NULL;
EXCEPTION
  WHEN others THEN
    -- If concurrent refresh fails (e.g., no concurrent access), try regular refresh
    REFRESH MATERIALIZED VIEW venue_analytics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-refresh after rating changes
CREATE TRIGGER trigger_refresh_venue_analytics
  AFTER INSERT OR UPDATE OR DELETE ON venue_ratings
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_venue_analytics();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_rating_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_comments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Venues table RLS
-- ----------------------------------------------------------------------------

-- All group members can read venues in their group
CREATE POLICY "Group members can read venues"
  ON venues FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group admins can create venues
CREATE POLICY "Group admins can create venues"
  ON venues FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_admins
      WHERE player_id = auth.uid()
    )
  );

-- Group admins can update venues they own
CREATE POLICY "Group admins can update venues"
  ON venues FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_admins
      WHERE player_id = auth.uid()
    )
  );

-- Group admins can delete venues
CREATE POLICY "Group admins can delete venues"
  ON venues FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM group_admins
      WHERE player_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Venue ratings table RLS
-- ----------------------------------------------------------------------------

-- Group members can read ratings in their group
CREATE POLICY "Group members can read venue ratings"
  ON venue_ratings FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group members can create ratings for venues in their group
CREATE POLICY "Group members can create venue ratings"
  ON venue_ratings FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
    AND player_id = auth.uid()
  );

-- Players can update their own ratings
CREATE POLICY "Players can update their own venue ratings"
  ON venue_ratings FOR UPDATE
  USING (
    player_id = auth.uid()
  );

-- Players can delete their own ratings
CREATE POLICY "Players can delete their own venue ratings"
  ON venue_ratings FOR DELETE
  USING (
    player_id = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- Venue rating helpful votes table RLS
-- ----------------------------------------------------------------------------

-- Group members can read helpful votes in their group
CREATE POLICY "Group members can read helpful votes"
  ON venue_rating_helpful_votes FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group members can create helpful votes in their group
CREATE POLICY "Group members can create helpful votes"
  ON venue_rating_helpful_votes FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
    AND voter_id = auth.uid()
  );

-- Voters can update their own votes
CREATE POLICY "Voters can update their own helpful votes"
  ON venue_rating_helpful_votes FOR UPDATE
  USING (
    voter_id = auth.uid()
  );

-- Voters can delete their own votes
CREATE POLICY "Voters can delete their own helpful votes"
  ON venue_rating_helpful_votes FOR DELETE
  USING (
    voter_id = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- Venue comments table RLS
-- ----------------------------------------------------------------------------

-- Group members can read comments in their group
CREATE POLICY "Group members can read venue comments"
  ON venue_comments FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group members can create comments in their group
CREATE POLICY "Group members can create venue comments"
  ON venue_comments FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
    AND player_id = auth.uid()
  );

-- Players can update their own comments
CREATE POLICY "Players can update their own venue comments"
  ON venue_comments FOR UPDATE
  USING (
    player_id = auth.uid()
  );

-- Players can delete their own comments
CREATE POLICY "Players can delete their own venue comments"
  ON venue_comments FOR DELETE
  USING (
    player_id = auth.uid()
  );
