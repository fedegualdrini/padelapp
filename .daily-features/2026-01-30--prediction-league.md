# Feature: Prediction League

## Summary
A competitive meta-game where group members predict match outcomes before they're played, track prediction accuracy, and compete on a prediction leaderboard. This adds engagement for spectators, creates friendly competition beyond the court, and encourages more people to interact with the app even when not playing.

## Background

Padelapp is great for tracking matches and ELO, but it's primarily useful for players who actively participate. Group members who:
- Are injured or taking a break
- Want to stay engaged between their own matches
- Enjoy the social and competitive aspects
- Want to prove they "know the game"

...don't have much reason to use the app daily.

A Prediction League transforms Padelapp into a community hub where everyone can participate:
- **Spectator engagement**: Non-players can follow matches and make predictions
- **Friendly competition**: Bragging rights for being the best predictor
- **Higher engagement**: More users checking the app regularly
- **Social proof**: Active groups attract new members
- **Insight discovery**: Prediction trends reveal which matchups are unpredictable

**Why not just track ELO predictions?**
The existing "Match Prediction Confidence" feature (implemented) shows algorithmic ELO-based predictions. The Prediction League is fundamentally different:
- **User predictions**: Humans predict outcomes based on intuition, not algorithms
- **Meta-competition**: Users compete on prediction accuracy, not on court
- **Social**: Users can discuss predictions, defend their picks, and learn from each other
- **Fun**: Gamification points, streaks, badges for prediction performance

## User Stories

### As a player, I want to:
- Predict outcomes of upcoming matches in my group
- See my prediction accuracy rate and ranking
- Compete with friends on who knows the game best
- Earn badges for prediction milestones (perfect month, 10-correct streak, etc.)
- View prediction breakdown: who picked which team, and who was right

### As a group admin, I want to:
- Enable/disable the prediction league for my group
- See prediction league engagement metrics (how many people are predicting)
- Leaderboard sorted by accuracy or total correct predictions
- Identify the most "knowledgeable" players in the group

### As a spectator/non-player, I want to:
- Follow my group's matches through predictions
- Participate in the community even when not playing
- See who's picking favorites and who's going against the odds

## Core Features

### 1. Match Prediction UI
- **Where**: On match cards before matches are played
- **How it looks**:
  - Predict button: "🎯 Predict winner"
  - Shows which team you picked (after prediction)
  - Shows group consensus: "12/15 members predict Team A"
  - Confetti animation when you predict correctly (after match)

- **Prediction flow**:
  1. User taps "Predict winner" on upcoming match
  2. Modal appears: "Who do you think will win?"
  3. Two buttons: Team A name vs Team B name
  4. User selects team → prediction saved
  5. Button changes to show pick: "You predicted: Team A 🎯"
  6. User can change prediction until match starts

- **Rules**:
  - Predictions close when match starts (status changes from "upcoming" to "in_progress")
  - One prediction per user per match
  - Predictions are visible to all group members after match starts
  - Users who play in the match cannot predict (conflict of interest)

### 2. Prediction Leaderboard
- **Page**: `/g/[slug]/predictions` (accessible from navigation)
- **Leaderboard sorts by**:
  - Primary: Prediction accuracy % (correct predictions / total predictions)
  - Secondary: Total correct predictions
  - Tertiary: Most recent correct prediction timestamp

- **Player card shows**:
  - Avatar + name
  - Accuracy: "78% (45/58 correct)"
  - Current streak: "🔥 7 in a row"
  - Best streak: "Longest: 12"
  - Recent prediction results (last 5): ✅✅✅❌✅

- **Leaderboard views**:
  - **All time**: Overall leaderboard
  - **This month**: Monthly competition
  - **This week**: Weekly hot streaks
  - **By ELO gap**: Filter to show accuracy on predictions where teams were closely/loosely matched

### 3. Prediction Badges & Achievements
- **Badge types**:
  - **First Pick**: "Made your first prediction"
  - **Sharpshooter**: "10+ predictions in a row correct"
  - **Oracle**: "75%+ accuracy across 50+ predictions"
  - **Underdog Whisperer**: "Correctly predicted 5+ upsets (team <40% win prob)"
  - **Monthly Champion**: "Best predictor of the month"
  - **Crowd Pleaser**: "Your pick matched the majority 20+ times"
  - **Contrarian**: "Correctly predicted against the majority 10+ times"

- **Badge display**:
  - On player profile page (alongside achievements)
  - On leaderboard card (up to 3 badges shown)
  - Badge showcase page: All earned badges with dates

### 4. Match Prediction Breakdown
- **When**: After match is completed
- **Where**: Match detail page
- **What it shows**:
  - Final score and result
  - Prediction consensus: "12 picked Team A, 8 picked Team B"
  - Who was right vs wrong
  - "The Oracle": The user with the best accuracy who predicted correctly
  - "The Contrarian": Users who correctly predicted the underdog

- **Visual breakdown**:
  - Prediction bar chart: Team A ████ 60% | Team B ██ 40%
  - List of predictors with their picks:
    - ✅ Alice predicted Team A
    - ✅ Bob predicted Team A
    - ❌ Charlie predicted Team B
  - Filter: "Show only correct predictions"

### 5. Prediction Statistics (Per User)
- **Page**: `/g/[slug]/players/[id]/predictions`
- **Shows**:
  - Overall accuracy: "72% (156/217)"
  - By team format: Singles: 65%, Doubles: 76%
  - By ELO gap predictions:
    - <50 ELO gap (close matches): 55% accuracy
    - 50-150 ELO gap: 75% accuracy
    - >150 ELO gap (mismatches): 95% accuracy
  - Prediction heatmap: Correctness by day of week/time of day
  - Best/worst predictions: "Correctly picked underdog (35% win prob)", "Missed easy call (90% win prob)"
  - Prediction trends: Accuracy over last 10 matches

## Technical Approach

### Database Schema

```sql
-- User predictions for matches
match_predictions
  - id (uuid, primary key)
  - match_id (uuid, FK → matches.id)
  - player_id (uuid, FK → players.id)
  - group_id (uuid, FK → groups.id)
  - predicted_team (enum: 'team1' | 'team2')
  - predicted_at (timestamp)
  - is_correct (boolean, null until match completed)
  - updated_at (timestamp)

-- Unique constraint: One prediction per player per match
UNIQUE (match_id, player_id)

-- Indexes
CREATE INDEX idx_match_predictions_match ON match_predictions(match_id);
CREATE INDEX idx_match_predictions_player ON match_predictions(player_id);
CREATE INDEX idx_match_predictions_group ON match_predictions(group_id);

-- Trigger: Update is_correct when match is completed
CREATE OR REPLACE FUNCTION update_prediction_correctness()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE match_predictions
  SET is_correct = (
    CASE
      WHEN NEW.winner_team = 'team1' AND predicted_team = 'team1' THEN true
      WHEN NEW.winner_team = 'team2' AND predicted_team = 'team2' THEN true
      ELSE false
    END
  )
  WHERE match_id = NEW.id AND is_correct IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predictions
  AFTER UPDATE OF winner_team ON matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_prediction_correctness();

-- Materialized view for leaderboard stats (refreshed periodically)
prediction_leaderboard_stats
  - player_id
  - group_id
  - total_predictions (integer)
  - correct_predictions (integer)
  - accuracy_pct (numeric)
  - current_streak (integer)
  - best_streak (integer)
  - last_prediction_at (timestamp)
  - updated_at

-- Prediction badges earned
player_prediction_badges
  - id (uuid, primary key)
  - player_id (uuid, FK → players.id)
  - group_id (uuid, FK → groups.id)
  - badge_type (enum)
  - earned_at (timestamp)
  - metadata (jsonb) -- e.g., {"streak_length": 12}
```

### Prediction Accuracy Calculation

```typescript
// Get player prediction stats
async function getPlayerPredictionStats(
  playerId: string,
  groupId: string,
  period?: 'all' | 'week' | 'month'
): Promise<PredictionStats> {
  const whereClause = period ? 
    `AND mp.created_at >= ${periodStart(period)}` : '';
  
  const result = await supabase
    .from('match_predictions')
    .select('*, matches!inner(winner_team)')
    .eq('player_id', playerId)
    .eq('group_id', groupId)
    .gte('created_at', periodStart(period));
  
  const total = result.data.length;
  const correct = result.data.filter(p => p.is_correct).length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  
  // Calculate streaks
  const sortedPredictions = result.data
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  let currentStreak = 0;
  for (const p of sortedPredictions) {
    if (p.is_correct) currentStreak++;
    else break;
  }
  
  return {
    totalPredictions: total,
    correctPredictions: correct,
    accuracy,
    currentStreak,
    bestStreak: await calculateBestStreak(playerId, groupId)
  };
}

// Refresh leaderboard materialized view
async function refreshPredictionLeaderboard(groupId: string) {
  await supabase.rpc('refresh_prediction_leaderboard', { p_group_id: groupId });
}
```

### Badge Awarding Logic

