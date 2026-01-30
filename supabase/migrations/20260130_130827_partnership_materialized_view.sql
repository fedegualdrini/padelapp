-- Materialized view for partnership metrics
-- Calculates partnership statistics for all player pairs that have played together

-- Drop if exists for idempotency
DROP MATERIALIZED VIEW IF EXISTS materialized_partnerships;

CREATE MATERIALIZED VIEW materialized_partnerships AS
WITH player_pairs AS (
  -- Identify all player pairs that have played together on the same team
  SELECT DISTINCT
    LEAST(p1.player_id, p2.player_id) AS player1_id,
    GREATEST(p1.player_id, p2.player_id) AS player2_id,
    m.group_id
  FROM matches m
  JOIN match_teams mt ON m.id = mt.match_id
  JOIN match_team_players p1 ON mt.id = p1.match_team_id
  JOIN match_team_players p2 ON mt.id = p2.match_team_id
  WHERE p1.player_id != p2.player_id
    AND m.played_at < now()
),
partnership_matches AS (
  -- Get all matches for each partnership
  SELECT
    pp.player1_id,
    pp.player2_id,
    pp.group_id,
    m.id AS match_id,
    m.played_at,
    mt.team_number,
    -- Determine if this team won the match
    CASE
      WHEN mt.team_number = 1 AND (
        (SELECT COUNT(*) FROM sets WHERE match_id = m.id AND set_number = 1)
        > (SELECT COUNT(*) FROM sets WHERE match_id = m.id AND set_number = 2)
      ) THEN 1
      WHEN mt.team_number = 2 AND (
        (SELECT COUNT(*) FROM sets WHERE match_id = m.id AND set_number = 2)
        > (SELECT COUNT(*) FROM sets WHERE match_id = m.id AND set_number = 1)
      ) THEN 1
      ELSE 0
    END AS is_win
  FROM player_pairs pp
  JOIN matches m ON pp.group_id = m.group_id
  JOIN match_teams mt ON m.id = mt.match_id
  JOIN match_team_players mtp1 ON mt.id = mtp1.match_team_id AND mtp1.player_id = pp.player1_id
  JOIN match_team_players mtp2 ON mt.id = mtp2.match_team_id AND mtp2.player_id = pp.player2_id
),
partnership_stats AS (
  -- Calculate basic statistics
  SELECT
    player1_id,
    player2_id,
    group_id,
    COUNT(*) AS matches_played,
    SUM(is_win) AS wins,
    COUNT(*) - SUM(is_win) AS losses,
    MIN(played_at) AS first_played_together,
    MAX(played_at) AS last_played_together
  FROM partnership_matches
  GROUP BY player1_id, player2_id, group_id
),
individual_elo_changes AS (
  -- Get individual ELO changes for each player
  SELECT
    player_id,
    as_of_match_id,
    elo_change
  FROM (
    SELECT
      er.player_id,
      er.as_of_match_id,
      -- ELO change from previous match to this match
      er.rating - LAG(er.rating) OVER (
        PARTITION BY er.player_id ORDER BY er.as_of_match_id
      ) AS elo_change,
      -- Track previous rating to filter out first match
      LAG(er.rating) OVER (
        PARTITION BY er.player_id ORDER BY er.as_of_match_id
      ) AS prev_rating
    FROM elo_ratings er
  ) t
  WHERE prev_rating IS NOT NULL
),
partnership_elo_changes AS (
  -- Get ELO changes when playing together
  SELECT
    pm.player1_id,
    pm.player2_id,
    pm.match_id,
    COALESCE(iec1.elo_change, 0) AS elo_change_player1,
    COALESCE(iec2.elo_change, 0) AS elo_change_player2
  FROM partnership_matches pm
  LEFT JOIN individual_elo_changes iec1 ON pm.player1_id = iec1.player_id AND pm.match_id = iec1.as_of_match_id
  LEFT JOIN individual_elo_changes iec2 ON pm.player2_id = iec2.player_id AND pm.match_id = iec2.as_of_match_id
),
partnership_elo_stats AS (
  -- Calculate ELO statistics
  SELECT
    player1_id,
    player2_id,
    -- Average ELO change when playing together (combined for both players)
    AVG(elo_change_player1 + elo_change_player2) AS avg_elo_change_when_paired,
    -- Calculate individual average ELO change baseline
    (
      SELECT AVG(elo_change)
      FROM individual_elo_changes iec
      WHERE iec.player_id = partnership_elo_changes.player1_id
    ) AS avg_individual_elo_change_p1,
    (
      SELECT AVG(elo_change)
      FROM individual_elo_changes iec
      WHERE iec.player_id = partnership_elo_changes.player2_id
    ) AS avg_individual_elo_change_p2
  FROM partnership_elo_changes
  GROUP BY player1_id, player2_id
),
common_opponents AS (
  -- Count common opponents beaten
  SELECT
    pm.player1_id,
    pm.player2_id,
    COUNT(DISTINCT opp.player_id) AS common_opponents_beaten
  FROM partnership_matches pm
  -- Get opponents from the other team
  JOIN match_teams opp_team ON pm.match_id = opp_team.match_id AND opp_team.team_number != pm.team_number
  JOIN match_team_players opp ON opp_team.id = opp.match_team_id
  WHERE pm.is_win = 1
  GROUP BY pm.player1_id, pm.player2_id
)
-- Final query combining all statistics
SELECT
  ps.player1_id,
  ps.player2_id,
  ps.group_id,
  ps.matches_played,
  ps.wins,
  ps.losses,
  ROUND(ps.wins::numeric / NULLIF(ps.matches_played, 0), 3) AS win_rate,
  COALESCE(pes.avg_elo_change_when_paired, 0) AS avg_elo_change_when_paired,
  COALESCE(pes.avg_individual_elo_change_p1, 0) AS avg_individual_elo_change_p1,
  COALESCE(pes.avg_individual_elo_change_p2, 0) AS avg_individual_elo_change_p2,
  -- Average of both players' individual ELO changes
  COALESCE((pes.avg_individual_elo_change_p1 + pes.avg_individual_elo_change_p2) / 2, 0) AS avg_individual_elo_change,
  -- Delta: ELO change when paired vs individual average
  COALESCE(pes.avg_elo_change_when_paired, 0) - COALESCE((pes.avg_individual_elo_change_p1 + pes.avg_individual_elo_change_p2) / 2, 0) AS elo_change_delta,
  COALESCE(co.common_opponents_beaten, 0) AS common_opponents_beaten,
  ps.first_played_together,
  ps.last_played_together,
  -- Calculate synergy score on the fly (can be materialized in view if performance issues)
  -- synergy_score = (win_rate * 0.5) + (normalized_elo_delta * 0.3) + (opponent_quality_factor * 0.2)
  -- For now, store components and calculate in application layer
  now() AS refreshed_at
