-- Player Search Performance Index
-- Migration: 20260218_000002_player_search_index
-- Author: Chris (Backend Specialist)
-- Description: Add index to optimize player search and sorting by name within groups
-- Reference: DB Health Report recommendation - players(group_id, name) may need for search
--
-- This migration adds an index to optimize queries that:
-- - Filter players by group_id and sort by name (alphabetical player lists)
-- - Search players by name within a group
-- - Fetch player directories for dropdowns and selections
--
-- Performance Impact:
-- - Faster player dropdown rendering in event/match creation
-- - Optimized player list loading with alphabetical sorting
-- - Improved player search functionality

-- ============================================================================
-- INDEX: players(group_id, name)
-- ============================================================================
-- Purpose: Optimize queries that filter players by group and sort by name
-- Query pattern: getPlayers() which:
--   - Filters by group_id
--   - Orders by name (alphabetical)
-- Impact: Faster player selection dropdowns, player lists, search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_group_name
ON public.players(group_id, name);

-- ============================================================================
-- COMMENT: Document index purpose
-- ============================================================================
COMMENT ON INDEX idx_players_group_name IS 'Composite index on (group_id, name) for fast player search and alphabetical sorting within groups';
