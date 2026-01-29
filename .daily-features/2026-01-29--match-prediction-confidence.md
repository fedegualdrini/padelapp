# Feature: Match Prediction Confidence

**Status:** PROPOSED

## Why
The app already calculates ELO-based match predictions, but currently only shows a basic "Team A favored" message without context. Players want to understand:

- **How confident is this prediction?** (60% win probability vs 95% is very different)
- **What factors drive the prediction?** (ELO gap? Recent form? Head-to-head?)
- **How accurate have predictions been?** (Trust the system, or is it often wrong?)
- **Why did my team lose when we were favored?** (Understand upset dynamics)

A confidence-based prediction system adds transparency, helps players make informed decisions about team composition, and provides educational value about how ELO and other factors influence match outcomes.

## Scope
Add prediction confidence scoring and detailed prediction insights:
- Display win probability percentages for both teams
- Show key factors influencing the prediction (ELO gap, recent form, head-to-head)
- Track prediction accuracy over time and display system reliability
- Provide prediction explanations in natural language
- Highlight "upset potential" for close matches

### Proposed UX
- **Match Creation/Editing**: When teams are loaded, show prediction confidence panel:
  - Win probability bars: "Team A: 62% | Team B: 38%"
  - Confidence level: High/Medium/Low based on prediction certainty
  - Key factors list:
    - ELO advantage: Team A +150 points
    - Recent form: Team A 4-1 in last 5 matches
    - Head-to-head: Team A leads 3-1 in 2026
- **Match Card on Dashboard**: Show prediction outcome vs actual result:
  - "Predicted: Team A (62%) → Actual: Team A ✓" or "Team A upset (38% underdog wins)"
  - Color-code: Green for correct prediction, orange for upset
- **Prediction Accuracy Dashboard**: New page accessible from matches list:
  - Overall prediction accuracy rate (e.g., "73% correct in last 30 matches")
  - Accuracy by ELO gap (high-confidence vs low-confidence predictions)
  - Biggest upsets with win probability shown
  - Trend line showing prediction accuracy over time
- **Detailed Match View**: Click on any match to see full prediction breakdown:
  - Full factor analysis with weightings
  - Historical accuracy for similar ELO gaps
  - Probability distribution chart (visual showing win %)

### Prediction Algorithm
Calculate win probability using logistic regression:
```
teamA_win_prob = 1 / (1 + 10^((teamB_rating - teamA_rating) / 400))
```
Then adjust based on:
- **Recent form factor**: Last 5 matches win rate (±5% adjustment)
- **Head-to-head factor**: Historical record vs opponent (±10% adjustment)
- **Streak factor**: Current win/loss streak (±5% adjustment)
- **Partner synergy**: Historical success rate with current partner (±5% adjustment)

Confidence levels:
- **High**: Win probability 70-85% (predictions typically correct)
- **Medium**: Win probability 55-70% or 15-30% (coin flip territory)
- **Low**: Win probability <15% or >85% (rare, likely mismatched)

## Acceptance Criteria
- [ ] Match creation/editing shows win probability percentages
- [ ] Prediction panel displays key influencing factors
- [ ] Match cards show prediction result vs actual outcome
- [ ] Prediction accuracy dashboard displays overall system accuracy
- [ ] Accuracy tracked by ELO gap confidence bands
- [ ] Historical biggest upsets shown with win probabilities
- [ ] Detailed match view shows full prediction breakdown
- [ ] Confidence levels (High/Medium/Low) displayed visually
- [ ] Upset matches highlighted with original win probability
- [ ] Empty state handled for groups with insufficient match history
- [ ] Mobile-responsive layout for prediction cards
- [ ] Predictions recalculate when teams are edited
- [ ] Must pass: `npm test`

## Data Requirements
- New query: `getPredictionAccuracy(groupId)` returns:
  - `overallAccuracy`: % of correct predictions (team with higher win probability won)
  - `accuracyByEloGap`: array of `{eloRange: "0-50", accuracy: 65%, matches: 20}`
  - `biggestUpsets`: array of `{matchId, underdogTeam, winProb, date}`
  - `trendOverTime`: array of `{date, accuracy}`
