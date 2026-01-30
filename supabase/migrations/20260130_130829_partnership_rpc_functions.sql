-- RPC function to get partnership match history
-- Returns detailed match history for a specific player pair

CREATE OR REPLACE FUNCTION get_partnership_match_history(
  p_player1_id UUID,
  p_player2_id UUID
)
RETURNS TABLE (
  match_id UUID,
  played_at TIMESTAMPTZ,
  team INTEGER,
  opponent_team_players JSONB,
  result TEXT,
  score_summary TEXT,
  elo_change_player1 NUMERIC,
  elo_change_player2 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH partnership_matches AS (
    SELECT
      m.id AS match_id,
      m.played_at,
      mt.team_number,
      mtp.player_id
    FROM matches m
    JOIN match_teams mt ON m.id = mt.match_id
    JOIN match_team_players mtp ON mt.id = mtp.match_team_id
    WHERE mtp.player_id IN (p_player1_id, p_player2_id)
    GROUP BY m.id, m.played_at, mt.team_number, mtp.player_id
  ),
  paired_matches AS (
    -- Find matches where both players were on the same team
    SELECT pm1.match_id, pm1.played_at, pm1.team_number
    FROM partnership_matches pm1
    JOIN partnership_matches pm2 ON pm1.match_id = pm2.match_id AND pm1.team_number = pm2.team_number
    WHERE pm1.player_id = p_player1_id AND pm2.player_id = p_player2_id
  ),
  match_outcomes AS (
    SELECT
      pm.match_id,
      pm.played_at,
      pm.team_number,
      -- Determine if team won
      (
        SELECT CASE
          WHEN (
            SELECT COUNT(*)
            FROM sets s
            JOIN set_scores ss ON s.id = ss.set_id
            WHERE s.match_id = pm.match_id
            AND s.set_number <= (
              SELECT MAX(set_number) FROM sets WHERE match_id = pm.match_id
            )
            AND (
              (pm.team_number = 1 AND ss.team1_games > ss.team2_games) OR
              (pm.team_number = 2 AND ss.team2_games > ss.team1_games)
            )
          ) > (
            SELECT COUNT(*)
            FROM sets s
            JOIN set_scores ss ON s.id = ss.set_id
            WHERE s.match_id = pm.match_id
            AND s.set_number <= (
              SELECT MAX(set_number) FROM sets WHERE match_id = pm.match_id
            )
            AND (
              (pm.team_number = 1 AND ss.team1_games < ss.team2_games) OR
              (pm.team_number = 2 AND ss.team2_games < ss.team1_games)
            )
          )
          THEN 'win'
          ELSE 'loss'
        END
      ) AS result,
      -- Build score summary
      (
        SELECT STRING_AGG(
          CASE
            WHEN pm.team_number = 1 THEN ss.team1_games || '-' || ss.team2_games
            ELSE ss.team2_games || '-' || ss.team1_games
          END,
          ', '
          ORDER BY s.set_number
        )
        FROM sets s
        JOIN set_scores ss ON s.id = ss.set_id
        WHERE s.match_id = pm.match_id
      ) AS score_summary
    FROM paired_matches pm
  )
  SELECT
    mo.match_id,
    mo.played_at,
    mo.team_number::INTEGER AS team,
    -- Get opponents as JSON
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', opp_players.id,
          'name', opp_players.name
        )
      )
      FROM match_teams opp_team
      JOIN match_team_players opp ON opp_team.id = opp.match_team_id
      JOIN players opp_players ON opp.player_id = opp_players.id
      WHERE opp_team.match_id = mo.match_id
      AND opp_team.team_number != mo.team_number
    ) AS opponent_team_players,
    mo.result,
    mo.score_summary,
    -- ELO changes for each player
    COALESCE(
      (SELECT elo_change FROM individual_elo_changes WHERE player_id = p_player1_id AND as_of_match_id = mo.match_id),
      0
    )::NUMERIC AS elo_change_player1,
    COALESCE(
      (SELECT elo_change FROM individual_elo_changes WHERE player_id = p_player2_id AND as_of_match_id = mo.match_id),
      0
    )::NUMERIC AS elo_change_player2
  FROM match_outcomes mo
  ORDER BY mo.played_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_partnership_match_history(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_partnership_match_history(UUID, UUID) TO anon;

COMMENT ON FUNCTION get_partnership_match_history IS '
Returns detailed match history for a specific player partnership.
Includes match IDs, dates, scores, opponents, and ELO changes for both players.
Ordered by played_at descending (most recent first).
';

-- Helper view for individual ELO changes
-- Create if not exists from the materialized view migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'individual_elo_changes') THEN
    CREATE VIEW individual_elo_changes AS
    SELECT
      player_id,
      as_of_match_id,
      elo_change
    FROM (
      SELECT
        er.player_id,
        er.as_of_match_id,
        er.rating - LAG(er.rating) OVER (
          PARTITION BY er.player_id ORDER BY er.as_of_match_id
        ) AS elo_change,
        LAG(er.rating) OVER (
          PARTITION BY er.player_id ORDER BY er.as_of_match_id
        ) AS prev_rating
      FROM elo_ratings er
    ) t
    WHERE prev_rating IS NOT NULL;

    GRANT SELECT ON individual_elo_changes TO authenticated;
    GRANT SELECT ON individual_elo_changes TO anon;
  END IF;
END $$;
