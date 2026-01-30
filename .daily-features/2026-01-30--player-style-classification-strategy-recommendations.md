# Feature: Player Style Classification and Strategy Recommendations

**Status:** PROPOSED

## Why
Understanding each player's unique playing style adds a new layer of engagement and strategic depth to Padelapp. By analyzing match data, we can classify players into playstyles (e.g., aggressive attacker, defensive wall, all-rounder, net specialist) and provide personalized strategy recommendations before matches.

This feature:
1. **Adds personality** - Players get a "style badge" that reflects how they play
2. **Informs strategy** - Teams can see style compatibility and plan their approach
3. **Increases engagement** - Players track how their style evolves over time
4. **Improves competition** - Knowing opponent styles helps teams prepare better

Similar features exist in apps like Tennis-Point, FIFA Ultimate Team, and NBA 2K.

## Scope
Build a system that:
- Classifies players into playstyle categories based on match statistics
- Displays style badges on player profiles and match lineups
- Provides strategy recommendations before matches
- Shows style compatibility indicators for team pairings
- Tracks style evolution over time

### Playstyle Categories
1. **Aggressive Attacker (El Agressivo)**
   - High attack points, powerful shots, takes risks
   - Low error tolerance, can be inconsistent
   - Best paired with a steady defender

2. **Defensive Wall (El Muro)**
   - High return rate, consistent, patient
   - Few errors, rarely goes for winners
   - Best paired with an aggressive attacker

3. **Net Specialist (Red Especialista)**
   - Dominates at the net, volleys and smashes
   - Strong finishing ability, quick reflexes
   - Works well with a baseline grinder

4. **All-Rounder (Equilibrado)**
   - Balanced attack/defense, adaptable
   - Good at everything, great at nothing
   - Versatile partner for any playstyle

5. **Clutch Performer (Jugador de Momentos Clave)**
   - Excels in tight sets (scores 40-40, deuce, tiebreaks)
   - May struggle in routine points
   - Valuable in close matches

### Classification Algorithm
Calculate style scores (0-100) based on weighted metrics:

**Aggressive Score:**
- Attack points / total points × 40
- Winners / total points × 30
- Unforced errors / total points × -10
- Average set score margin × 20

**Defensive Score:**
- Return points won / total returns × 40
- Errors avoided / total points × 30
- Points won from opponent errors × 20
- Average points per set won × 10

**Net Score:**
- Volley points / total points × 50
- Smash points / total points × 30
- Points won at net × 20

**Clutch Score:**
- Points won at 40-40 × 30
- Tiebreaks won / tiebreaks played × 40
- Set win rate when tied × 30

**All-Rounder Score:**
- Average of all other scores, capped at 80
- Bonus for high match count (consistency)

Final classification: player gets the style with the highest score (minimum 20 matches required for classification; otherwise "Unknown").

### Proposed UX
- **Player Profile Page** (`/g/[slug]/players/[id]`):
  - Display style badge prominently (emoji + label)
  - Show style scores radar chart
  - Show "Style Evolution" timeline (how scores changed over time)
  - List best/worst partnerships by style compatibility

- **Match Lineup Display**:
  - Show style badges for each player
  - Visual indicator of style compatibility (e.g., "Great fit!", "Could struggle")
  - Hover tooltip: "Aggressive + Defensive = Balanced"

- **Strategy Recommendations Modal** (before match):
  - "Strategic Analysis" section on match card
  - Shows opponent team styles and weaknesses
  - Suggested tactics: "Attack [Player X] at the net", "Defend against [Player Y]'s smashes"
  - Style-based tips: "Your team is heavy on attack—play patient points"

- **Style Compatibility Score**:
  - Calculate compatibility for team pairings (0-100)
  - Complementary styles (Attacker + Defender) = higher score
  - Similar styles (two Attackers) = lower score (overlap)
  - Display as: "Compatibility: 85% (Great fit)"

### Sample Recommendations
- "Team A has a Net Specialist. Don't let them control the net—lob and force them back."
- "Team B plays aggressive. Stay patient, let them make errors."
- "Your team is Attack + Defense—classic combo. Play to your strengths: [Player X] goes for winners, [Player Y] keeps the ball alive."
- "Opponent's Clutch Performer shines in tight sets. Avoid close sets—build early leads."

## Acceptance Criteria
- [ ] Players are classified into styles after 20+ matches
- [ ] Style badges appear on player profiles
- [ ] Style scores radar chart displays correctly
- [ ] Style compatibility score calculates correctly
- [ ] Style badges appear on match lineups
- [ ] Compatibility indicator shows on team pairings
- [ ] Strategy recommendations modal appears before matches
- [ ] Recommendations are relevant to opponent styles
- [ ] Style evolution timeline tracks changes
- [ ] Best/worst partnerships listed by compatibility
- [ ] Mobile-responsive design
- [ ] All calculations are accurate and documented
- [ ] Must pass: `npm test`

