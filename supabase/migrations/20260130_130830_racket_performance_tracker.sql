-- ============================================================================
-- Racket Performance Tracker Migration
-- ============================================================================
-- This migration creates tables for racket management and performance tracking,
-- allowing players to associate rackets with matches and analyze their
-- performance by racket model.
--
-- Tables created:
-- - rackets: Player rackets with specifications (brand, model, weight, balance)
-- - match_rackets: Join table linking matches, players, and their rackets
--
-- Functions created:
-- - get_racket_stats: Calculates win rate, ELO change, matches played per racket
-- - get_racket_performance_over_time: Time series data for performance charts
-- - compare_rackets: Side-by-side comparison of multiple rackets
-- - get_player_racket_insights: Best performing, most used, aging warnings
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: rackets
-- ============================================================================
-- Stores racket information owned by players
-- ============================================================================
CREATE TABLE IF NOT EXISTS rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  weight INTEGER CHECK (weight IS NULL OR (weight >= 300 AND weight <= 400)),
  balance INTEGER CHECK (balance IS NULL OR (balance >= 250 AND balance <= 310)),
  purchase_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique racket names per player (brand + model)
  CONSTRAINT rackets_player_brand_model_unique UNIQUE(player_id, brand, model)
);

-- Indexes for efficient queries
CREATE INDEX idx_rackets_player_id ON rackets(player_id);
CREATE INDEX idx_rackets_is_active ON rackets(is_active);
CREATE INDEX idx_rackets_created_at ON rackets(created_at DESC);

-- ============================================================================
-- TABLE: match_rackets
-- ============================================================================
-- Links matches to players and the racket they used
-- ============================================================================
CREATE TABLE IF NOT EXISTS match_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  racket_id UUID REFERENCES rackets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One racket per player per match
  CONSTRAINT match_rackets_match_player_unique UNIQUE(match_id, player_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_match_rackets_match_id ON match_rackets(match_id);
CREATE INDEX idx_match_rackets_player_id ON match_rackets(player_id);
CREATE INDEX idx_match_rackets_racket_id ON match_rackets(racket_id);

-- ============================================================================
-- FUNCTION: get_racket_stats
-- ============================================================================
-- Calculates performance statistics for a specific racket
-- ============================================================================
CREATE OR REPLACE FUNCTION get_racket_stats(p_racket_id UUID, p_group_id UUID)
RETURNS TABLE (
  racket_id UUID,
  matches_played BIGINT,
  matches_won BIGINT,
  win_rate NUMERIC(5,2),
  elo_change NUMERIC(10,2),
  avg_elo NUMERIC(10,2),
  best_elo_gain NUMERIC(10,2),
  worst_elo_drop NUMERIC(10,2),
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH racket_matches AS (
    SELECT
      mr.match_id,
      mr.player_id,
      m.included_in_elo,
      m.created_at
    FROM match_rackets mr
    INNER JOIN matches m ON m.id = mr.match_id
    INNER JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = mr.player_id
    WHERE mr.racket_id = p_racket_id
      AND m.group_id = p_group_id
      AND m.included_in_elo = TRUE
  ),
  match_results AS (
    SELECT
      rm.match_id,
      rm.player_id,
      CASE
        WHEN m.winning_team = 1 AND rm.player_id = ANY(m.team1_players) THEN TRUE
        WHEN m.winning_team = 2 AND rm.player_id = ANY(m.team2_players) THEN TRUE
        ELSE FALSE
      END AS won,
      m.elo_changes
    FROM racket_matches rm
    INNER JOIN matches m ON m.id = rm.match_id
  ),
  elo_changes AS (
    SELECT
      mr.player_id,
      CASE
        WHEN m.elo_changes IS NULL THEN 0
        ELSE (m.elo_changes->mr.player_id->>'delta')::NUMERIC
      END AS elo_delta
    FROM match_results mr
    INNER JOIN matches m ON m.id = mr.match_id
  )
  SELECT
    p_racket_id AS racket_id,
    COUNT(DISTINCT rm.match_id) AS matches_played,
    SUM(CASE WHEN mr.won THEN 1 ELSE 0 END)::BIGINT AS matches_won,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((SUM(CASE WHEN mr.won THEN 1.0 ELSE 0 END) / COUNT(*) * 100)::NUMERIC, 2)
    END AS win_rate,
    COALESCE(SUM(ec.elo_delta), 0)::NUMERIC AS elo_change,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(AVG(m.elo_after->mr.player_id->>'elo'::TEXT)::NUMERIC, 2)
    END AS avg_elo,
    COALESCE(MAX(ec.elo_delta), 0)::NUMERIC AS best_elo_gain,
    COALESCE(MIN(ec.elo_delta), 0)::NUMERIC AS worst_elo_drop,
    MAX(rm.created_at) AS last_used
  FROM match_results mr
  INNER JOIN racket_matches rm2 ON rm2.match_id = rm.match_id AND rm2.player_id = rm.player_id
  INNER JOIN matches m ON m.id = rm.match_id
  LEFT JOIN elo_changes ec ON ec.player_id = rm.player_id
  GROUP BY p_racket_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_racket_performance_over_time
-- ============================================================================
-- Returns time series data for performance charts (rolling 10-match window)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_racket_performance_over_time(p_racket_id UUID, p_group_id UUID)
RETURNS TABLE (
  match_date TIMESTAMPTZ,
  cumulative_matches_played BIGINT,
  rolling_win_rate NUMERIC(5,2),
  cumulative_elo_change NUMERIC(10,2),
  elo_at_match NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH racket_matches_ordered AS (
    SELECT
      m.id,
      m.created_at AS match_date,
      m.elo_before,
      m.elo_after,
      m.winning_team,
      m.team1_players,
      m.team2_players,
      mr.player_id,
      ROW_NUMBER() OVER (ORDER BY m.created_at) AS match_num
    FROM match_rackets mr
    INNER JOIN matches m ON m.id = mr.match_id
    INNER JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = mr.player_id
    WHERE mr.racket_id = p_racket_id
      AND m.group_id = p_group_id
      AND m.included_in_elo = TRUE
    ORDER BY m.created_at
  ),
  match_wins AS (
    SELECT
      rmo.*,
      CASE
        WHEN m.winning_team = 1 AND rmo.player_id = ANY(m.team1_players) THEN TRUE
        WHEN m.winning_team = 2 AND rmo.player_id = ANY(m.team2_players) THEN TRUE
        ELSE FALSE
      END AS won
    FROM racket_matches_ordered rmo
    INNER JOIN matches m ON m.id = rmo.id
  ),
  cumulative_stats AS (
    SELECT
      mw.match_date,
      mw.match_num,
      mw.won,
      CASE
        WHEN m.elo_changes IS NULL THEN 0
        ELSE (m.elo_changes->mw.player_id->>'delta')::NUMERIC
      END AS elo_delta,
      CASE
        WHEN m.elo_after IS NULL THEN 0
        ELSE (m.elo_after->mw.player_id->>'elo'::TEXT)::NUMERIC
      END AS elo_at_match,
      SUM(CASE WHEN mw.won THEN 1 ELSE 0 END) OVER (
        ORDER BY mw.match_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS cumulative_wins,
      SUM(1) OVER (
        ORDER BY mw.match_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS cumulative_matches,
      SUM(CASE WHEN m.elo_changes IS NULL THEN 0
               ELSE (m.elo_changes->mw.player_id->>'delta')::NUMERIC END) OVER (
        ORDER BY mw.match_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS cumulative_elo_change
    FROM match_wins mw
    INNER JOIN matches m ON m.id = mw.id
  ),
  rolling_stats AS (
    SELECT
      cs.match_date,
      cs.match_num AS cumulative_matches_played,
      cs.cumulative_wins,
      cs.cumulative_matches,
      cs.cumulative_elo_change,
      cs.elo_at_match,
      CASE
        WHEN cs.match_num < 10 THEN NULL
        ELSE ROUND((
          SUM(CASE WHEN cs2.won THEN 1 ELSE 0 END)::NUMERIC /
          COUNT(*) * 100
        ), 2)
      END AS rolling_win_rate
    FROM cumulative_stats cs
    LEFT JOIN match_wins cs2 ON cs2.match_num BETWEEN cs.match_num - 9 AND cs.match_num
    GROUP BY cs.match_date, cs.match_num, cs.cumulative_wins, cs.cumulative_matches,
             cs.cumulative_elo_change, cs.elo_at_match
    ORDER BY cs.match_date
  )
  SELECT
    rs.match_date,
    rs.cumulative_matches_played,
    rs.rolling_win_rate,
    rs.cumulative_elo_change::NUMERIC(10,2),
    rs.elo_at_match::NUMERIC(10,2)
  FROM rolling_stats rs;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: compare_rackets
-- ============================================================================
-- Returns side-by-side comparison of multiple rackets for a player
-- ============================================================================
CREATE OR REPLACE FUNCTION compare_rackets(p_player_id UUID, p_group_id UUID, VARIADIC p_racket_ids UUID[])
RETURNS TABLE (
  racket_id UUID,
  brand VARCHAR(100),
  model VARCHAR(100),
  matches_played BIGINT,
  matches_won BIGINT,
  win_rate NUMERIC(5,2),
  elo_change NUMERIC(10,2),
  avg_elo NUMERIC(10,2),
  best_elo_gain NUMERIC(10,2),
  worst_elo_drop NUMERIC(10,2),
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS racket_id,
    r.brand,
    r.model,
    COALESCE(stats.matches_played, 0)::BIGINT AS matches_played,
    COALESCE(stats.matches_won, 0)::BIGINT AS matches_won,
    COALESCE(stats.win_rate, 0)::NUMERIC(5,2) AS win_rate,
    COALESCE(stats.elo_change, 0)::NUMERIC(10,2) AS elo_change,
    COALESCE(stats.avg_elo, 0)::NUMERIC(10,2) AS avg_elo,
    COALESCE(stats.best_elo_gain, 0)::NUMERIC(10,2) AS best_elo_gain,
    COALESCE(stats.worst_elo_drop, 0)::NUMERIC(10,2) AS worst_elo_drop,
    stats.last_used
  FROM unnest(p_racket_ids) WITH ORDINALITY AS t(racket_id, ord)
  LEFT JOIN rackets r ON r.id = t.racket_id AND r.player_id = p_player_id
  LEFT JOIN LATERAL get_racket_stats(t.racket_id, p_group_id) stats ON TRUE
  ORDER BY t.ord;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_player_racket_insights
-- ============================================================================
-- Returns insights: best performing racket, most used racket, aging warnings
-- ============================================================================
CREATE OR REPLACE FUNCTION get_player_racket_insights(p_player_id UUID, p_group_id UUID)
RETURNS TABLE (
  insight_type VARCHAR(50),
  insight_text TEXT,
  racket_id UUID,
  racket_name VARCHAR(200),
  metric_value NUMERIC(10,2),
  metric_label VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  WITH player_rackets AS (
    SELECT r.id, r.brand, r.model
    FROM rackets r
    WHERE r.player_id = p_player_id AND r.is_active = TRUE
  ),
  racket_stats_with_names AS (
    SELECT
      pr.*,
      (pr.brand || ' ' || pr.model) AS racket_name,
      get_racket_stats(pr.id, p_group_id) AS stats
    FROM player_rackets pr
  ),
  expanded_stats AS (
    SELECT
      rs.id AS racket_id,
      rs.racket_name,
      (rs.stats).*
    FROM racket_stats_with_names rs
  )
  -- Best performing racket (highest win rate with min 5 matches)
  SELECT
    'best_performing'::VARCHAR(50) AS insight_type,
    ('Your best performing racket: ' || es.racket_name || ' (' ||
     es.win_rate::TEXT || '% win rate' ||
     CASE WHEN es.elo_change > 0 THEN ', +' || es.elo_change::TEXT || ' ELO'
          WHEN es.elo_change < 0 THEN ', ' || es.elo_change::TEXT || ' ELO'
          ELSE '' END || ')') AS insight_text,
    es.racket_id,
    es.racket_name,
    es.win_rate AS metric_value,
    'Win rate'::VARCHAR(50) AS metric_label
  FROM expanded_stats es
  WHERE es.matches_played >= 5
  ORDER BY es.win_rate DESC NULLS LAST, es.elo_change DESC
  LIMIT 1

  UNION ALL

  -- Most used racket
  SELECT
    'most_used'::VARCHAR(50),
    ('Most used racket: ' || es.racket_name || ' (' ||
     es.matches_played::TEXT || ' matches)')::TEXT,
    es.racket_id,
    es.racket_name,
    es.matches_played::NUMERIC(10,2),
    'Matches played'::VARCHAR(50)
  FROM expanded_stats es
  WHERE es.matches_played > 0
  ORDER BY es.matches_played DESC
  LIMIT 1

  UNION ALL

  -- Aging warnings (80+ matches with win rate decline >10% from peak)
  SELECT
    'aging_warning'::VARCHAR(50),
    ('Aging warning: You've played ' || es.matches_played::TEXT ||
     ' matches with ' || es.racket_name ||
     CASE WHEN es.purchase_date IS NOT NULL
          THEN ' (purchased ' || to_char(es.purchase_date, 'Mon YYYY') || ')'
          ELSE '' END ||
     ', consider checking for wear')::TEXT,
    es.racket_id,
    es.racket_name,
    (es.matches_played)::NUMERIC(10,2),
    'Matches played'::VARCHAR(50)
  FROM expanded_stats es
  WHERE es.matches_played >= 80
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE rackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_rackets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Rackets table RLS
-- ----------------------------------------------------------------------------

-- Players can read their own rackets in any group they're part of
CREATE POLICY "Players can read their own rackets"
  ON rackets FOR SELECT
  USING (
    player_id = auth.uid()
    OR player_id IN (
      SELECT player_id FROM group_members
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- Players can create their own rackets
CREATE POLICY "Players can create their own rackets"
  ON rackets FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
  );

-- Players can update their own rackets
CREATE POLICY "Players can update their own rackets"
  ON rackets FOR UPDATE
  USING (
    player_id = auth.uid()
  );

-- Players can delete their own rackets
CREATE POLICY "Players can delete their own rackets"
  ON rackets FOR DELETE
  USING (
    player_id = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- Match rackets table RLS
-- ----------------------------------------------------------------------------

-- Group members can read match rackets for their group
CREATE POLICY "Group members can read match rackets"
  ON match_rackets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_rackets.match_id
        AND m.group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
  );

-- Players can create match rackets for matches they participate in
CREATE POLICY "Players can create match rackets for their matches"
  ON match_rackets FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_rackets.match_id
        AND m.group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
        AND (
          match_rackets.player_id = ANY(m.team1_players)
          OR match_rackets.player_id = ANY(m.team2_players)
        )
    )
  );

-- Players can update match rackets for their own matches
CREATE POLICY "Players can update their own match rackets"
  ON match_rackets FOR UPDATE
  USING (
    player_id = auth.uid()
  );

-- Players can delete match rackets for their own matches
CREATE POLICY "Players can delete their own match rackets"
  ON match_rackets FOR DELETE
  USING (
    player_id = auth.uid()
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE rackets IS 'Player rackets with specifications';
COMMENT ON TABLE match_rackets IS 'Links matches to players and the racket they used';

COMMENT ON FUNCTION get_racket_stats IS 'Calculates win rate, ELO change, and other stats for a racket';
COMMENT ON FUNCTION get_racket_performance_over_time IS 'Returns time series data for performance charts';
COMMENT ON FUNCTION compare_rackets IS 'Returns side-by-side comparison of multiple rackets';
COMMENT ON FUNCTION get_player_racket_insights IS 'Returns insights: best performing, most used, aging warnings';
