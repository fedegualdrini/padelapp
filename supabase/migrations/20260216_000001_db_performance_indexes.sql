-- DB Performance Indexes for Padelapp
-- Migration: 20260216_000001_db_performance_indexes
-- Author: Chris (Backend Specialist)
-- Description: Add performance indexes for common query patterns
-- Reference: https://github.com/padelapp/padelapp/issues/XX

-- Index 1: match_team_players.player_id
-- Purpose: Optimize queries that filter by player_id to find all matches a player participated in
-- Query pattern: .eq("player_id", playerId) on match_team_players table
-- Impact: Faster player match history lookups, player stats calculations, head-to-head queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_team_players_player
ON public.match_team_players(player_id);

-- Index 2: elo_ratings composite index for latest rating queries
-- Purpose: Optimize queries that get the latest ELO rating for a player
-- Query pattern: Queries filtering by player_id and ordering by as_of_match_id DESC to get latest rating
-- Impact: Faster leaderboard loading, player profile pages, ELO change calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elo_player_match_desc
ON public.elo_ratings(player_id, as_of_match_id DESC);

-- Comment explaining the indexes
COMMENT ON INDEX idx_match_team_players_player IS 'Index on player_id for fast player match history queries';
COMMENT ON INDEX idx_elo_player_match_desc IS 'Composite index on (player_id, as_of_match_id DESC) for fast latest ELO rating lookups';
