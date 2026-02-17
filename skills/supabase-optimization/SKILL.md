---
name: supabase-optimization
description: Supabase database optimization, indexing, RLS performance, and query tuning for the Padel app. Covers database migrations, RLS policy optimization, and performance patterns.
metadata:
  author: padel-app
  version: "1.0"
---

# Supabase Database Optimization

## Overview

This skill provides Supabase-specific guidance for database optimization, indexing, RLS performance, and query tuning in the Padel app.

## When to Use This Skill

Use this skill when:
- Optimizing slow database queries
- Adding or tuning indexes
- Reviewing Row Level Security (RLS) policies
- Creating database migrations
- Investigating query performance issues
- Optimizing materialized views

## Key Database Tables

The Padel app uses these main tables (all with RLS):
- `users` - User profiles and preferences
- `groups` - Padel groups/teams
- `group_members` - Group membership (enforced by RLS)
- `matches` - Match records
- `match_players` - Match participants
- `player_stats` - Player statistics (materialized view)
- `pair_aggregates` - Pair statistics (materialized view)
- `bookings` - Court bookings

## Indexing Strategy

### What to Index

**Foreign keys** (default indexes, but check):
- `group_members.group_id` → High-frequency filter
- `matches.group_id` → Most queries filter by group
- `bookings.group_id` → Booking queries

**Composite indexes** (for common WHERE clauses):
- `(group_id, created_at DESC)` → Timeline queries
- `(group_id, elo_rating DESC)` → Leaderboard queries
- `(group_id, status, scheduled_at)` → Upcoming matches

**Partial indexes** (for specific query patterns):
```sql
CREATE INDEX idx_matches_upcoming
  ON matches(scheduled_at)
  WHERE status = 'scheduled' AND scheduled_at > NOW();
```

### Checking Query Performance

```sql
-- Enable pg_stat_statements (if not already)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Analyze Query Plans

```sql
EXPLAIN ANALYZE
SELECT * FROM matches
WHERE group_id = 'group-id'
ORDER BY scheduled_at DESC
LIMIT 20;
```

Look for:
- **Seq Scan** → Add index
- **Filter** → Check index condition
- **Nested Loop** → Consider join order

## RLS Performance Optimization

### Common RLS Performance Issues

**1. Full table scans in policies**
```sql
-- ❌ BAD: Function on indexed column
CREATE POLICY "Users can view group data"
  ON data
  FOR SELECT
  USING (lower(group_id) = auth.uid());
```

Fix: Don't use functions on indexed columns in policy conditions.

**2. Complex subqueries in policies**
```sql
-- ❌ BAD: Subquery for each row
CREATE POLICY "Users can view matches"
  ON matches
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  );
```

Fix: Use a helper function or materialized view.

**3. Inefficient policy checks**
```sql
-- ✅ GOOD: Direct RLS check using auth.uid()
CREATE POLICY "Users can view group data"
  ON data
  FOR SELECT
  USING (group_id = auth.uid());
