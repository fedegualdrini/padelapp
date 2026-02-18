# Backend Performance Review

**Date:** 2026-02-18
**Reviewer:** Chris (Backend Specialist)
**Cycle:** Padel Backend Performance Review

---

## Executive Summary

This review examines the backend codebase for performance issues, focusing on database query optimization, N+1 query patterns, and overall data access patterns in `src/lib/data.ts`.

**Key Findings:**
- ✅ Performance indexes migration exists (created 2026-02-16)
- ⚠️ Multiple N+1 query patterns identified
- ✅ Good use of materialized views for expensive aggregations
- ⚠️ Some opportunities for query batching

---

## 1. Database Index Migration Status

### Migration File
- **Location:** `supabase/migrations/20260216_000001_db_performance_indexes.sql`
- **Status:** File exists and contains two performance indexes

### Indexes Defined

#### Index 1: `idx_match_team_players_player`
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_team_players_player
ON public.match_team_players(player_id);
```
- **Purpose:** Optimize queries filtering by player_id to find all matches a player participated in
- **Query Pattern:** `.eq("player_id", playerId)` on match_team_players table
- **Impact:** Faster player match history lookups, player stats calculations, head-to-head queries

#### Index 2: `idx_elo_player_match_desc`
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_elo_player_match_desc
ON public.elo_ratings(player_id, as_of_match_id DESC);
```
- **Purpose:** Optimize queries that get the latest ELO rating for a player
- **Query Pattern:** Filtering by player_id and ordering by as_of_match_id DESC
- **Impact:** Faster leaderboard loading, player profile pages, ELO change calculations

### Migration Application Status
⚠️ **Unable to Verify:** The migration file exists, but without direct database access, cannot confirm if it has been applied to production. Recommendation: Run `SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%'` to verify application.

---

## 2. N+1 Query Issues Analysis

### Critical N+1 Issues

#### 🔴 Issue 1: `getMatchEloDeltas`
**Location:** Lines ~620-660
**Pattern:** Individual RPC calls for each player

```typescript
const deltas = await Promise.all(
  matchPlayers.map(async (row) => {
    // ...
    const { data: prev, error: prevError } = await supabaseServer.rpc(
      "get_player_elo_before",
      {
        p_player_id: row.player_id,
        p_match_id: matchId,
      }
    );
    // ...
  })
);
```

**Impact:** For a match with 4 players, makes 4 separate RPC calls.
**Recommendation:** Create a batch RPC function that accepts multiple (player_id, match_id) pairs.

---

#### 🔴 Issue 2: `getPlayerPartnerStats`
**Location:** Lines ~1800-1860
**Pattern:** Individual queries for each match to get results

```typescript
for (const row of playerMatches) {
  // Get match result to determine win/loss
  const { data: matchResult, error: resultError } = await supabaseServer
    .from("v_player_match_results")
    .select("is_win")
    .eq("match_id", matchTeam.match_id)
    .eq("player_id", playerId)
    .single();
  // ...
}
```

**Impact:** If a player has 20 matches, makes 20 separate queries.
**Recommendation:** Batch query all match results at once using `.in("match_id", matchIds)`.

---

#### 🔴 Issue 3: `getPlayerRecentMatches`
**Location:** Lines ~1880-1950
**Pattern:** Individual queries for each match to get details

```typescript
for (const result of matchResults) {
  // Get match details
  const { data: matchData, error: matchError } = await supabaseServer
    .from("matches")
    .select(
      `
      id,
      played_at,
      match_teams (
        team_number,
        match_team_players (
          player_id,
          players ( name )
        )
      ),
      sets (
        set_number,
        set_scores ( team1_games, team2_games )
      )
    `
    )
    .eq("id", result.match_id)
    .eq("group_id", groupId)
    .single();
  // ...
}
```

**Impact:** For limit=10, makes 10 separate queries with complex joins.
**Recommendation:** Single batch query with `.in("id", matchIds)` and join all related data.

---

#### 🟡 Issue 4: `getAttendanceSummary`
**Location:** Lines ~2300-2350
**Pattern:** Individual attendance queries per occurrence

```typescript
const summaries = await Promise.all(
  occurrences.map(async (occurrence) => {
    const attendance = await getAttendanceForOccurrence(occurrence.id);
    // ...
  })
);
```

**Impact:** For 6 upcoming occurrences, makes 6 separate queries.
**Recommendation:** Single batch query with `.in("occurrence_id", occurrenceIds)` and then map results.

---

#### 🟡 Issue 5: `getCalendarData`
**Location:** Lines ~2600-2700
**Pattern:** Individual attendance queries for each occurrence

```typescript
for (const occ of occurrences) {
  // Get attendance for this occurrence
  const { data: attendance, error: attendanceError } = await supabaseServer
    .from('attendance')
    .select('status')
    .eq('occurrence_id', occ.id);
  // ...
}
```

**Impact:** For a full month (~4-8 events), makes 4-8 separate queries.
**Recommendation:** Same as Issue 4 - batch query all attendance records.

---

### Non-Critical Performance Observations