## Data Requirements
- New table: `player_styles`
  ```sql
  create table player_styles (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references players(id) on delete cascade,
    style text not null check (style in ('aggressive', 'defensive', 'net', 'all_rounder', 'clutch', 'unknown')),
    aggressive_score int not null check (aggressive_score >= 0 and aggressive_score <= 100),
    defensive_score int not null check (defensive_score >= 0 and defensive_score <= 100),
    net_score int not null check (net_score >= 0 and net_score <= 100),
    clutch_score int not null check (clutch_score >= 0 and clutch_score <= 100),
    all_rounder_score int not null check (all_rounder_score >= 0 and all_rounder_score <= 100),
    matches_count int not null default 0,
    calculated_at timestamptz not null default now(),
    unique(player_id)
  );

  create index idx_player_styles_player_id on player_styles(player_id);
  ```

- New table: `style_history`
  ```sql
  create table style_history (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references players(id) on delete cascade,
    style text not null,
    aggressive_score int not null,
    defensive_score int not null,
    net_score int not null,
    clutch_score int not null,
    all_rounder_score int not null,
    matches_count int not null,
    calculated_at timestamptz not null default now()
  );

  create index idx_style_history_player_id on style_history(player_id, calculated_at desc);
  ```

- New table: `style_compatibility` (pre-calculated for performance)
  ```sql
  create table style_compatibility (
    player_a_id uuid not null references players(id) on delete cascade,
    player_b_id uuid not null references players(id) on delete cascade,
    compatibility_score int not null check (compatibility_score >= 0 and compatibility_score <= 100),
    calculated_at timestamptz not null default now(),
    primary key (player_a_id, player_b_id),
    check (player_a_id < player_b_id) -- avoid duplicates
  );
  ```

- New queries:
  - `calculatePlayerStyles(playerId)` - recalculate style scores and history
  - `getPlayerStyle(playerId)` - get current style classification
  - `getStyleCompatibility(playerAId, playerBId)` - get partnership compatibility
  - `getStyleHistory(playerId, limit?)` - get style evolution timeline
  - `getBestPartnerships(playerId)` - get highest compatibility pairings
  - `generateStrategyRecommendations(matchId)` - generate pre-match analysis

## Technical Notes
- **Batch calculation**: Run style recalculation in a cron job every night for all players with new matches
- **Minimum threshold**: Require 20 matches before classification to avoid noise
- **Style evolution**: Track history to show trends over time (e.g., "becoming more aggressive")
- **Compatibility algorithm**: Complementary styles (Attacker + Defender) = 100%; similar styles = 60-80%; extreme mismatches = 40-60%
- **Strategy recommendations**: Rule-based system using style mappings (e.g., "Attacker vs Net Specialist → Lobs to force back")
- **Performance**: Pre-calculate compatibility scores; recalculate when either player's style changes
- **Radar chart**: Use Chart.js or Recharts for visualization

## Test Impact
- Add unit tests for style calculation:
  - Aggressive attacker classification correct
  - Defensive wall classification correct
  - All-rounder classification correct
  - Minimum 20 matches threshold enforced
- Add unit tests for compatibility:
  - Complementary styles score high
  - Similar styles score medium
  - Scores within valid range (0-100)
- Add unit tests for strategy recommendations:
  - Generates relevant recommendations
  - Handles unknown styles gracefully
- Add E2E test for:
  - Viewing style badge on player profile
  - Viewing style scores radar chart
  - Seeing compatibility indicators on lineup
  - Opening strategy recommendations modal
- Must pass: `npm test`

## Estimated Size
large

## Plan
### Phase 1: Data Model & Calculation Engine (Week 1)
- [ ] Create `player_styles`, `style_history`, and `style_compatibility` tables
- [ ] Implement style calculation algorithm (test with synthetic data)
- [ ] Write unit tests for all style score calculations
- [ ] Add cron job for daily style recalculation

### Phase 2: Player Profile Display (Week 1-2)
- [ ] Add style badge to player profile
- [ ] Implement radar chart for style scores
- [ ] Build style evolution timeline component
- [ ] List best/worst partnerships by compatibility
- [ ] Add E2E tests for profile display

### Phase 3: Match Integration (Week 2)
- [ ] Add style badges to match lineup display
- [ ] Implement style compatibility indicator
- [ ] Add compatibility tooltips and explanations
- [ ] Write E2E tests for lineup display

### Phase 4: Strategy Recommendations (Week 2-3)
- [ ] Build rule-based recommendation engine
- [ ] Create strategy recommendations modal
- [ ] Add recommendations to match card
- [ ] Implement style-based tips logic
- [ ] Add E2E tests for recommendations

### Phase 5: Polish & Optimization (Week 3)
- [ ] Mobile responsiveness review
- [ ] Performance optimization (caching, pre-calculation)
- [ ] Accessibility audit (ARIA labels, screen readers)
- [ ] Edge case handling (players with <20 matches)
- [ ] Documentation updates

## Notes
- Consider allowing manual style overrides for players who disagree with their classification
- Style badges could be animated (e.g., pulsing emoji)
- Future: Add "Style Challenge" - encourage players to try different styles
- Future: Integrate with team balancing algorithm (consider style diversity)
- For small groups with limited match data, relax the 20-match threshold
- Style evolution timeline could use moving averages to smooth trends
- Consider adding "Style Clash" indicator for teams with incompatible styles
- The classification algorithm should be tunable via config (weights, thresholds)

---
Created: 2026-01-30