```

### Optimizing RLS with Helper Functions

```sql
-- Cache group membership check
CREATE OR REPLACE FUNCTION user_is_member(group_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = $1
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Use in policy
CREATE POLICY "Users can view group data"
  ON data
  FOR SELECT
  USING (user_is_member(group_id));
```

## Materialized Views

The Padel app uses these materialized views for performance:

### mv_player_stats_v2
- Aggregates player statistics
- Needs refresh after matches are added/updated
- Refresh strategy: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_player_stats_v2;`

### mv_pair_aggregates
- Aggregates pair-level statistics
- Optimized for leaderboard queries
- Refresh with player stats

### Refresh Strategy

```sql
-- Non-blocking refresh (allows reads during refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_player_stats_v2;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pair_aggregates;
```

**When to refresh:**
- After a match is completed
- After player stats are recalculated
- Scheduled: Every 5-10 minutes (if needed for real-time)

## Migration Best Practices

### 1. Always create indexes in separate transactions

```sql
-- Migration 001_add_group_member_index.up.sql
CREATE INDEX CONCURRENTLY idx_group_members_group
  ON group_members(group_id);
```

### 2. Use CONCURRENTLY for existing tables

```sql
-- Don't lock the table
CREATE INDEX CONCURRENTLY idx_matches_scheduled
  ON matches(scheduled_at);
```

### 3. Downgrade migrations first

```sql
-- Migration 002_remove_unused_index.down.sql
DROP INDEX CONCURRENTLY IF EXISTS idx_old_unused;
```

### 4. Test migrations on staging

1. Check performance impact with `EXPLAIN ANALYZE`
2. Verify no locks on critical tables
3. Test rollback (down migration)
4. Monitor query performance after deployment

## Connection Pooling

The Padel app uses Supabase's built-in connection pooling.

### Best Practices

- Use `createSupabaseServerClient` for server-side queries
- Use `createSupabaseBrowserClient` for client-side queries
- Don't create new connections for each query (reuse client)
- Use transactions for multi-step operations

### Query Batching

```typescript
// ❌ BAD: Multiple round trips
const user = await supabase.from('users').select().eq('id', id);
const groups = await supabase.from('group_members').select().eq('user_id', id);

// ✅ GOOD: Single query with joins
const data = await supabase
  .from('group_members')
  .select(`
    group_id,
    groups!inner(name, emoji)
  `)
  .eq('user_id', id);
```

## Common Query Patterns

### 1. Get user's matches with pagination

```typescript
const { data, error } = await supabase
  .from('matches')
  .select(`
    *,
    match_players!inner(
      player_id,
      player:player_stats!inner(
        player_id,
        elo_rating
      )
    )
  `)
  .eq('group_id', groupId)
  .order('scheduled_at', { ascending: false })
  .range(0, 19); // Page 1, 20 items
```

**Index needed:** `idx_matches_group_scheduled(group_id, scheduled_at DESC)`

### 2. Leaderboard query

```typescript
const { data, error } = await supabase
  .from('mv_player_stats_v2')
  .select('*')
  .eq('group_id', groupId)
  .order('elo_rating', { ascending: false })
  .limit(50);
```

**Index needed:** Materialized view already has index on `(group_id, elo_rating DESC)`

### 3. Check group membership efficiently

```typescript
// Using RLS helper function
const { data, error } = await supabase
  .rpc('user_is_member', { p_group_id: groupId });
```

## Monitoring and Alerts

### Key Metrics to Track

1. **Query latency**
   - Average query time: < 50ms (most queries)
   - P95 query time: < 200ms
   - P99 query time: < 500ms

2. **Index usage**
   - High-frequency indexes should have `idx_scan` > 0
   - Unused indexes: Consider removing (they slow down writes)

3. **RLS policy performance**
   - No Seq Scans in filtered queries
   - Policy checks use indexes

### Setting Up Alerts

Monitor in Supabase dashboard:
- Long-running queries (> 1 second)
- Failed connections
- High CPU/memory usage

## Performance Checklist

Before deploying database changes:

- [ ] Added indexes for new WHERE clauses
- [ ] Tested query plans with `EXPLAIN ANALYZE`
- [ ] Checked for Seq Scans (add index if found)
- [ ] Used `CONCURRENTLY` for existing tables
- [ ] Verified RLS policies don't cause full scans
- [ ] Tested migration on staging
- [ ] Monitored performance after deployment
- [ ] Refreshed materialized views if needed

## Resources

- [Supabase Database Performance](https://supabase.com/docs/guides/database/database-performance)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [RLS Performance](https://supabase.com/docs/guides/auth/row-level-security)

## Notes

- This is a temporary skill until `lb-supabase-skill` can be installed from ClawHub
- Focus on the Padel app's specific tables and query patterns
- Always test changes on staging before production
- Monitor query performance after each deployment
