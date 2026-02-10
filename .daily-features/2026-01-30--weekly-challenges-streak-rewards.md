# Weekly Challenges & Streak Rewards System

## Summary
A gamification layer that keeps players engaged with weekly challenges, streak tracking, and achievement rewards. Players complete objectives like "Play 3 matches", "Win 2 matches", or "Partner with 3 different players" each week, building streaks and earning rewards that maintain consistent engagement.

## Background
Sports apps like Strava, fitness apps, and gaming platforms use weekly challenges to drive consistent user engagement. Padelapp currently tracks matches and stats but lacks:

1. **Engagement hooks** - No reason to check the app regularly between matches
2. **Progressive goals** - Players don't have weekly objectives to work toward
3. **Streak motivation** - No recognition for consistent participation
4. **Social momentum** - No visibility into what others are working on

The Weekly Challenges system would:
- Give players a reason to open the app multiple times per week
- Encourage regular play and social interaction
- Create friendly competition around weekly goals
- Reward consistency without being overly competitive
- Integrate naturally with existing match and stats tracking

## User Stories

### As a player, I want to:
- See my weekly challenges at the start of each week
- Track my progress toward each challenge in real-time
- See how my streak is building as I complete consecutive weeks
- View a leaderboard of who completed challenges this week
- Earn badges or small rewards for reaching streak milestones
- Get notified when I'm close to completing a challenge
- Compare my weekly performance with previous weeks

### As a group admin, I want to:
- Enable/disable weekly challenges for the group
- Customize challenge types based on group preferences
- See engagement metrics (how many players completed challenges)
- Celebrate top performers each week

## Core Features

### 1. Weekly Challenge Generation
- **Automatic weekly reset**: Challenges refresh every Monday at 00:00 UTC
- **Dynamic challenge selection**: 3 challenges per week from a pool:
  1. *Volume*: "Play X matches this week" (3-5 matches)
  2. *Performance*: "Win X matches this week" (1-3 wins)
  3. *Social*: "Partner with X different players" (2-4 partners)
- **Adaptive difficulty**: Adjust targets based on player's recent activity
- **Skip option**: Players can skip a week without breaking streak (max 1 skip per month)

### 2. Progress Tracking
- **Real-time progress dashboard**:
  - Show each challenge with progress bar (e.g., "2/3 matches played")
  - Visual indicators for completed vs. pending challenges
  - Time remaining until week ends
- **Historical view**: Past weeks' challenges and results
- **Streak counter**: "5 weeks in a row!" with visual flame/gem icon

### 3. Streak Rewards
- **Weekly completion**: Badge/emoji for completing all 3 challenges
- **Streak milestones**:
  - 2 weeks: "Getting Started" badge
  - 4 weeks: "Consistent" badge
  - 8 weeks: "Dedicated" badge
  - 12 weeks: "Seasoned Player" badge
  - 24+ weeks: "Legendary" badge
- **Special rewards**: Unique badge for completing challenges for a full year

### 4. Social Leaderboard
- **Weekly leaderboard**: Top 10 players who completed challenges
- **Streak leaderboard**: Longest active streaks in the group
- **Group completion rate**: "7/12 players completed all challenges this week"
- **Celebrate top performers**: Highlight top 3 with crown/trophy icons

### 5. Notifications
- **Weekly reminder**: "New challenges available - check them out!" (Monday)
- **Progress nudges**: "You're 1 win away from completing this week's challenge"
- **Streak warning**: "Complete your challenges by Sunday to keep your streak alive!"
- **Celebration**: "You completed all challenges! 🔥 4-week streak"

### 6. Challenge Customization (Group Admin)
- Toggle weekly challenges on/off per group
- Select which challenge types are active (volume, performance, social)
- Set default difficulty (easy, medium, hard)
- View group engagement stats

## Technical Approach

