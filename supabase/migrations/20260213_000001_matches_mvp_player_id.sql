-- ============================================================================
-- Add mvp_player_id to matches
-- ============================================================================
-- Code paths (match create/edit) send mvp_player_id (a players.id UUID).
-- If the deployed DB is missing this column, match creation will fail with a
-- generic "No se pudo crear el partido" error.
--
-- This migration makes the schema match the app.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS mvp_player_id UUID REFERENCES players(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_mvp_player_id ON matches(mvp_player_id);