#### 🟢 Good Practices Observed
1. **Materialized Views:** Excellent use of `mv_player_stats_v2`, `mv_pair_aggregates`, etc. for expensive aggregations
2. **Enriched Views:** `v_player_match_results_enriched` provides pre-computed results, avoiding complex joins
3. **React Cache:** Proper use of `cache()` for `getGroupBySlug` and `getPlayers`
4. **Promise.all:** Used correctly where possible to parallelize independent queries

---

## 3. Unused or Redundant Database Queries

### Redundant Query Patterns Identified

#### Redundancy 1: `getPlayerRecentForm` + `getPlayerRecentMatches`
**Observation:** Both functions query `v_player_match_results_enriched` for recent matches but serve different purposes.
- `getPlayerRecentForm`: Returns aggregate stats and ELO change
- `getPlayerRecentMatches`: Returns detailed match records with opponents

**Impact:** If both are called for the same player, duplicate queries occur.
**Recommendation:** Consider caching or combining these into a single query that returns both aggregates and details.

---

#### Redundancy 2: Repeated ELO queries
**Observation:** Multiple functions fetch latest ELO ratings:
- `getEloLeaderboard`
- `getEloTimeline`
- `getPlayerRecentForm`
- `predictMatchOutcome`

**Impact:** No direct duplication (different contexts), but could benefit from a shared cached function.
**Recommendation:** Create a cached `getLatestEloRatings(playerIds)` function.

---

## 4. Optimization Recommendations

### High Priority (Performance Impact: High)

1. **Create batch RPC for ELO deltas**
   - File: `src/lib/data.ts`, function: `getMatchEloDeltas`
   - Impact: Reduces 4+ queries to 1 for match details page

2. **Batch query match results in `getPlayerPartnerStats`**
   - File: `src/lib/data.ts`, function: `getPlayerPartnerStats`
   - Impact: Reduces N queries to 1 for player profile page

3. **Batch query match details in `getPlayerRecentMatches`**
   - File: `src/lib/data.ts`, function: `getPlayerRecentMatches`
   - Impact: Reduces up to 10 queries to 1 for player profile page

### Medium Priority (Performance Impact: Medium)

4. **Batch attendance queries in `getAttendanceSummary`**
   - File: `src/lib/data.ts`, function: `getAttendanceSummary`
   - Impact: Reduces 4-8 queries to 1 for events page

5. **Batch attendance queries in `getCalendarData`**
   - File: `src/lib/data.ts`, function: `getCalendarData`
   - Impact: Reduces 4-8 queries to 1 for calendar page

6. **Create shared cached function for latest ELO ratings**
   - New function: `getLatestEloRatings(playerIds: string[])`
   - Impact: Eliminates duplicate ELO queries across multiple features

### Low Priority (Performance Impact: Low)

7. **Verify and apply performance indexes**
   - Action: Confirm migration `20260216_000001_db_performance_indexes.sql` is applied
   - Impact: Faster player match history and ELO rating lookups

8. **Consider index on `attendance.occurrence_id`**
   - Purpose: Speed up attendance batch queries
   - Impact: Faster calendar and events pages with many events

---

## 5. Code Quality Assessment

### Strengths
- ✅ Consistent query patterns
- ✅ Good use of TypeScript types
- ✅ Proper error handling
- ✅ Materialized views for expensive aggregations
- ✅ Enriched views for common join patterns

### Areas for Improvement
- ⚠️ Multiple N+1 query patterns
- ⚠️ Lack of query batching for related records
- ⚠️ Some repeated query logic that could be shared

---

## 6. Recommended Next Steps

1. **Immediate (This Sprint)**
   - Verify performance indexes are applied in production
   - Implement batch query for `getPlayerPartnerStats`
   - Implement batch query for `getPlayerRecentMatches`

2. **Short-term (Next Sprint)**
   - Create batch RPC for ELO deltas
   - Batch attendance queries in `getAttendanceSummary` and `getCalendarData`
   - Add index on `attendance.occurrence_id`

3. **Long-term (Future)**
   - Create shared cached functions for common data access patterns
   - Consider implementing query result caching at the Supabase client level
   - Add performance monitoring/logging for slow queries

---

## 7. Performance Metrics (Target)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Match detail page queries | ~6-8 | <4 | ⚠️ Needs work |
| Player profile queries | ~12-15 | <6 | ⚠️ Needs work |
| Calendar page queries | ~6-8 | <3 | ⚠️ Needs work |
| Events page queries | ~5-7 | <3 | ⚠️ Needs work |

---

## 8. Conclusion

The backend codebase shows good understanding of performance best practices with excellent use of materialized views and enriched views. However, there are several N+1 query patterns that should be addressed to improve overall performance, particularly on pages that display match details, player profiles, and calendar/events data.

The performance indexes migration is well-designed but needs verification of application status. Implementing the recommended batch queries should significantly reduce database load and improve page load times.

**Overall Rating:** 7/10
- Database Design: 8/10 (excellent use of views)
- Query Patterns: 6/10 (several N+1 issues)
- Code Quality: 8/10 (clean, well-typed)

**Estimated Performance Gain from Recommendations:** 40-60% reduction in database queries for most pages.

---

*Review completed by Chris (Backend Specialist)*
