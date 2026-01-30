-- Trigger to refresh partnership materialized view after match-related changes
-- For performance, we use a deferred refresh to avoid refreshing on every single change

-- Create a function to mark that partnerships need refresh
CREATE OR REPLACE FUNCTION mark_partnerships_stale()
RETURNS trigger AS $$
BEGIN
  -- Set a flag in a table that indicates partnerships need refresh
  -- This avoids refreshing the materialized view on every single match change
  INSERT INTO partnership_refresh_flags (needs_refresh, updated_at)
  VALUES (true, now())
  ON CONFLICT (id) DO UPDATE SET needs_refresh = true, updated_at = now();

  RETURN null;
END;
$$ LANGUAGE plpgsql;

-- Create a table to track refresh status (idempotent)
CREATE TABLE IF NOT EXISTS partnership_refresh_flags (
  id bool PRIMARY KEY DEFAULT true,
  needs_refresh boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert the initial flag row
INSERT INTO partnership_refresh_flags (id, needs_refresh, updated_at)
VALUES (true, false, now())
ON CONFLICT (id) DO NOTHING;

-- Create triggers on match-related tables
-- Drop existing triggers first for idempotency
DROP TRIGGER IF EXISTS trigger_partnerships_match_teams ON match_teams;
DROP TRIGGER IF EXISTS trigger_partnerships_match_team_players ON match_team_players;
DROP TRIGGER IF EXISTS trigger_partnerships_sets ON sets;
DROP TRIGGER IF EXISTS trigger_partnerships_set_scores ON set_scores;
DROP TRIGGER IF EXISTS trigger_partnerships_elo_ratings ON elo_ratings;

-- Trigger on match_teams insert/update/delete
CREATE TRIGGER trigger_partnerships_match_teams
AFTER INSERT OR UPDATE OR DELETE ON match_teams
FOR EACH ROW EXECUTE FUNCTION mark_partnerships_stale();

-- Trigger on match_team_players insert/update/delete
CREATE TRIGGER trigger_partnerships_match_team_players
AFTER INSERT OR UPDATE OR DELETE ON match_team_players
FOR EACH ROW EXECUTE FUNCTION mark_partnerships_stale();

-- Trigger on sets insert/update/delete
CREATE TRIGGER trigger_partnerships_sets
AFTER INSERT OR UPDATE OR DELETE ON sets
FOR EACH ROW EXECUTE FUNCTION mark_partnerships_stale();

-- Trigger on set_scores insert/update/delete
CREATE TRIGGER trigger_partnerships_set_scores
AFTER INSERT OR UPDATE OR DELETE ON set_scores
FOR EACH ROW EXECUTE FUNCTION mark_partnerships_stale();

-- Trigger on elo_ratings insert/update
CREATE TRIGGER trigger_partnerships_elo_ratings
AFTER INSERT OR UPDATE ON elo_ratings
FOR EACH ROW EXECUTE FUNCTION mark_partnerships_stale();

-- Create a function to refresh partnerships if stale
CREATE OR REPLACE FUNCTION refresh_partnerships_if_stale()
RETURNS void AS $$
DECLARE
  v_needs_refresh boolean;
BEGIN
  -- Check if refresh is needed
  SELECT needs_refresh INTO v_needs_refresh
  FROM partnership_refresh_flags
  WHERE id = true
  LIMIT 1;

  IF v_needs_refresh THEN
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY materialized_partnerships;

    -- Reset the flag
    UPDATE partnership_refresh_flags
    SET needs_refresh = false, updated_at = now()
    WHERE id = true;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add a comment explaining the refresh mechanism
COMMENT ON TABLE partnership_refresh_flags IS '
Table used to track whether partnership materialized view needs refresh.
Triggers on match-related tables set needs_refresh = true.
Application calls refresh_partnerships_if_stale() before querying.
';

COMMENT ON FUNCTION refresh_partnerships_if_stale() IS '
Refresh the materialized_partnerships view if the stale flag is set.
This function should be called by the application before querying partnership data.
For example: SELECT refresh_partnerships_if_stale(); before API calls.

Uses CONCURRENTLY to avoid locking the view during refresh.
';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION refresh_partnerships_if_stale() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_partnerships_if_stale() TO anon;
