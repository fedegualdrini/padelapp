-- Stitch Features Migration - Part 1: Tables
-- Creates all new tables and adds columns to existing tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COURTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  court_type TEXT CHECK (court_type IN ('indoor', 'outdoor')),
  surface_type TEXT CHECK (surface_type IN ('glass', 'cement', 'artificial_grass')),
  hourly_rate_cents INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(venue_id, name)
);

-- Indexes for courts
CREATE INDEX IF NOT EXISTS idx_courts_venue ON courts(venue_id);
CREATE INDEX IF NOT EXISTS idx_courts_group ON courts(group_id);
CREATE INDEX IF NOT EXISTS idx_courts_active ON courts(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES players(id) ON DELETE SET NULL,

  -- Booking time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Pricing
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',

  -- Community features
  is_public BOOLEAN DEFAULT FALSE,
  open_to_community BOOLEAN DEFAULT FALSE,
  max_players INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (end_time > start_time),
  CHECK (duration_minutes > 0)
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_venue ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group ON bookings(group_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_court_time ON bookings(court_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_by ON bookings(booked_by);

-- Composite index for availability queries
CREATE INDEX IF NOT EXISTS idx_bookings_availability ON bookings(court_id, start_time, status)
  WHERE status IN ('confirmed', 'pending');

-- ============================================================================
-- BOOKING PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('confirmed', 'pending', 'declined')) DEFAULT 'confirmed',
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id, player_id)
);

-- Indexes for booking participants
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking ON booking_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_player ON booking_participants(player_id);

-- ============================================================================
-- SOCIAL FEED TABLES
-- ============================================================================

-- Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,

  -- Content
  post_type TEXT CHECK (post_type IN ('match_result', 'announcement', 'discussion', 'booking')) NOT NULL,
  content TEXT NOT NULL,

  -- Related entities
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for social posts
CREATE INDEX IF NOT EXISTS idx_social_posts_group ON social_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_player ON social_posts(player_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_social_posts_match ON social_posts(related_match_id) WHERE related_match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_social_posts_booking ON social_posts(related_booking_id) WHERE related_booking_id IS NOT NULL;

-- Social Likes
CREATE TABLE IF NOT EXISTS social_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, player_id)
);

-- Indexes for social likes
CREATE INDEX IF NOT EXISTS idx_social_likes_post ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_player ON social_likes(player_id);

-- Social Comments
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES social_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for social comments
CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_social_comments_player ON social_comments(player_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_parent ON social_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- ============================================================================
-- GROUP JOIN REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(group_id, player_id)
);

-- Indexes for group join requests
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON group_join_requests(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_player ON group_join_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(status) WHERE status = 'pending';

-- ============================================================================
-- PLAYER PROFILE ENHANCEMENTS
-- ============================================================================

-- Add new columns to players table
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'skill_level') THEN
    ALTER TABLE players ADD COLUMN skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'professional'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'skill_rating') THEN
    ALTER TABLE players ADD COLUMN skill_rating NUMERIC(2,1) CHECK (skill_rating BETWEEN 1.0 AND 5.0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'home_venue_id') THEN
    ALTER TABLE players ADD COLUMN home_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'bio') THEN
    ALTER TABLE players ADD COLUMN bio TEXT CHECK (LENGTH(bio) <= 500);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'profile_image_url') THEN
    ALTER TABLE players ADD COLUMN profile_image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'equipment') THEN
    ALTER TABLE players ADD COLUMN equipment JSONB DEFAULT '{"racket": null, "shoes": null}'::JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'playing_style') THEN
    ALTER TABLE players ADD COLUMN playing_style JSONB DEFAULT '{"forehand": null, "backhand": null, "serve": null}'::JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'preferred_hand') THEN
    ALTER TABLE players ADD COLUMN preferred_hand TEXT CHECK (preferred_hand IN ('right', 'left', 'ambidextrous'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'city') THEN
    ALTER TABLE players ADD COLUMN city TEXT;
  END IF;
END $$;

-- Indexes for player enhancements
CREATE INDEX IF NOT EXISTS idx_players_skill ON players(skill_level, skill_rating) WHERE skill_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_city ON players(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_home_venue ON players(home_venue_id) WHERE home_venue_id IS NOT NULL;

-- ============================================================================
-- PUBLIC GROUPS DIRECTORY ENHANCEMENTS
-- ============================================================================

-- Add new columns to groups table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_public') THEN
    ALTER TABLE groups ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_joinable') THEN
    ALTER TABLE groups ADD COLUMN is_joinable BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'description') THEN
    ALTER TABLE groups ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'cover_image_url') THEN
    ALTER TABLE groups ADD COLUMN cover_image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'player_count') THEN
    ALTER TABLE groups ADD COLUMN player_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'average_skill_level') THEN
    ALTER TABLE groups ADD COLUMN average_skill_level TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'city') THEN
    ALTER TABLE groups ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'tags') THEN
    ALTER TABLE groups ADD COLUMN tags JSONB DEFAULT '[]'::JSONB;
  END IF;
END $$;

-- Indexes for public groups
CREATE INDEX IF NOT EXISTS idx_groups_public ON groups(is_public, is_joinable, player_count DESC)
  WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_groups_city ON groups(city) WHERE is_public = TRUE AND city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_groups_skill ON groups(average_skill_level) WHERE is_public = TRUE AND average_skill_level IS NOT NULL;

-- ============================================================================
-- VENUE ENHANCEMENTS
-- ============================================================================

-- Add new columns to venues table for booking system
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'latitude') THEN
    ALTER TABLE venues ADD COLUMN latitude NUMERIC(10, 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'longitude') THEN
    ALTER TABLE venues ADD COLUMN longitude NUMERIC(11, 8);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'timezone') THEN
    ALTER TABLE venues ADD COLUMN timezone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'booking_url') THEN
    ALTER TABLE venues ADD COLUMN booking_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'description') THEN
    ALTER TABLE venues ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'amenities') THEN
    ALTER TABLE venues ADD COLUMN amenities JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- Indexes for venue location
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
