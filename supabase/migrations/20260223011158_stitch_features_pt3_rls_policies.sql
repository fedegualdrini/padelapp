-- Stitch Features Migration - Part 3: RLS Policies
-- Enables RLS and creates all security policies

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COURTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view courts" ON courts;
DROP POLICY IF EXISTS "Group admins can insert courts" ON courts;
DROP POLICY IF EXISTS "Group admins can update courts" ON courts;
DROP POLICY IF EXISTS "Group admins can delete courts" ON courts;

-- Create courts policies
CREATE POLICY "Group members can view courts"
  ON courts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = courts.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can insert courts"
  ON courts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = courts.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can update courts"
  ON courts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = courts.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can delete courts"
  ON courts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = courts.group_id
    AND group_members.user_id = auth.uid()
  ));

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view group bookings" ON bookings;
DROP POLICY IF EXISTS "Group members can create bookings" ON bookings;
DROP POLICY IF EXISTS "Booking creator can update" ON bookings;
DROP POLICY IF EXISTS "Booking creator or admin can delete" ON bookings;

-- Create bookings policies
CREATE POLICY "Group members can view group bookings"
  ON bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = bookings.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group members can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    booked_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = bookings.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Booking creator can update"
  ON bookings FOR UPDATE
  USING (
    booked_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = bookings.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Booking creator or admin can delete"
  ON bookings FOR DELETE
  USING (
    booked_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = bookings.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- BOOKING PARTICIPANTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view booking participants" ON booking_participants;
DROP POLICY IF EXISTS "Authenticated users can be added to bookings" ON booking_participants;
DROP POLICY IF EXISTS "Participants can update their own status" ON booking_participants;
DROP POLICY IF EXISTS "Participants can remove themselves" ON booking_participants;

-- Create booking participants policies
CREATE POLICY "Group members can view booking participants"
  ON booking_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings
    JOIN group_members ON group_members.group_id = bookings.group_id
    WHERE bookings.id = booking_participants.booking_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can be added to bookings"
  ON booking_participants FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      JOIN group_members ON group_members.group_id = bookings.group_id
      WHERE bookings.id = booking_participants.booking_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update their own status"
  ON booking_participants FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Participants can remove themselves"
  ON booking_participants FOR DELETE
  USING (player_id = auth.uid());

-- ============================================================================
-- SOCIAL POSTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view posts" ON social_posts;
DROP POLICY IF EXISTS "Group members can create posts" ON social_posts;
DROP POLICY IF EXISTS "Post authors can update their posts" ON social_posts;
DROP POLICY IF EXISTS "Post authors or admins can delete posts" ON social_posts;

-- Create social posts policies
CREATE POLICY "Group members can view posts"
  ON social_posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = social_posts.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group members can create posts"
  ON social_posts FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = social_posts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can update their posts"
  ON social_posts FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Post authors or admins can delete posts"
  ON social_posts FOR DELETE
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = social_posts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SOCIAL LIKES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view likes" ON social_likes;
DROP POLICY IF EXISTS "Group members can create likes" ON social_likes;
DROP POLICY IF EXISTS "Users can delete their likes" ON social_likes;

-- Create social likes policies
CREATE POLICY "Group members can view likes"
  ON social_likes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM social_posts
    JOIN group_members ON group_members.group_id = social_posts.group_id
    WHERE social_posts.id = social_likes.post_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group members can create likes"
  ON social_likes FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM social_posts
      JOIN group_members ON group_members.group_id = social_posts.group_id
      WHERE social_posts.id = social_likes.post_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their likes"
  ON social_likes FOR DELETE
  USING (player_id = auth.uid());

-- ============================================================================
-- SOCIAL COMMENTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group members can view comments" ON social_comments;
DROP POLICY IF EXISTS "Group members can create comments" ON social_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON social_comments;
DROP POLICY IF EXISTS "Comment authors or admins can delete comments" ON social_comments;

-- Create social comments policies
CREATE POLICY "Group members can view comments"
  ON social_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM social_posts
    JOIN group_members ON group_members.group_id = social_posts.group_id
    WHERE social_posts.id = social_comments.post_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group members can create comments"
  ON social_comments FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM social_posts
      JOIN group_members ON group_members.group_id = social_posts.group_id
      WHERE social_posts.id = social_comments.post_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Comment authors can update their comments"
  ON social_comments FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Comment authors or admins can delete comments"
  ON social_comments FOR DELETE
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM social_posts
      JOIN group_members ON group_members.group_id = social_posts.group_id
      WHERE social_posts.id = social_comments.post_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- GROUP JOIN REQUESTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view pending join requests for public groups" ON group_join_requests;
DROP POLICY IF EXISTS "Authenticated users can create join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group admins can update join requests" ON group_join_requests;
DROP POLICY IF EXISTS "Group admins can delete join requests" ON group_join_requests;

-- Create group join requests policies
CREATE POLICY "Anyone can view pending join requests for public groups"
  ON group_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_join_requests.group_id
      AND groups.is_public = TRUE
    )
    OR player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create join requests"
  ON group_join_requests FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_join_requests.group_id
      AND groups.is_public = TRUE
      AND groups.is_joinable = TRUE
    )
  );

CREATE POLICY "Group admins can update join requests"
  ON group_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_join_requests.group_id
    AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can delete join requests"
  ON group_join_requests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_join_requests.group_id
    AND group_members.user_id = auth.uid()
  ));

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_post_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION update_comments_count() TO authenticated;
