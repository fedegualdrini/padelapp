# Feature: Achievements and Badges System

**Status:** PROPOSED

## Why
Padel is as much about community and engagement as it is about competition. An achievements and badges system adds a gamification layer that drives participation, encourages players to reach new milestones, and creates friendly competition. Players love seeing visual representations of their accomplishments — whether it's their 100th match, a 10-game win streak, or being ranked #1 for a month.

This feature makes the app more engaging and sticky, giving players reasons to keep coming back: "I just need 2 more wins to unlock 'Streak Master'!" or "I'm at 48 matches, almost at 50!"

## Scope
Add an achievements and badges tracking system with:
- Pre-defined achievements for common milestones (matches played, win streaks, ELO milestones, etc.)
- Visual badge display on player profiles and cards
- Achievement unlock notifications
- Progress tracking for incomplete achievements
- Rarity tiers (Common, Rare, Epic, Legendary) for visual variety

### Proposed UX
- **Badges on Player Cards**: Show up to 3 most prestigious badges as small icons on player cards in the Players directory
- **Player Profile Page**: Dedicated "Achievements" section showing:
  - All unlocked badges with full details
  - Locked badges with progress indicators (e.g., "42/50 matches")
  - Achievement category filters (Matches, Streaks, Rankings, Special)
  - Date unlocked for each achievement
- **Badge Popups**: Confetti animation when a player unlocks a new achievement (first visit after unlock)
- **Achievement List View**: Group-wide leaderboard showing who has the most achievements or rarest badges
- **Visual Design**: Each badge has:
  - Unique icon/emoji representation
  - Rarity color (Common: gray, Rare: blue, Epic: purple, Legendary: gold)
  - Hover tooltip with achievement description

### Sample Achievements
**Matches Played:**
- "First Match" (Common) - Play your first match
- "Regular Player" (Common) - 10 matches
- "Veteran" (Rare) - 50 matches
- "Centurion" (Epic) - 100 matches
- "Legend" (Legendary) - 250 matches

**Win Streaks:**
- "On Fire" (Common) - 3-game win streak
- "Hot Streak" (Rare) - 5-game win streak
- "Streak Master" (Epic) - 10-game win streak
- "Unstoppable" (Legendary) - 15-game win streak

**ELO Milestones:**
- "Rated Player" (Common) - Reach 1100 ELO
- "Skilled Player" (Rare) - Reach 1200 ELO
- "Expert" (Epic) - Reach 1300 ELO
- "Champion" (Legendary) - Reach 1400 ELO

**Rankings:**
- "Top 10" (Rare) - Reach top 10 in group rankings
- "Top 5" (Epic) - Reach top 5 in group rankings
- "Number One" (Legendary) - Reach #1 ranking

**Special:**
- "Comeback King" (Epic) - Win a match after losing first 2 sets (if best of 5) or after losing first set (if best of 3)
- "Perfect Set" (Rare) - Win a set 6-0
- "Marathon Match" (Epic) - Win a match 2-1 (3 sets) after losing first set
- "Iron Player" (Rare) - Play 20 matches in a single month

## Acceptance Criteria
- [ ] Player cards show up to 3 badge icons (most prestigious first)
- [ ] Player profile page has dedicated Achievements section with all badges
- [ ] Locked achievements show progress bars (e.g., "42/50 matches")
- [ ] Achievement rarity tiers have distinct visual styles
- [ ] Confetti animation plays when unlocking a new achievement
- [ ] Achievements are calculated correctly based on player stats
- [ ] Achievement list/group view shows who has the most achievements
- [ ] All sample achievements are implemented
- [ ] Empty state handled for players with no achievements
- [ ] Mobile-responsive layout for achievement cards
- [ ] Achievement data persists in database
- [ ] Must pass: `npm test`

## Data Requirements
- New table: `achievements`
  ```sql
  create table achievements (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references players(id) on delete cascade,
    achievement_key text not null, -- e.g., "matches_played_10", "win_streak_5"
    unlocked_at timestamptz not null default now(),
    unique(player_id, achievement_key)
  );
  ```
- New table: `achievement_definitions`
  ```sql
  create table achievement_definitions (
    key text primary key,
    name text not null,
    description text not null,
    rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
    category text not null,
    icon text not null, -- emoji or icon identifier
    achievement_order integer not null -- for sorting within rarity
  );
  ```
- New query: `getPlayerAchievements(groupId, playerId)` returns unlocked achievements + progress for locked ones
- New query: `checkAchievements(groupId, playerId)` - runs all achievement rules and unlocks any newly completed
- Achievement evaluation logic:
  - After each match is added/edited, run `checkAchievements` for all 4 players
  - For each achievement definition, evaluate if criteria is met
  - If met and not already unlocked, insert into `achievements` table

## Test Impact
- Add unit tests for achievement evaluation logic:
  - Single achievement unlock
  - Multiple achievements unlocked at once (e.g., hitting 10 matches unlocks 3 tiered achievements)
  - Progressive achievement tracking (showing 42/50 matches)
  - Achievement re-evaluation after match deletion
- Add E2E test for badge display on player cards
- Add E2E test for achievement section on player profile
- Add E2E test for confetti animation on achievement unlock
- Must pass: `npm test`

## Estimated Size
large

## Notes
- Achievement definitions are seeded in migrations for consistency
- Rarity tiers guide badge sorting: Legendary > Epic > Rare > Common
- Confetti animation should be subtle and celebratory, not intrusive
- Consider adding "achievement share" feature to social media (future iteration)
- Group admins could create custom achievements (future iteration)
- For large groups, consider paginating the achievement list or filtering by rarity
- Achievement checks should be efficient — batch query all players' stats instead of per-achievement queries
- Consider caching achievement status to avoid recalculating on every page load
- Badge icons should work on dark and light modes
- Accessibility: ensure badges have proper aria-labels for screen readers
