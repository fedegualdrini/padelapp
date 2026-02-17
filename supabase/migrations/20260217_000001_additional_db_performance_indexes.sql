-- Additional DB Performance Indexes for Padelapp
-- Migration: 20260217_000001_additional_db_performance_indexes
-- Author: Chris (Backend Specialist)
-- Description: Add additional performance indexes for common query patterns
-- Reference: Follow-up to PR #15, based on DB audit findings
--
-- This migration adds indexes to optimize queries that were identified
-- during the DB audit as potentially slow with growing data volumes.

-- ============================================================================
-- INDEX: match_teams(id)
-- ============================================================================
-- Purpose: Optimize queries that join match_team_players -> match_teams -> matches
-- Query pattern: When filtering matches by player_id, we:
--   1. Query match_team_players by player_id (idx_match_team_players_player)
--   2. Join match_teams by match_team_id (needs idx_match_teams_id)
--   3. Filter matches by match_ids
-- Impact: Faster player match history queries, head-to-head comparisons
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_teams_id
ON public.match_teams(id);

-- ============================================================================
-- INDEX: attendance(occurrence_id, status, player_id)
-- ============================================================================
-- Purpose: Optimize queries that fetch confirmed players with their ELO ratings
-- Query pattern: getConfirmedPlayersWithElo() which:
--   - Filters by occurrence_id and status='confirmed'
--   - Joins with players table for player details
--   - Then queries elo_ratings for those players
-- Impact: Faster event team balancing, player selection dropdowns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_occurrence_status_player
ON public.attendance(occurrence_id, status, player_id);

-- ============================================================================
-- INDEX: matches(id, group_id)
-- ============================================================================
-- Purpose: Optimize queries that filter matches by both id and group_id
-- Query pattern: Common pattern in getMatchById() and similar functions
-- Impact: Faster match detail page loads, match editing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_id_group
ON public.matches(id, group_id);

-- ============================================================================
-- INDEX: players(id, group_id)
-- ============================================================================
-- Purpose: Optimize queries that frequently join players with their group
-- Query pattern: Many queries filter by player_id and also need group_id
-- Impact: Faster player profile pages, player stats lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_id_group
ON public.players(id, group_id);

-- ============================================================================
-- INDEX: elo_ratings(created_at DESC)
-- ============================================================================
-- Purpose: Optimize queries that order ELO ratings by creation time
-- Query pattern: getConfirmedPlayersWithElo() orders by created_at DESC
--   to get the latest rating for each player
-- Impact: Faster ELO lookups for team balancing and player comparisons
-- Note: Complements existing idx_elo_player_match_desc for different query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elo_ratings_created_at_desc
ON public.elo_ratings(created_at DESC);

-- ============================================================================
-- INDEX: event_occurrences(weekly_event_id, status, starts_at)
-- ============================================================================
-- Purpose: Optimize queries that fetch upcoming/active event occurrences
-- Query pattern: Queries filtering by weekly_event_id and status='open',
--   ordered by starts_at to show upcoming events
-- Impact: Faster events page loading, event scheduling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_occurrences_weekly_status_starts
ON public.event_occurrences(weekly_event_id, status, starts_at);

-- ============================================================================
-- INDEX: group_members(user_id, joined_at DESC)
-- ============================================================================
-- Purpose: Optimize queries that fetch user's groups with most recent first
-- Query pattern: getGroups() and similar functions may benefit from this
-- Impact: Faster group selection, group switching
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_user_joined
ON public.group_members(user_id, joined_at DESC);

-- ============================================================================
-- COMMENTS: Document index purposes
-- ============================================================================
COMMENT ON INDEX idx_match_teams_id IS 'Index on match_teams id for fast joins from match_team_players';
COMMENT ON INDEX idx_attendance_occurrence_status_player IS 'Composite index for confirmed players queries with player join';
COMMENT ON INDEX idx_matches_id_group IS 'Composite index on (id, group_id) for match lookup by both';
COMMENT ON INDEX idx_players_id_group IS 'Composite index on (id, group_id) for player-group joins';
COMMENT ON INDEX idx_elo_ratings_created_at_desc IS 'Index on created_at DESC for latest ELO rating by time';
COMMENT ON INDEX idx_event_occurrences_weekly_status_starts IS 'Index for upcoming events queries';
COMMENT ON INDEX idx_group_members_user_joined IS 'Index for user groups ordered by join date';
