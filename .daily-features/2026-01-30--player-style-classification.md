# Player Style Classification & Strategy Recommendations

## Summary
An intelligent system that automatically classifies players into playing styles (aggressive, defensive, all-court, etc.) based on match statistics, and provides actionable strategy recommendations for different style matchups. This transforms raw statistics into tactical insights, helping players prepare smarter and win more matches.

## Background

Padel players have distinct playing styles that significantly impact match outcomes:
- **Aggressive players** - Control the net, hit winners, take risks
- **Defensive players** - Use lobs, wait for errors, wear down opponents
- **All-court players** - Adapt to situations, mix styles
- **Power players** - Rely on smashes and pace
- **Tactical players** - Use placement, angles, and strategy

Current Padelapp tracks wins, losses, and ELO but doesn't provide:
1. **Style classification** - Players don't know what style they are
2. **Matchup insights** - No guidance on how to play against specific player types
3. **Tactical preparation** - No scouting-like analysis before matches
4. **Evolution tracking** - No visibility into style changes over time

This feature would make Padelapp more than just a tracker—it becomes a tactical assistant.

## User Stories

### As a player, I want to:
- See my playing style classification based on my match stats
- Understand the strengths and weaknesses of my style
- Get strategy recommendations when facing different player types
- See how my style has evolved over time
- Prepare for matches by knowing opponent styles and recommended tactics

### As a group admin, I want to:
- See style distribution across the group (e.g., "60% aggressive, 20% defensive")
- Identify players who might benefit from coaching based on style profiles
- View style compatibility metrics (which styles play well together as partners)

## Core Features

### 1. Automatic Style Classification
- **Algorithm**: Analyze match statistics to assign player styles
- **Style types**:
  - **Aggressive Net Player** - High winners, short points, controls net
  - **Defensive Lobber** - High lobs, long rallies, low winners
  - **Power Player** - High smash winners, pace-based game
  - **Tactical Strategist** - High placement, controlled errors, consistent
  - **All-Court Adapter** - Balanced across all metrics

- **Classification metrics**:
  - Average points per rally (aggressive = short, defensive = long)
  - Winner-to-unforced error ratio
  - Net control frequency (if data available)
  - Smash/overhead success rate
  - Lob usage percentage
  - Serve and return statistics

### 2. Player Style Profile Card
- **UI**: Player profile page + dedicated style analysis view
- **Display**:
  - Primary style with confidence percentage (e.g., "Aggressive Net Player - 85%")
  - Style radar chart showing balance across dimensions
  - Key stats that define the style
  - Style badge/icon for quick identification
  - Historical style evolution (timeline of style changes)

### 3. Style Matchup Engine
- **Pre-match strategy recommendations**:
  - Input: Player A (you) vs Player B (opponent)
  - Output: "You're (Aggressive) vs (Defensive Lobber) - Target their weaknesses!"
  - Specific tactics: "Move them side-to-side", "Attack their weaker backhand", "Don't get drawn into long rallies"

- **Partner compatibility**:
  - Show style synergies: "You + Partner: Aggressive + Defensive = Balanced duo!"
  - Highlight complementary strengths

### 4. Scouting Dashboard
- **Before matches**: Quick overview of opponent's style and stats
- **Display**:
  - Opponent style with key weaknesses
  - Recommended tactics (3-5 actionable tips)
  - Historical head-to-head performance against this style
  - Confidence level in classification (more matches = higher confidence)

### 5. Style Evolution Tracking
- **Timeline view**: How style has changed over time
- **Correlation with results**: "When you became more aggressive, win rate increased 12%"
- **Insights**: "You're playing 20% more defensively in the last month"

## Technical Approach

### Database Schema
```sql
-- Style definitions (configurable)
player_styles
  - id
  - name (aggressive, defensive, power, tactical, all_court)
  - display_name
  - icon_emoji
  - color_hex
  - description

-- Style metrics thresholds
style_metric_thresholds
  - id
  - style_id (FK)
  - metric_name (avg_rally_length, winner_error_ratio, net_control, etc.)
  - min_value
  - max_value
  - weight (0.0-1.0, importance of this metric for the style)

-- Player style classifications (recomputed periodically)
player_styles_history
  - id
  - player_id (FK)
  - group_id (FK)
  - style_id (FK)
  - confidence_score (0.0-1.0)
  - calculated_at
  - matches_count (how many matches used for classification)

-- Player metrics cache (for performance)
player_style_metrics
  - id
  - player_id (FK)
  - group_id (FK)
  - avg_rally_length
  - winner_error_ratio
  - smash_success_rate
  - lob_usage_pct
  - net_control_pct
  - updated_at
```

### Classification Algorithm

1. **Collect metrics** (after each match):
   - Average rally length: total points / total games played
   - Winner/error ratio: (winners - unforced errors) / total points
   - Smash success: smashes won / total smashes attempted
   - Lob usage: lobs played / total points

2. **Score each style**:
   ```python
   for style in styles:
     score = 0
     for metric in style.metrics:
       if metric.min <= player_metric <= metric.max:
         score += metric.weight
     style_scores[style] = score
   ```

3. **Assign primary style**:
   - Highest scoring style = primary classification
   - Confidence = (score_difference) / (max_possible_score)

4. **Update classification**:
   - Recompute after every 5 matches per player
   - Store history for trend analysis

### Strategy Recommendation Engine

**Rule-based recommendations**:
```
IF my_style == "Aggressive" AND opponent_style == "Defensive":
  recommendations = [
    "Don't get drawn into long rallies - finish points early",
    "Target their backhand side when at the net",
    "Use drop shots to bring them forward",
    "Avoid predictable patterns - mix pace and placement"
  ]

IF my_style == "Defensive" AND opponent_style == "Aggressive":
  recommendations = [
    "Use deep lobs to push them back",
    "Wait for their unforced errors",
    "Make them hit extra shots",
    "Stay patient and focus on consistency"
  ]

... (10+ matchup combinations)
```

### UI Pages

#### Style Analysis Page (`/g/[slug]/players/[id]/style`)
- Hero: Style badge + confidence + "Your style: Aggressive Net Player"
- Style radar chart (spider chart) with dimensions:
  - Power: 85%
  - Control: 40%
  - Defense: 20%
  - Net Play: 90%
  - Consistency: 55%
- Key stats breakdown
- Style evolution timeline (last 6 months)

#### Scouting Dashboard (`/g/[slug]/scouting`)
- Dropdown: Select opponent
- Display: Opponent style + recommended tactics
- Action: "View full profile" → redirect to player style page

#### Pre-Match Quick View
- When viewing match card: Show player style badges
- Tap on badge: Open quick style summary + tactics

## Acceptance Criteria

### v1 - Core Classification System
- [ ] Players are automatically classified into styles based on match stats
- [ ] Classification accuracy improves with more matches (confidence score)
- [ ] Style history is tracked (show evolution over time)
- [ ] Player profile shows primary style badge + confidence
- [ ] Style radar chart displays for each player
- [ ] Recommendations engine provides tactics for style matchups
- [ ] Pre-match view shows opponent styles and quick tips

### UI Requirements
- [ ] Style badges with distinct icons/colors
- [ ] Interactive radar chart (hover to see metric details)
- [ ] Mobile-responsive scouting dashboard
- [ ] Clean, readable strategy recommendations

### Edge Cases
- [ ] New player with < 5 matches: Show "Learning your style..." placeholder
- [ ] Player doesn't fit any style: Classify as "All-Court Adapter"
- [ ] Outlier stats: Cap metrics at reasonable bounds
- [ ] Style changes dramatically: Store history, don't override

## Future Enhancements (Not v1)
- AI-powered style prediction using machine learning
- Video integration: Analyze actual gameplay to refine classification
- Style-based matchmaking: Suggest compatible practice partners
- Training drills tailored to each player's style
- Coach notes: Allow coaches to manually adjust classifications
- Style leagues: Compete against players with similar styles
- Import pro player styles for comparison

## Design Notes
- Classification is probabilistic, not absolute - use confidence scores
- Styles can overlap - many players are hybrids
- Focus on actionable insights, not just labels
- Strategy recommendations should be simple and tactical, not overwhelming
- Visuals (radar charts, badges) make it engaging
- Players should understand WHY they're classified as a certain style
- Style can change over time - embrace evolution
- Keep recommendations based on padel-specific tactics (walls, lobs, net play)

## Data Considerations

**Minimum data requirements**:
- 5+ matches per player for confident classification
- 10+ matches for accurate style evolution tracking

**Metrics limitations**:
- Current Padelapp tracks match results, not detailed shot-by-shot data
- V1 uses aggregate statistics (wins, losses, ELO, match lengths)
- Future: Could add detailed stats collection (shot types, rally length, etc.)

**Privacy**:
- Style classification is group-scoped (same RLS as other features)
- Players can opt-out of style sharing if desired
