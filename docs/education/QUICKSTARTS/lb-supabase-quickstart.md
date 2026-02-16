# Supabase Optimization Quick Start - For Chris (Database + Performance)

**Target Role:** Chris
**Goal:** Database optimization, indexing, RLS policies (Sprint 2 Priority: Performance)
**Skill:** `supabase-optimization` v1.0 (custom skill, ready to use)
**Estimated Time:** 45 minutes

---

## ✅ Status: Ready to Use!

A custom `supabase-optimization` skill has been created and is ready for immediate use.

**Location:** `/home/ubuntu/.openclaw/workspace/padelapp/skills/supabase-optimization/`

**Note:** The `lb-supabase-skill` from ClawHub is still pending due to rate limits. This custom skill covers the key areas Chris needs for database optimization.

---

## What This Skill Does

The `supabase-optimization` skill provides:
- Database performance optimization strategies
- Indexing strategies for the Padel app's tables
- RLS (Row Level Security) performance optimization
- Query pattern analysis and tuning
- Materialized view refresh strategies
- Migration best practices

---

## Your First Quick Task (20 minutes)

Audit the Padel app's database for performance issues:

```
Task: Review database performance:
1. Connect to Supabase dashboard
2. Check for slow queries (>100ms)
3. Identify tables with missing indexes on foreign keys
4. Review the most frequent query patterns in the codebase
5. Note any potential N+1 query issues
```

**Reference:** Read the skill's SKILL.md for guidance:
```bash
cat /home/ubuntu/.openclaw/workspace/padelapp/skills/supabase-optimization/SKILL.md
```

**Key sections to read:**
- "Key Database Tables" — Understanding the schema
- "Indexing Strategy" — What to index and why
- "Checking Query Performance" — How to find slow queries
- "Common Query Patterns" — Padel app specific examples

---

## Second Task - Indexing Plan (15 minutes)

Create an indexing strategy for the Padel app:

```
Task: Create an indexing plan:
1. List all frequently queried columns (from Task 1)
2. Prioritize indexes for hot paths (matches, bookings, leaderboards)
3. Identify composite index opportunities (multi-column WHERE clauses)
4. Document index trade-offs (faster reads vs slower writes)
```

**Example composite index from the skill:**
```sql
CREATE INDEX idx_matches_group_scheduled
  ON matches(group_id, scheduled_at DESC);
```

---

## Third Task - RLS Performance Check (10 minutes)

Review Row Level Security policies for performance:

```
Task: Audit RLS policies:
1. List all tables with RLS enabled
2. Check for full table scans in policy conditions
3. Look for complex subqueries that could be optimized
4. Identify policies that need helper functions
```

**Warning sign:** Policies using functions on indexed columns (e.g., `lower(group_id)`) cause slow queries.

---

## Key Database Tables to Focus On

The Padel app's main tables:
- `matches` — High-frequency queries (scheduled_at, group_id)
- `group_members` — Membership checks (group_id, user_id)
- `bookings` — Booking queries (group_id, court_id, time)
- `mv_player_stats_v2` — Leaderboard (group_id, elo_rating)
- `mv_pair_aggregates` — Pair stats (group_id, pair_id)

---

## Common Query Patterns You'll See

### 1. Get user's matches (most common)
```sql
SELECT * FROM matches
WHERE group_id = 'group-id'
ORDER BY scheduled_at DESC
LIMIT 20;
```
**Needs index:** `(group_id, scheduled_at DESC)`

### 2. Leaderboard query
```sql
SELECT * FROM mv_player_stats_v2
WHERE group_id = 'group-id'
ORDER BY elo_rating DESC
LIMIT 50;
```
**Has index:** Materialized view already optimized

### 3. Group membership check
```sql
SELECT 1 FROM group_members
WHERE group_id = 'group-id' AND user_id = auth.uid();
```
**Has index:** Default foreign key index

---

## Performance Checklist

Use this checklist for every database change:

- [ ] Added indexes for new WHERE clauses
- [ ] Tested query plans with `EXPLAIN ANALYZE`
- [ ] Checked for Seq Scans (add index if found)
- [ ] Used `CONCURRENTLY` for existing tables
- [ ] Verified RLS policies don't cause full scans
- [ ] Tested migration on staging
- [ ] Monitored performance after deployment

---

## When to Use This Skill

Use the `supabase-optimization` skill when:
- ✅ Optimizing slow database queries
- ✅ Adding indexes for performance
- ✅ Reviewing RLS policies
- ✅ Creating database migrations
- ✅ Analyzing query plans
- ✅ Refreshing materialized views
- ✅ Troubleshooting slow operations

---

## Combining Skills

For best results, combine with:
- **`pr-reviewer` skill** — To review DB-related PRs for security
- **`github` skill** — To manage DB migration PRs

---

## Resources in the Skill

The skill includes:
- Complete indexing strategy for Padel app tables
- RLS performance optimization patterns
- Query performance analysis examples
- Migration best practices
- Monitoring and alerting guidelines

---

## Questions?

1. **Read** `SKILL.md` for complete reference
2. **Use** `EXPLAIN ANALYZE` to test query plans
3. **Ask** for help with specific Supabase issues

---

**Next Milestone:** Complete database performance audit by mid-Sprint 2
**Long-term Goal:** Database optimization plan with implemented indexes and optimized RLS policies

---

**Start now:** Read the skill and begin your performance audit!

