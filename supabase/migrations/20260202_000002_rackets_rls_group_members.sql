-- Rackets and match_rackets RLS: group-membership-based access
-- In this app players.id is a separate UUID (not auth.uid()); policies must allow
-- group members to manage rackets for any player in their group.

-- ----------------------------------------------------------------------------
-- Rackets: drop auth.uid()-based policies and add group-membership-based ones
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Players can read their own rackets" ON rackets;
DROP POLICY IF EXISTS "Players can create their own rackets" ON rackets;
DROP POLICY IF EXISTS "Players can update their own rackets" ON rackets;
DROP POLICY IF EXISTS "Players can delete their own rackets" ON rackets;

-- Group members can read rackets for players in their group
CREATE POLICY "Group members can read rackets for players in group"
  ON rackets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players p
      INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
      WHERE p.id = rackets.player_id
    )
  );

-- Group members can create rackets for players in their group
CREATE POLICY "Group members can create rackets for players in group"
  ON rackets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players p
      INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
      WHERE p.id = rackets.player_id
    )
  );

-- Group members can update rackets for players in their group
CREATE POLICY "Group members can update rackets for players in group"
  ON rackets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
      WHERE p.id = rackets.player_id
    )
  );

-- Group members can delete rackets for players in their group
CREATE POLICY "Group members can delete rackets for players in group"
  ON rackets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM players p
      INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
      WHERE p.id = rackets.player_id
    )
  );

-- ----------------------------------------------------------------------------
-- Match rackets: drop auth.uid()-based policies and add group-membership-based ones
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Players can create match rackets for their matches" ON match_rackets;
DROP POLICY IF EXISTS "Players can update their own match rackets" ON match_rackets;
DROP POLICY IF EXISTS "Players can delete their own match rackets" ON match_rackets;

-- Group members can create match_rackets for matches in their group (player must be in that group)
CREATE POLICY "Group members can create match rackets for group matches"
  ON match_rackets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN players p ON p.id = match_rackets.player_id AND p.group_id = m.group_id
      INNER JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = auth.uid()
      WHERE m.id = match_rackets.match_id
    )
  );

-- Group members can update match_rackets for matches in their group
CREATE POLICY "Group members can update match rackets for group matches"
  ON match_rackets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = auth.uid()
      WHERE m.id = match_rackets.match_id
    )
  );

-- Group members can delete match_rackets for matches in their group
CREATE POLICY "Group members can delete match rackets for group matches"
  ON match_rackets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN group_members gm ON gm.group_id = m.group_id AND gm.user_id = auth.uid()
      WHERE m.id = match_rackets.match_id
    )
  );
