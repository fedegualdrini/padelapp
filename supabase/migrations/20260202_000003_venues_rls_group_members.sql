-- Venues RLS: allow group members to create/update/delete venues
-- group_admins uses player_id = auth.uid(), but in this app players.id is a
-- separate UUID, so no one matched. Allow any group member to manage venues.

DROP POLICY IF EXISTS "Group admins can create venues" ON venues;
DROP POLICY IF EXISTS "Group admins can update venues" ON venues;
DROP POLICY IF EXISTS "Group admins can delete venues" ON venues;

-- Group members can create venues in their group
CREATE POLICY "Group members can create venues"
  ON venues FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group members can update venues in their group
CREATE POLICY "Group members can update venues"
  ON venues FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- Group members can delete venues in their group
CREATE POLICY "Group members can delete venues"
  ON venues FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );
