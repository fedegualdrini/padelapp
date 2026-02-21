# N+1 Query Optimization Audit

**Date:** 2026-02-21  
**Author:** Chris (Backend Specialist)  
**Trello Card:** https://trello.com/c/IcPdjvio/62

## Executive Summary

This audit identified and fixed several critical N+1 query patterns in the padel backend that were causing performance issues. The optimizations reduce database queries from O(n) to O(1) for common operations, significantly improving response times for player stats, match history, and calendar views.

## Identified N+1 Query Issues

### 1. **getPlayerPartnerStats** - Player Partnership Statistics
**Location:** `src/lib/data.ts` line ~1880  
**Issue:** For each match a player participates in, the function queries `v_player_match_results` individually to determine win/loss status.  
**Impact:** If a player has 50 matches, this results in 50 separate queries to get match results.

**Original Pattern (N+1):**
```typescript
for (const row of playerMatches) {
  // ... extract match_id
  const { data: matchResult } = await supabaseServer
    .from("v_player_match_results")
    .select("is_win")
    .eq("match_id", matchTeam.match_id)
    .eq("player_id", playerId)
    .single();
  // ... process result
}
```

**Optimized Pattern (Batch):**
```typescript
// Collect all match IDs first
const matchIds = new Set<string>();
playerMatches.forEach((row) => {
  // ... extract match_id
  matchIds.add(matchTeam.match_id);
});

// Single batch query for all results
const { data: matchResults } = await supabaseServer
  .from("v_player_match_results")
  .select("match_id, is_win")
  .eq("player_id", playerId)
  .in("match_id", Array.from(matchIds));

// Build lookup map
const resultsByMatch = new Map(
  matchResults.map((r) => [r.match_id, r.is_win])
);
```

**Performance Improvement:** 50 queries → 1 query (98% reduction)

### 2. **getPlayerRecentMatches** - Recent Match History
**Location:** `src/lib/data.ts` line ~2007  
**Issue:** For each match result, the function queries the matches table individually to get match details.  
**Impact:** If showing 10 recent matches, this results in 10 separate queries to get match details.

**Original Pattern (N+1):**
```typescript
for (const result of matchResults) {
  const { data: matchData } = await supabaseServer
    .from("matches")
    .select(`...`)
    .eq("id", result.match_id)
    .eq("group_id", groupId)
    .single();
  // ... process match
}
```

**Optimized Pattern (Batch):**
```typescript
// Extract all match IDs
const matchIds = matchResults.map((r) => r.match_id);

// Single batch query for all matches
const { data: matchDetails } = await supabaseServer
  .from("matches")
  .select(`...`)
  .eq("group_id", groupId)
  .in("id", matchIds);

// Build lookup map
const matchDetailsMap = new Map(
  matchDetails.map((m) => [m.id, m])
);
```

**Performance Improvement:** 10 queries → 1 query (90% reduction)

### 3. **getCalendarData** - Monthly Calendar View
**Location:** `src/lib/data.ts` line ~3020  
**Issue:** For each calendar occurrence (event), the function queries attendance individually to get counts.  
**Impact:** If showing a month with 20 events, this results in 20 separate queries to get attendance.

**Original Pattern (N+1):**
```typescript
for (const occ of occurrences) {
  const { data: attendance } = await supabaseServer
    .from('attendance')
    .select('status')
    .eq('occurrence_id', occ.id);
  
  const attendanceCount = attendance.filter(a => a.status === 'confirmed').length;
  // ... build event
}
```

**Optimized Pattern (Batch):**
```typescript
// Batch query all attendance for all occurrences
const occurrenceIds = occurrences.map((occ) => occ.id);
const { data: allAttendance } = await supabaseServer
  .from('attendance')
  .select('occurrence_id, status')
  .in('occurrence_id', occurrenceIds);

// Build attendance count map
const attendanceCountByOccurrence = new Map<string, number>();
allAttendance.forEach((att) => {
  const current = attendanceCountByOccurrence.get(att.occurrence_id) ?? 0;
  if (att.status === 'confirmed') {
    attendanceCountByOccurrence.set(att.occurrence_id, current + 1);
  }
});

// Process occurrences with pre-fetched data
for (const occ of occurrences) {
  const attendanceCount = attendanceCountByOccurrence.get(occ.id) ?? 0;
  // ... build event
}
```

**Performance Improvement:** 20 queries → 1 query (95% reduction)

## Database Indexes Added

To support the optimized queries, the following indexes were added in migration `20260221_000001_n_plus_one_optimization_indexes.sql`:

1. **idx_match_teams_match_id** - Optimizes calendar queries joining matches with teams
2. **idx_match_team_players_match_team** - Optimizes player lookups by match team
3. **idx_sets_match_id** - Optimizes set lookups in match detail queries
4. **idx_set_scores_set_id** - Optimizes score lookups
5. **idx_attendance_occurrence_id** - Optimizes attendance lookups in calendar queries
6. **idx_elo_ratings_as_of_match** - Optimizes ELO rating lookups by match
7. **idx_event_occurrences_group_starts** - Optimizes calendar date range queries
8. **idx_matches_group_played_at** - Optimizes match calendar queries
9. **idx_player_match_results_enriched_player_date** - Optimizes player recent matches queries
10. **idx_player_match_results_match_player** - Optimizes partner stats queries

## Performance Impact

### Before Optimization
- **Player Partner Stats (50 matches):** ~51 queries
- **Player Recent Matches (10 matches):** ~11 queries
- **Monthly Calendar (20 events):** ~22 queries
- **Total for typical page load:** ~84 queries

### After Optimization
- **Player Partner Stats (50 matches):** 2 queries (96% reduction)
- **Player Recent Matches (10 matches):** 2 queries (82% reduction)
- **Monthly Calendar (20 events):** 3 queries (86% reduction)
- **Total for typical page load:** ~7 queries (92% reduction)

## Testing

### Local Testing
```bash
# Start dev server
npm run dev

# Test player stats page
# Navigate to /g/[slug]/players/[id]

# Test calendar page
# Navigate to /g/[slug]/calendar

# Test match history
# Navigate to /g/[slug]/matches
```

### Query Analysis
To verify the optimizations, you can use Supabase's query analyzer:

```sql
-- Analyze player partner stats query
EXPLAIN ANALYZE
SELECT match_id, is_win
FROM v_player_match_results
WHERE player_id = 'player-uuid'
AND match_id IN ('match1', 'match2', ...);

-- Analyze attendance batch query
EXPLAIN ANALYZE
SELECT occurrence_id, status
FROM attendance
WHERE occurrence_id IN ('occ1', 'occ2', ...);
```

## Migration Instructions

1. Apply the migration:
```bash
supabase db push
```

2. Verify indexes were created:
```sql
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

3. Monitor query performance in Supabase dashboard

## Additional Recommendations

### 1. Add Query Monitoring
Consider adding query timing logs to identify future N+1 issues:
```typescript
const startTime = Date.now();
const result = await supabaseServer.from(...).select(...);
const duration = Date.now() - startTime;
if (duration > 100) {
  console.warn(`Slow query (${duration}ms):`, query);
}
```

### 2. Implement Query Caching
For frequently accessed data (like player stats), consider implementing Redis caching:
```typescript
const cacheKey = `player-stats:${playerId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const stats = await calculatePlayerStats(playerId);
await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 min cache
return stats;
```

### 3. Consider GraphQL or Data Loader
For complex queries with multiple relationships, consider using:
- GraphQL with DataLoader for automatic batching
- ORMs with built-in N+1 prevention (Prisma, TypeORM)

### 4. Add Database Connection Pooling
Ensure Supabase connection pooling is enabled for production workloads.

## Conclusion

This optimization significantly improves the performance of the padel backend by eliminating N+1 query patterns. The changes:

- Reduce database queries by 90%+ for common operations
- Improve page load times for player stats, match history, and calendar views
- Add critical indexes to support optimized query patterns
- Maintain code readability with clear batch query patterns

The optimizations follow best practices for Supabase/PostgreSQL query patterns and should provide immediate performance benefits for users.

## Files Modified

1. `supabase/migrations/20260221_000001_n_plus_one_optimization_indexes.sql` - New indexes
2. `src/lib/data.ts` - Optimized query functions
3. `docs/N+1_QUERY_OPTIMIZATION_AUDIT.md` - This documentation

## Next Steps

1. Deploy to staging environment
2. Monitor query performance in Supabase dashboard
3. Run load tests to verify performance improvements
4. Consider implementing additional caching strategies
5. Document query patterns in developer guidelines
