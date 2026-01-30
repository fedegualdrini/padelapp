-- RPC functions for tournament management

-- Function to create a tournament with Americano schedule
CREATE OR REPLACE FUNCTION create_tournament(
  p_group_id UUID,
  p_name TEXT,
  p_format TEXT,
  p_start_date TIMESTAMPTZ,
  p_scoring_system TEXT,
  p_court_count INTEGER,
  p_participant_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_tournament_id UUID;
  v_tournament JSONB;
  v_round_id UUID;
  v_match_id UUID;
  v_num_players INTEGER;
  v_num_rounds INTEGER;
  v_half_size INTEGER;
  v_player_ids UUID[];
  v_bye_player UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_court INTEGER;
  v_scheduled_time TIMESTAMPTZ;
BEGIN
  -- Validate minimum participants for Americano
  IF p_format = 'americano' AND array_length(p_participant_ids, 1) < 4 THEN
    RAISE EXCEPTION 'Americano format requires at least 4 participants';
  END IF;

  -- Create tournament
  INSERT INTO tournaments (
    group_id, name, format, status, start_date, scoring_system, court_count, created_by
  ) VALUES (
    p_group_id, p_name, p_format, 'upcoming', p_start_date, p_scoring_system, p_court_count, auth.uid()::text
  )
  RETURNING id INTO v_tournament_id;

  -- Add participants
  FOR v_i IN 1..array_length(p_participant_ids, 1) LOOP
    INSERT INTO tournament_participants (tournament_id, player_id, seed_position)
    VALUES (v_tournament_id, p_participant_ids[v_i], v_i);

    -- Initialize standings
    INSERT INTO tournament_standings (tournament_id, player_id, points, wins, losses, rank)
    VALUES (v_tournament_id, p_participant_ids[v_i], 0, 0, 0, NULL);
  END LOOP;

  -- Generate Americano schedule if format is americano
  IF p_format = 'americano' THEN
    v_player_ids := p_participant_ids;
    v_num_players := array_length(v_player_ids, 1);

    -- Handle odd number of players with bye
    IF v_num_players % 2 != 0 THEN
      v_bye_player := gen_random_uuid(); -- Temporary placeholder
      v_player_ids := array_append(v_player_ids, v_bye_player);
      v_num_players := v_num_players + 1;
    END IF;

    v_num_rounds := v_num_players - 1;
    v_half_size := v_num_players / 2;

    -- Generate rounds using circle method
    FOR v_i IN 1..v_num_rounds LOOP
      -- Create round
      v_scheduled_time := p_start_date + ((v_i - 1) * INTERVAL '1 hour'); -- 1 hour per round

      INSERT INTO tournament_rounds (tournament_id, round_number, scheduled_time)
      VALUES (v_tournament_id, v_i, v_scheduled_time)
      RETURNING id INTO v_round_id;

      -- Generate matches for this round
      v_court := 1;
      FOR v_j IN 1..v_half_size LOOP
        -- Skip if either player is the bye
        IF v_player_ids[v_j] = v_bye_player OR v_player_ids[v_num_players - v_j + 1] = v_bye_player THEN
          CONTINUE;
        END IF;

        -- Create match in matches table
        INSERT INTO matches (group_id, played_at, best_of, created_by)
        VALUES (p_group_id, v_scheduled_time, 3, auth.uid()::text)
        RETURNING id INTO v_match_id;

        -- Create match teams (2v2 for Americano)
        -- Team 1
        INSERT INTO match_teams (match_id, team_number)
        VALUES (v_match_id, 1);

        INSERT INTO match_team_players (match_team_id, player_id)
        SELECT mt.id, v_player_ids[v_j]
        FROM match_teams mt
        WHERE mt.match_id = v_match_id AND mt.team_number = 1;

        -- Team 2
        INSERT INTO match_teams (match_id, team_number)
        VALUES (v_match_id, 2);

        INSERT INTO match_team_players (match_team_id, player_id)
        SELECT mt.id, v_player_ids[v_num_players - v_j + 1]
        FROM match_teams mt
        WHERE mt.match_id = v_match_id AND mt.team_number = 2;

        -- Link to tournament
        INSERT INTO tournament_matches (tournament_id, round_id, match_id, court_number, status)
        VALUES (v_tournament_id, v_round_id, v_match_id, v_court, 'scheduled');

        -- Cycle through courts
        v_court := v_court + 1;
        IF v_court > p_court_count THEN
          v_court := 1;
        END IF;
      END LOOP;

      -- Rotate players (keep first player fixed)
      v_player_ids := ARRAY[v_player_ids[1]] || v_player_ids[v_num_players:v_num_players] || v_player_ids[2:v_num_players-1];
    END LOOP;
  END IF;

  -- Return tournament data
  SELECT to_jsonb(t.*) INTO v_tournament
  FROM tournaments t
  WHERE t.id = v_tournament_id;

  RETURN v_tournament;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tournament status
CREATE OR REPLACE FUNCTION update_tournament_status(
  p_tournament_id UUID,
  p_status TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE tournaments
  SET status = p_status
  WHERE id = p_tournament_id
    AND (created_by = auth.uid()::text OR is_group_admin(group_id));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found or you do not have permission';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add tournament participant
CREATE OR REPLACE FUNCTION add_tournament_participant(
  p_tournament_id UUID,
  p_player_id UUID,
  p_seed_position INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = p_tournament_id
      AND (t.created_by = auth.uid()::text OR is_group_admin(t.group_id))
  ) THEN
    RAISE EXCEPTION 'You do not have permission to modify this tournament';
  END IF;

  -- Check if tournament is still upcoming
  IF EXISTS (
    SELECT 1 FROM tournaments
    WHERE id = p_tournament_id AND status != 'upcoming'
  ) THEN
    RAISE EXCEPTION 'Cannot add participants to a tournament that has already started';
  END IF;

  -- Add participant
  INSERT INTO tournament_participants (tournament_id, player_id, seed_position)
  VALUES (p_tournament_id, p_player_id, p_seed_position)
  ON CONFLICT (tournament_id, player_id) DO NOTHING;

  -- Initialize standings
  INSERT INTO tournament_standings (tournament_id, player_id, points, wins, losses, rank)
  VALUES (p_tournament_id, p_player_id, 0, 0, 0, NULL)
  ON CONFLICT (tournament_id, player_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update match score and recalculate standings
CREATE OR REPLACE FUNCTION update_match_score(
  p_tournament_match_id UUID,
  p_team1_games INTEGER,
  p_team2_games INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_tournament_id UUID;
  v_match_id UUID;
  v_scoring_system TEXT;
  v_team1_players UUID[];
  v_team2_players UUID[];
  v_winner_team INTEGER;
  v_points_per_win INTEGER := 21;
BEGIN
  -- Get tournament match details
  SELECT tm.tournament_id, tm.match_id, t.scoring_system
  INTO v_tournament_id, v_match_id, v_scoring_system
  FROM tournament_matches tm
  JOIN tournaments t ON t.id = tm.tournament_id
  WHERE tm.id = p_tournament_match_id;

  IF v_match_id IS NULL THEN
    RAISE EXCEPTION 'Tournament match not found';
  END IF;

  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM tournaments t
    WHERE t.id = v_tournament_id
      AND (t.created_by = auth.uid()::text OR is_group_admin(t.group_id))
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update this match';
  END IF;

  -- Determine winner
  IF p_team1_games > p_team2_games THEN
    v_winner_team := 1;
  ELSIF p_team2_games > p_team1_games THEN
    v_winner_team := 2;
  ELSE
    RAISE EXCEPTION 'Match cannot end in a tie';
  END IF;

  -- Get players for each team
  SELECT array_agg(mtp.player_id)
  INTO v_team1_players
  FROM match_teams mt
  JOIN match_team_players mtp ON mtp.match_team_id = mt.id
  WHERE mt.match_id = v_match_id AND mt.team_number = 1;

  SELECT array_agg(mtp.player_id)
  INTO v_team2_players
  FROM match_teams mt
  JOIN match_team_players mtp ON mtp.match_team_id = mt.id
  WHERE mt.match_id = v_match_id AND mt.team_number = 2;

  -- Update or insert set scores (assume single set for simplicity)
  INSERT INTO sets (match_id, set_number)
  VALUES (v_match_id, 1)
  ON CONFLICT (match_id, set_number) DO NOTHING;

  INSERT INTO set_scores (set_id, team1_games, team2_games)
  SELECT s.id, p_team1_games, p_team2_games
  FROM sets s
  WHERE s.match_id = v_match_id AND s.set_number = 1
  ON CONFLICT (set_id) DO UPDATE
  SET team1_games = p_team1_games, team2_games = p_team2_games;

  -- Update tournament match status
  UPDATE tournament_matches
  SET status = 'completed'
  WHERE id = p_tournament_match_id;

  -- Update individual standings based on scoring system
  IF v_scoring_system = 'standard_21' THEN
    -- Winners get 21 points, losers get 0
    IF v_winner_team = 1 THEN
      -- Team 1 wins
      UPDATE tournament_standings
      SET points = points + v_points_per_win, wins = wins + 1
      WHERE tournament_id = v_tournament_id AND player_id = ANY(v_team1_players);

      UPDATE tournament_standings
      SET losses = losses + 1
      WHERE tournament_id = v_tournament_id AND player_id = ANY(v_team2_players);
    ELSE
      -- Team 2 wins
      UPDATE tournament_standings
      SET losses = losses + 1
      WHERE tournament_id = v_tournament_id AND player_id = ANY(v_team1_players);

      UPDATE tournament_standings
      SET points = points + v_points_per_win, wins = wins + 1
      WHERE tournament_id = v_tournament_id AND player_id = ANY(v_team2_players);
    END IF;
  END IF;

  -- Recalculate ranks based on points (desc), then wins (desc)
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY tournament_id
        ORDER BY points DESC, wins DESC, losses ASC
      ) as new_rank
    FROM tournament_standings
    WHERE tournament_id = v_tournament_id
  )
  UPDATE tournament_standings ts
  SET rank = r.new_rank
  FROM ranked r
  WHERE ts.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_tournament(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, INTEGER, UUID[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_tournament_status(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_tournament_participant(UUID, UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_match_score(UUID, INTEGER, INTEGER) TO anon, authenticated;