```typescript
// Check for badges after each completed match
async function checkAndAwardPredictionBadges(matchId: string) {
  const predictions = await supabase
    .from('match_predictions')
    .select('player_id, is_correct, predicted_team, matches!inner(*)')
    .eq('match_id', matchId);
  
  for (const prediction of predictions) {
    await checkFirstPickBadge(prediction.player_id);
    await checkStreakBadge(prediction.player_id, prediction.group_id);
    await checkAccuracyBadge(prediction.player_id, prediction.group_id);
    await checkUnderdogBadge(prediction, prediction.matches);
    await checkContrarianBadge(prediction, matchId);
  }
}

// Example: Sharpshooter badge (10+ correct in a row)
async function checkStreakBadge(playerId: string, groupId: string) {
  const stats = await getPlayerPredictionStats(playerId, groupId);
  
  if (stats.currentStreak >= 10) {
    await awardBadge(playerId, groupId, 'sharpshooter', {
      streak_length: stats.currentStreak
    });
  }
}

// Example: Underdog Whisperer badge
async function checkUnderdogBadge(
  prediction: MatchPrediction,
  match: Match
) {
  if (!prediction.is_correct) return;
  
  const predictedProb = match.predicted_win_prob || 0.5;
  
  // If they correctly predicted the underdog (<40% win prob)
  const wasUnderdogPrediction = 
    (prediction.predicted_team === 'team1' && predictedProb < 0.4) ||
    (prediction.predicted_team === 'team2' && predictedProb > 0.6);
  
  if (wasUnderdogPrediction) {
    const count = await countUnderdogCorrectPredictions(prediction.player_id);
    
    if (count === 5) {
      await awardBadge(prediction.player_id, prediction.group_id, 'underdog_whisperer');
    }
  }
}
```

### Leaderboard Query

```typescript
async function getPredictionLeaderboard(
  groupId: string,
  sortBy: 'accuracy' | 'correct',
  period?: 'all' | 'week' | 'month'
): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('prediction_leaderboard_stats')
    .select('*')
    .eq('group_id', groupId)
    .gte('updated_at', periodStart(period))
    .order(sortBy === 'accuracy' ? 'accuracy_pct' : 'correct_predictions', {
      ascending: false
    })
    .limit(50);
  
  // Enrich with player names and avatars
  const enriched = await Promise.all(
    data.map(async (entry) => {
      const player = await getPlayer(entry.player_id);
      return {
        ...entry,
        playerName: player.name,
        playerAvatar: player.avatar_url
      };
    })
  );
  
  return enriched;
}
```

## UI/UX Design

### Navigation
- Add "Predictions" tab to group navigation (next to Players, Matches, Pairs)
- Tab shows prediction leaderboard + recent prediction activity

### Match Card (Upcoming Matches)
```
┌─────────────────────────────────────────┐
│ Match #42 • Today 6:00 PM               │
│                                         │
│ Team A (ELO 1450) vs Team B (ELO 1380)  │
│                                         │
│ 🎯 12 members predicted                 │
│    8 predict Team A, 4 predict Team B   │
│                                         │
│ [Predict winner]                        │
└─────────────────────────────────────────┘
```

After user predicts:
```
┌─────────────────────────────────────────┐
│ Match #42 • Today 6:00 PM               │
│                                         │
│ Team A (ELO 1450) vs Team B (ELO 1380)  │
│                                         │
│ 🎯 You predicted: Team A                │
│    8/12 predict Team A (67%)            │
│                                         │
│ [Change prediction]                     │
└─────────────────────────────────────────┘
```

### Prediction Leaderboard
```
┌─────────────────────────────────────────┐
│ 🏆 Prediction Leaderboard               │
│                                         │
│ [All time ▼] [This month ▼]            │
│                                         │
│ 1.  Alice 🔥 85% (34/40)                │
│    🔥 12 correct in a row              │
│    Oracle • Sharpshooter                │
│                                         │
│ 2.  Bob 🎯 78% (28/36)                  │
│    🔥 5 correct in a row               │
│    Oracle                               │
│                                         │
│ 3.  Charlie 🎯 72% (18/25)              │
│    🔥 2 correct in a row               │
│    —                                    │
│                                         │
│ ...                                     │
└─────────────────────────────────────────┘
```

