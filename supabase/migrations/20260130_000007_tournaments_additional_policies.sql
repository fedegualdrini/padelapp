-- Additional RLS policies and indexes for tournament management
-- (Additions based on code review feedback)

-- Add DELETE policies for tournament management
CREATE POLICY "Tournament creator or admins can delete tournaments"
  ON tournaments FOR DELETE
  USING (
    created_by = auth.uid()::text
    OR is_group_admin(group_id)
  );

CREATE POLICY "Tournament creator or admins can delete participants"
  ON tournament_participants FOR DELETE
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

CREATE POLICY "Tournament creator or admins can delete matches"
  ON tournament_matches FOR DELETE
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

-- Add INSERT/UPDATE policies for tournament_rounds
CREATE POLICY "Tournament creator or admins can manage rounds"
  ON tournament_rounds FOR ALL
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

-- Add INSERT/UPDATE policies for tournament_standings
CREATE POLICY "Tournament creator or admins can manage standings"
  ON tournament_standings FOR ALL
  USING (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  )
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
    )
  );

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournament_standings_rank ON tournament_standings(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round_status ON tournament_matches(round_id, status);

-- Grants for tournament tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tournaments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tournament_participants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tournament_rounds TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tournament_matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tournament_standings TO anon, authenticated;