### Database Schema
```sql
weekly_challenges
  - id
  - group_id (FK)
  - week_start (date, Monday of the week)
  - challenge_type (enum: volume, performance, social)
  - target_value (integer)
  - created_at

player_weekly_progress
  - id
  - player_id (FK)
  - group_id (FK)
  - week_start (date)
  - challenges_completed (integer, 0-3)
  - challenge_1_completed (boolean)
  - challenge_2_completed (boolean)
  - challenge_3_completed (boolean)
  - skipped (boolean)
  - updated_at

streaks
  - id
  - player_id (FK)
  - group_id (FK)
  - current_streak (integer)
  - longest_streak (integer)
  - last_completed_week (date)

player_badges
  - id
  - player_id (FK)
  - badge_id (FK)
  - earned_at

badges
  - id
  - name
  - type (enum: weekly_complete, streak_milestone, special)
  - milestone_value (nullable, for streak badges)
  - icon (emoji or URL)
```

### Challenge Generation Algorithm
1. **Weekly cron job** runs every Sunday night:
   - For each group with challenges enabled:
     - Generate 3 challenges (volume, performance, social)
     - Create `weekly_challenges` records for the week
     - Initialize `player_weekly_progress` for all active players

2. **Progress updates** triggered by match creation/completion:
   - After match: Update relevant progress for all 4 players
   - Check if challenge is completed → update `player_weekly_progress`
   - If all 3 completed → increment streak, award badge

3. **Streak calculation**:
   - If all 3 challenges completed by Sunday 23:59:
     - `streaks.current_streak += 1`
     - Update `streaks.last_completed_week`
   - If not completed (and not skipped):
     - `streaks.current_streak = 0`

### UI Pages

#### Challenges Dashboard (`/g/[slug]/challenges`)
- Hero section: Current streak badge + "X weeks in a row!"
- Current week's 3 challenges with progress bars
- Time remaining countdown
- "View Past Weeks" accordion

#### Leaderboard (`/g/[slug]/challenges/leaderboard`)
- Tab 1: "This Week" - Top completers
- Tab 2: "Streaks" - Longest active streaks
- Group stats: "12/15 players completed last week"

#### Profile Integration
- Add "Badges & Streaks" section to player profile
- Show challenge completion history

### Notification System
- Weekly Monday: "New challenges ready" push notification
- Progress triggers: Nudges when close to completion
- Sunday reminder: "One day left - complete your challenges!"
- Celebration: "You earned a new badge!" with badge preview

## Acceptance Criteria

### v1 - Core Challenges System
- [ ] Weekly challenges auto-generate every Monday
- [ ] Players can view their 3 current challenges and progress
- [ ] Progress updates in real-time as matches are played
- [ ] Streak counter increments when all challenges completed
- [ ] Streak resets to 0 if challenges not completed (unless skipped)
- [ ] Players can skip 1 week per month without breaking streak
- [ ] Badges awarded for streak milestones (2, 4, 8, 12, 24+ weeks)
- [ ] Weekly leaderboard shows top completers
- [ ] Streak leaderboard shows longest active streaks
- [ ] Notifications sent at key moments (Monday, Sunday, progress nudges)

### UI Requirements
- [ ] Challenges dashboard with visual progress bars
- [ ] Streak flame/gem icon with count
- [ ] Leaderboard tabs (Weekly / Streaks)
- [ ] Badge collection view on player profile
- [ ] Mobile-responsive (players check on courtside)

### Edge Cases
- [ ] New player joining mid-week: Challenges still generated, may be hard to complete
- [ ] Inactive players: Don't generate challenges if no matches in last 30 days
- [ ] Group admin disables challenges: Existing streaks preserved, no new challenges
- [ ] Timezone handling: Week boundaries based on UTC, display user's local time

## Future Enhancements (Not v1)
- Custom challenges (e.g., "Win against higher-rated opponent")
- Team challenges (duo objectives)
- Season-long challenges with bigger rewards
- Share achievements on social media
- Challenge templates for different player levels
- Integrate with achievements system (proposed separately)
- Difficulty-based rewards (harder challenges = better badges)

## Design Notes
- Keep challenges achievable but not too easy
- Focus on consistency over perfection
- Skip feature prevents frustration from life events
- Streaks should feel rewarding, not punishing
- Leaderboards should be fun, not cutthroat
- Badges should feel earned and meaningful
- Don't overwhelm with too many challenges (3 is the sweet spot)
