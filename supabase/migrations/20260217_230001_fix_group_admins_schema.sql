-- ============================================================================
-- CRITICAL FIX: group_admins Table Schema
-- ============================================================================
-- Issue: The group_admins table had primary key (group_id) which only allowed
-- ONE admin per group. This broke tournament and venue admin features.
--
-- Additionally, the is_group_admin() function compared player_id with auth.uid(),
-- which are different UUIDs - players.id is not the same as auth.user.id.
--
-- Solution:
-- 1. Rebuild group_admins table with proper schema:
--    - Primary key: (group_id, user_id) to allow multiple admins per group
--    - Direct user_id mapping instead of player_id for RLS checks
--
-- 2. Fix is_group_admin() function to use user_id instead of player_id
--
-- 3. Update RLS policies to use the fixed function
--
-- Note: Existing group_admins data is NOT preserved because there was no
-- reliable way to map player_id to user_id (no such relationship existed).
-- Admins will need to be reconfigured after this migration.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop the old group_admins table
-- ============================================================================
DROP TABLE IF EXISTS group_admins CASCADE;

-- ============================================================================
-- STEP 2: Create group_admins table with correct schema
-- ============================================================================
CREATE TABLE group_admins (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Add index for faster admin lookups
CREATE INDEX idx_group_admins_user ON group_admins(user_id);

-- ============================================================================
-- STEP 3: Enable RLS and set up policies
-- ============================================================================
ALTER TABLE group_admins ENABLE ROW LEVEL SECURITY;

-- Group members can view who the admins are for their group
CREATE POLICY "Group members can view admins"
  ON group_admins FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 4: Fix is_group_admin() function to use user_id
-- ============================================================================
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_admins
    WHERE group_id = group_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- STEP 5: Update tournament RLS policies to use the fixed function
-- ============================================================================
-- Note: These policies were already created in 20260130_000005_tournaments_rls_policies.sql
-- We're updating them here to ensure they work with the fixed function

DROP POLICY IF EXISTS "Group admins can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Tournament creator or admins can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Tournament creator or admins can add participants" ON tournament_participants;
DROP POLICY IF EXISTS "Tournament creator or admins can update tournament match status" ON tournament_matches;

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

CREATE POLICY "Tournament creator or admins can add participants"
  ON tournament_participants FOR INSERT
  WITH CHECK (
    tournament_id IN (
      SELECT id FROM tournaments
      WHERE created_by = auth.uid()::text
      OR is_group_admin(group_id)
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

-- ============================================================================
-- STEP 6: Add grants for group_admins table
-- ============================================================================
GRANT SELECT ON group_admins TO anon, authenticated;

-- ============================================================================
-- STEP 7: Add helper function to promote a group member to admin
-- ============================================================================
CREATE OR REPLACE FUNCTION promote_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO group_admins (group_id, user_id)
  VALUES (p_group_id, p_user_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN EXISTS (
    SELECT 1 FROM group_admins
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION promote_group_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 8: Add helper function to demote a group admin
-- ============================================================================
CREATE OR REPLACE FUNCTION demote_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM group_admins
  WHERE group_id = p_group_id AND user_id = p_user_id;

  RETURN NOT EXISTS (
    SELECT 1 FROM group_admins
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION demote_group_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- STEP 9: Add helper function to check if a user is group admin (for app use)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_group_admin(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_group_admin(p_group_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION check_group_admin(UUID) TO authenticated;
