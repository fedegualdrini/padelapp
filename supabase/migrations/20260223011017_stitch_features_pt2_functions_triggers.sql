-- Stitch Features Migration - Part 2: Functions & Triggers
-- Creates all functions and triggers for the Stitch features

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update social posts like count
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add updated_at triggers to relevant tables
DO $$
BEGIN
  -- Courts updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'courts'
    AND tg.tgname = 'update_courts_updated_at'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_courts_updated_at
      BEFORE UPDATE ON courts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Bookings updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'bookings'
    AND tg.tgname = 'update_bookings_updated_at'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_bookings_updated_at
      BEFORE UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Social posts updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'social_posts'
    AND tg.tgname = 'update_social_posts_updated_at'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_social_posts_updated_at
      BEFORE UPDATE ON social_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Social comments updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'social_comments'
    AND tg.tgname = 'update_social_comments_updated_at'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_social_comments_updated_at
      BEFORE UPDATE ON social_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add trigger for likes count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'social_likes'
    AND tg.tgname = 'update_likes_count'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_likes_count
      AFTER INSERT OR DELETE ON social_likes
      FOR EACH ROW
      EXECUTE FUNCTION update_post_counts();
  END IF;
END $$;

-- Add trigger for comments count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger tg
    JOIN pg_class tbl ON tg.tgrelid = tbl.oid
    JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid
    WHERE tbl.relname = 'social_comments'
    AND tg.tgname = 'update_comments_count_trigger'
    AND nsp.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_comments_count_trigger
      AFTER INSERT OR DELETE ON social_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_comments_count();
  END IF;
END $$;