### Match Detail (After Completion)
```
┌─────────────────────────────────────────┐
│ Match #42 • Final: Team A 6-4 6-2      │
│                                         │
│ Prediction Results                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│ Team A: ████████████████ 8 (67%) ✓      │
│ Team B: ██████ 4 (33%) ✗                │
│                                         │
│ Correct predictions:                    │
│ ✅ Alice                                │
│ ✅ Bob                                  │
│ ✅ Dave                                 │
│ ...                                    │
│                                         │
│ ❌ Incorrect:                            │
│ ❌ Charlie                              │
│ ❌ Eve                                  │
│                                         │
│ 🏆 The Oracle: Alice (85% accuracy)     │
│    (Correctly picked the favorite)     │
└─────────────────────────────────────────┘
```

## Acceptance Criteria

### v1 - Core Prediction System
- [ ] Users can predict match outcomes before matches start
- [ ] Predictions close when match status changes to "in_progress"
- [ ] Players in the match cannot predict
- [ ] One prediction per user per match
- [ ] Predictions are visible to all group members after match starts
- [ ] Users can change their prediction until match starts
- [ ] `is_correct` field is automatically updated when match is completed

### v1 - Leaderboard & Stats
- [ ] Prediction leaderboard shows accuracy % and total correct
- [ ] Leaderboard can be filtered by period (all time/month/week)
- [ ] Player stats page shows prediction accuracy and streaks
- [ ] Current streak and best streak are tracked
- [ ] Materialized view refreshes periodically (every hour or on match completion)

### v1 - Match UI
- [ ] Upcoming match cards show prediction button
- [ ] After prediction, button shows user's pick
- [ ] Match cards show prediction consensus (e.g., "8/12 predict Team A")
- [ ] Match detail page shows full prediction breakdown after completion
- [ ] Confetti animation for correct predictions

### v2 - Badges (stretch goal)
- [ ] First Pick badge awarded on first prediction
- [ ] Sharpshooter badge for 10+ correct in a row
- [ ] Oracle badge for 75%+ accuracy across 50+ predictions
- [ ] Underdog Whisperer badge for 5+ correct underdog predictions
- [ ] Badges display on player profile and leaderboard

### Edge Cases
- [ ] Match cancelled: `is_correct` remains null, doesn't affect accuracy
- [ ] User leaves group: Their predictions remain in historical data but are excluded from current leaderboard
- [ ] New user joins: Accuracy starts at N/A until they make 5+ predictions
- [ ] Match deleted: Cascade delete predictions
- [ ] Materialized view refresh fails: Fallback to real-time query with performance warning

## Future Enhancements (Not v1)

- **Prediction leagues across groups**: Global leaderboard, inter-group competitions
- **Prediction betting with virtual currency**: Risk virtual points, earn more for correct picks
- **Prediction discussions**: Chat/comments on match predictions ("Why did you pick Team B?")
- **Prediction difficulty weighting**: Weight correct predictions more heavily when teams were evenly matched
- **AI prediction insights**: Compare user predictions vs ELO predictions, identify biases
- **Prediction tournaments**: Special events where users compete on a set of upcoming matches
- **Expert predictors**: Highlight users with high accuracy as "verified predictors"
- **Prediction exports**: Download prediction history as CSV
- **Streak challenges**: Monthly challenges: "Get a 5-correct streak this month"
- **Team-based prediction competition**: Divide group into teams, compete on collective prediction accuracy

## Design Notes

- **Predictions are social**: Make it easy to see who picked what and discuss picks
- **Encourage participation**: Even low-engagement users should find it easy to predict
- **Avoid prediction fatigue**: Don't overwhelm with too many prediction opportunities
- **Celebrate accuracy**: Make it feel rewarding to be right (confetti, badges, leaderboard)
- **Make upsets exciting**: Highlight when someone correctly predicted an unlikely outcome
- **Keep it fun**: This is a meta-game, not serious analytics
- **Respect match integrity**: Players in a match shouldn't predict (conflict of interest)
- **Handle ties**: For ties, predictions are marked as `is_correct = null` (neither right nor wrong)

## Data Considerations

**Prediction window**:
- Users can predict from match creation until match starts
- No predictions after `matches.status` changes to `in_progress`
- Cancelled/abandoned matches: predictions don't affect accuracy

**Minimum predictions for leaderboard**:
- Show users only after they make 5+ predictions (to avoid fluke 100% accuracy)
- Show "N/A" for users with <5 predictions

**Performance**:
- Materialized view for leaderboard (refresh hourly or on trigger)
- Indexes on `match_id`, `player_id`, `group_id`
- Consider batching prediction updates (e.g., every 5 minutes instead of real-time)

**Privacy**:
- Predictions are group-scoped (same RLS as other features)
- Users can opt-out of showing their predictions (prediction still counts but hidden from leaderboard)
