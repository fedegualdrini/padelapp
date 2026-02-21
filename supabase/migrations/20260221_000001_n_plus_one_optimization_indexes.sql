-- N+1 Query Optimization - Additional Performance Indexes
-- Migration: 20260221_000001_n_plus_one_optimization_indexes
-- Author: Chris (Backend Specialist)
-- Description: Add indexes to fix N+1 query patterns in player stats, match history, and calendar queries
-- Reference: Trello Card https://trello.com/c/IcPdjvio/62

-- Index 1: match_teams.match_id for faster calendar queries
-- Purpose: Optimize queries joining matches with match_teams
-- Query pattern: Calendar queries that fetch matches and their teams
-- Impact: Faster calendar loading, match detail pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_teams_match_id
ON public.match_teams(match_id);

-- Index 2: match_team_players.match_team_id composite index
-- Purpose: Optimize queries that join match_teams with match_team_players
-- Query pattern: Fetching all players in a match's teams
-- Impact: Faster match detail queries, player stats calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_team_players_match_team
ON public.match_team_players(match_team_id);

-- Index 3: sets.match_id for faster match detail queries
-- Purpose: Optimize queries that fetch sets for a match
-- Query pattern: Match detail queries that include set scores
-- Impact: Faster match detail pages, calendar queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sets_match_id
ON public.sets(match_id);

-- Index 4: set_scores.set_id for faster set score lookups
-- Purpose: Optimize queries that join sets with set_scores
-- Query pattern: Match detail queries that include set scores
-- Impact: Faster match detail pages, score calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_set_scores_set_id
ON public.set_scores(set_id);

-- Index 5: attendance.occurrence_id for calendar queries
-- Purpose: Optimize queries that fetch attendance for calendar occurrences
-- Query pattern: Calendar queries that show attendance counts per event
-- Impact: Faster calendar loading, event management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_occurrence_id
ON public.attendance(occurrence_id);

-- Index 6: elo_ratings.as_of_match_id for ELO delta calculations
-- Purpose: Optimize queries that look up ELO ratings by match
-- Query pattern: ELO delta calculations that need to find ratings at a specific match
-- Impact: Faster ELO change calculations, match detail pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elo_ratings_as_of_match
ON public.elo_ratings(as_of_match_id);

-- Index 7: event_occurrences.group_id composite index with date range
-- Purpose: Optimize calendar queries that filter by group and date range
-- Query pattern: Calendar queries filtering by group_id and date range
-- Impact: Faster calendar loading for groups with many events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_occurrences_group_starts
ON public.event_occurrences(group_id, starts_at);

-- Index 8: matches.group_id composite index with played_at
-- Purpose: Optimize calendar queries that filter matches by group and date
-- Query pattern: Calendar queries that fetch matches for a date range
-- Impact: Faster calendar loading, match history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_group_played_at
ON public.matches(group_id, played_at);

-- Index 9: v_player_match_results_enriched composite index
-- Purpose: Optimize player recent matches queries
-- Query pattern: Queries filtering by player_id, group_id, and ordering by played_at
-- Impact: Faster player recent matches, player form calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_match_results_enriched_player_date
ON public.v_player_match_results_enriched(player_id, group_id, played_at DESC);

-- Index 10: v_player_match_results composite index
-- Purpose: Optimize partner stats queries
-- Query pattern: Queries filtering by match_id and player_id
-- Impact: Faster partner statistics calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_match_results_match_player
ON public.v_player_match_results(match_id, player_id);

-- Comments explaining the purpose of each index
COMMENT ON INDEX idx_match_teams_match_id IS 'Index on match_id for fast match team lookups in calendar queries';
COMMENT ON INDEX idx_match_team_players_match_team IS 'Composite index for fast player lookup by match team';
COMMENT ON INDEX idx_sets_match_id IS 'Index on match_id for fast set lookups in match detail queries';
COMMENT ON INDEX idx_set_scores_set_id IS 'Index on set_id for fast score lookups';
COMMENT ON INDEX idx_attendance_occurrence_id IS 'Index on occurrence_id for fast attendance lookups in calendar';
COMMENT ON INDEX idx_elo_ratings_as_of_match IS 'Index on as_of_match_id for fast ELO rating lookups';
COMMENT ON INDEX idx_event_occurrences_group_starts IS 'Composite index for calendar date range queries';
COMMENT ON INDEX idx_matches_group_played_at IS 'Composite index for match calendar queries';
COMMENT ON INDEX idx_player_match_results_enriched_player_date IS 'Composite index for player recent matches queries';
COMMENT ON INDEX idx_player_match_results_match_player IS 'Composite index for partner stats queries';