- New query: `getPredictionFactors(matchId)` returns:
  - `teamAWinProb`: calculated win probability
  - `factors`: array of `{name: "ELO advantage", value: "+150", weight: "+8%", impact: "positive"}`
  - `confidenceLevel`: "high" | "medium" | "low"
- Track prediction at match creation:
  - Add `predicted_win_prob` column to matches table (team1 win probability at creation time)
  - Add `prediction_factors` column (jsonb) to store factor breakdown
  - After match is played, calculate if prediction was correct and store in `prediction_correct` column

### Database Changes
```sql
alter table matches add column if not exists predicted_win_prob numeric;
alter table matches add column if not exists prediction_factors jsonb;
alter table matches add column if not exists prediction_correct boolean;
```

### Prediction Logic (Server-Side)
```typescript
function calculateWinProbability(team1Rating: number, team2Rating: number): number {
  const expectedScore = 1 / (1 + Math.pow(10, (team2Rating - team1Rating) / 400));
  return expectedScore;
}

function getPredictionFactors(match: Match, groupId: string): PredictionFactors {
  // 1. ELO advantage (primary factor)
  const team1AvgElo = avg(team1.players.map(p => p.elo));
  const team2AvgElo = avg(team2.players.map(p => p.elo));
  const eloAdvantage = team1AvgElo - team2AvgElo;

  // 2. Recent form (last 5 matches)
  const team1Form = getRecentForm(team1.players, 5);
  const team2Form = getRecentForm(team2.players, 5);

  // 3. Head-to-head record
  const h2h = getHeadToHead(team1.players, team2.players);

  // 4. Partner synergy (historical partnership success)
  const team1Synergy = getPartnershipStats(team1.players);
  const team2Synergy = getPartnershipStats(team2.players);

  // 5. Current streak
  const team1Streak = getCurrentStreak(team1.players);
  const team2Streak = getCurrentStreak(team2.players);

  // Adjust base ELO probability based on factors
  let adjustedProb = calculateWinProbability(team1AvgElo, team2AvgElo);

  // Apply adjustments (simplified)
  adjustedProb += (team1Form - 0.5) * 0.05;  // ±5% for form
  adjustedProb += (h2h - 0.5) * 0.10;       // ±10% for head-to-head
  // ... more adjustments

  // Clamp to reasonable range [0.05, 0.95]
  adjustedProb = Math.max(0.05, Math.min(0.95, adjustedProb));

  return {
    teamAWinProb: adjustedProb,
    factors: [
      { name: "ELO advantage", value: `${eloAdvantage > 0 ? '+' : ''}${eloAdvantage}`, weight: `${(eloAdvantage / 50).toFixed(0)}%`, impact: eloAdvantage > 0 ? "team1" : "team2" },
      // ... more factors
    ],
    confidenceLevel: getConfidenceLevel(adjustedProb)
  };
}
```

## Test Impact
- Add unit tests for prediction calculation:
  - Base ELO probability formula accuracy
  - Form factor adjustment
  - Head-to-head adjustment
  - Multiple factors combined
  - Edge cases (identical ratings, extreme mismatches)
- Add unit tests for prediction accuracy tracking:
  - Correct/incorrect prediction detection
  - Accuracy calculation by ELO band
  - Biggest upset detection
- Add E2E test for prediction display on match creation
- Add E2E test for prediction accuracy dashboard accuracy
- Add E2E test for upset match highlighting
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Predictions are calculated at match creation time and stored for historical accuracy tracking
- Prediction factors are stored as JSON for debugging and analysis
- Confidence levels help users understand prediction certainty without needing to interpret raw percentages
- For new groups with limited data, predictions rely primarily on ELO (most reliable factor)
- Consider adding "prediction confidence calibration" in future: if predictions are consistently overconfident, adjust the model
- For very close matches (45-55% range), display as "Too close to call" to avoid misleading certainty
- Prediction accuracy dashboard helps build user trust in the system over time
- Upset matches are valuable learning moments: display prominently to show system isn't infallible
- Consider adding user feedback: "Was this prediction helpful?" to gather improvement data (future iteration)
- Prediction algorithm should be configurable via environment variables for tuning