FROM partnership_stats ps
LEFT JOIN partnership_elo_stats pes ON ps.player1_id = pes.player1_id AND ps.player2_id = pes.player2_id
LEFT JOIN common_opponents co ON ps.player1_id = co.player1_id AND ps.player2_id = co.player2_id
WHERE ps.matches_played >= 3  -- Minimum matches filter
WITH DATA;

-- Create indexes for efficient querying
CREATE INDEX idx_materialized_partnerships_player1 ON materialized_partnerships(player1_id);
CREATE INDEX idx_materialized_partnerships_player2 ON materialized_partnerships(player2_id);
CREATE INDEX idx_materialized_partnerships_group ON materialized_partnerships(group_id);
CREATE INDEX idx_materialized_partnerships_win_rate ON materialized_partnerships(win_rate DESC);
CREATE INDEX idx_materialized_partnerships_matches ON materialized_partnerships(matches_played DESC);

-- Add comment explaining the view
COMMENT ON MATERIALIZED VIEW materialized_partnerships IS '
Materialized view storing partnership metrics for all player pairs that have played together.
Refreshed via trigger or cron job after match changes.

Columns:
- player1_id, player2_id: UUIDs of the two players (always ordered so player1_id < player2_id)
- matches_played: Total number of matches played together
- wins, losses: Win/loss record
- win_rate: Win rate (0 to 1)
- avg_elo_change_when_paired: Average combined ELO change when playing together
- avg_individual_elo_change: Average combined ELO change individually (baseline)
- elo_change_delta: Difference between paired and individual ELO changes
- common_opponents_beaten: Count of distinct opponents defeated together
- first_played_together, last_played_together: Date range of partnership
- refreshed_at: Timestamp of last refresh
';

-- Grant necessary permissions
GRANT SELECT ON materialized_partnerships TO authenticated;
GRANT SELECT ON materialized_partnerships TO anon;
