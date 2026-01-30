-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('americano', 'round_robin', 'bracket')),
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'in_progress', 'completed')) DEFAULT 'upcoming',
  start_date TIMESTAMPTZ NOT NULL,
  scoring_system TEXT NOT NULL CHECK (scoring_system IN ('standard_21', 'custom')) DEFAULT 'standard_21',
  court_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,

  CONSTRAINT tournaments_min_court_count CHECK (court_count >= 1)
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed_position INTEGER,

  UNIQUE(tournament_id, player_id)
);

-- Tournament rounds
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,

  UNIQUE(tournament_id, round_number)
);

-- Tournament matches
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES tournament_rounds(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  court_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed')) DEFAULT 'scheduled',

  UNIQUE(tournament_id, match_id)
);

-- Tournament standings
CREATE TABLE IF NOT EXISTS tournament_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,

  UNIQUE(tournament_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_group_id ON tournaments(group_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_player_id ON tournament_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament_id ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round_id ON tournament_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_match_id ON tournament_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament_id ON tournament_standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_player_id ON tournament_standings(player_id);
