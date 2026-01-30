-- Helper function to check if user is group admin (using group_admins table)
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_admins
    WHERE group_id = group_uuid AND player_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE;

-- Enable RLS on all tournament tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;

-- Policies for tournaments
CREATE POLICY "Tournaments are viewable by group members"
  ON tournaments FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (
    is_group_admin(group_id)
    AND created_by = auth.uid()::text
  );

CREATE POLICY "Tournament creator or admins can update tournaments"
  ON tournaments FOR UPDATE
  USING (
    created_by = auth.uid()::text
    OR is_group_admin(group_id)
  );

-- Policies for tournament_participants
CREATE POLICY "Participants are viewable by group members"
  ON tournament_participants FOR SELECT
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE group_id IN (
        SELECT group_id FROM group_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Tournament creator or admins can add participants"
  ON tournament_participants FOR INSERT
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

-- Policies for tournament_rounds
CREATE POLICY "Rounds are viewable by group members"
  ON tournament_rounds FOR SELECT
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE group_id IN (
        SELECT group_id FROM group_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for tournament_matches
CREATE POLICY "Tournament matches are viewable by group members"
  ON tournament_matches FOR SELECT
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE group_id IN (
        SELECT group_id FROM group_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Tournament creator or admins can update tournament match status"
  ON tournament_matches FOR UPDATE
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

-- Policies for tournament_standings
CREATE POLICY "Standings are viewable by group members"
  ON tournament_standings FOR SELECT
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE group_id IN (
        SELECT group_id FROM group_members
        WHERE user_id = auth.uid()
      )
    )
  );
