# Feature: Shot Pattern Analysis

## Summary
Track and analyze shot patterns to identify which shots lead to points won vs lost, helping players understand their winning strategies and areas for improvement.

## Why
Padelapp currently tracks match results, sets, games, and player rankings (ELO), but has no visibility into what happens within a point. Players know they won or lost, but they don't know WHY:

- Did I lose because my volleys are weak?
- Do I win more points with my backhand down the line?
- Am I too predictable - always serving to the same spot?
- Which shots should I focus on in training?

Shot Pattern Analysis fills this gap by tracking point-level data and revealing patterns in a player's game.

## Core Features

### 1. Point-Level Data Capture (Simple, Optional)

**Goal:** Collect shot data without overwhelming users.

**Implementation Strategy:**
- **Opt-in feature** - default disabled to keep the app simple
- **Quick entry during match** - simple 3-tap flow per point
- **Voice capture** - users can say "forehand volley winner" (future enhancement)
- **Post-match review** - users can fill in missing data later

**Point Entry Flow:**
For each point, record:
1. **Shot type** (tap one): Serve, Return, Forehand, Backhand, Volley, Smash, Lob, Bandeja
2. **Outcome** (tap one): Winner, Forced Error, Unforced Error, Rally continues
3. **Direction** (optional): Down the line, Cross court, Center, Wide

**Time commitment:** ~3-5 seconds per point. For a 2-hour match: ~8-10 minutes total.

**UX:**
- After entering the point score (e.g., "15-0"), prompt: "How was the point won?"
- Show 8 shot buttons with icons (serve, forehand, etc.)
- Tap shot, then tap outcome (winner/error)
- "Skip this point" option for quick completion
- "Edit mode" for post-match data correction

### 2. Shot Statistics Dashboard

**New Page:** `/stats/shots` or integrate into existing stats page

**What it shows:**
- **Win rate by shot type** (pie chart): 65% of forehand volleys won, 40% of backhands won
- **Shot distribution** (bar chart): Which shots you use most often
- **Error analysis** (table): Breakdown of forced vs unforced errors by shot type
- **Winner breakdown** (timeline): Where your winners came from during the match

**Example insights:**
- "You win 72% of points with your forehand volley - this is your strength!"
- "Your backhand down the line has a 35% win rate - consider mixing it up less often"
- "You made 8 unforced errors on lobs - try to be more selective"

### 3. Pattern Recognition

**Auto-identify common patterns:**

**Winning Patterns:**
- "Serve + Forehand Volley = 80% win rate (your bread & butter)"
- "Cross-court backhand rallies end in your favor 60% of the time"
- "When you smash, you win 90% of the time"

**Problem Patterns:**
- "Your return leads to unforced errors 40% of the time"
- "Wide backhands result in opponent winners 55% of the time"
- "You lose 70% of points after hitting a lob"

**Recommendations:**
- "Focus on attacking with forehand volleys"
- "Reduce lob frequency - your win rate drops 30% after lobs"
- "Practice cross-court backhand consistency"

### 4. Match-Level Shot Timeline

**Visual representation** of how shots unfold during a match:
- X-axis: Points in the match (0-100%)
- Y-axis: Shot types (color-coded bars)
- Highlight: Winners (green), Errors (red)
- Hover: Shot details (forehand volley, winner, cross-court)

**Use case:** See momentum shifts, identify which shots worked best at different match stages.

### 5. Comparative Analysis

**Compare your shot patterns:**
- **Vs your past performance** (last 5 matches vs previous 5)
- **Vs group average** (how your forehand win rate compares to others)
- **Vs specific opponents** (your patterns when playing against certain players)

**Example:**
"Your backhand volley win rate increased from 45% to 60% over the last month!"

### 6. Shot-Based ELO Adjustments (Future)

**Advanced idea:** Introduce shot-based ELO that tracks skill in specific shot types.

**How it works:**
- Each shot type has its own ELO rating (e.g., Forehand ELO: 1450, Backhand ELO: 1380)
- Winning points with a shot increases that shot's ELO
- Losing points decreases it
- Overall ELO remains the same (for compatibility)

**Benefits:**
- "Your forehand ELO (1500) is 120 points above your backhand - this is your strength"
- Track improvement in specific shots over time
- Find training priorities (work on your lowest-rated shot)

**Note:** This is a significant enhancement - consider for Phase 2 or separate feature.

## User Stories

### As a player, I want to:
- See which shots are my strengths and weaknesses
- Know if my training is improving specific shots
- Understand why I won or lost matches
- Get personalized recommendations for what to practice
- Compare my shot patterns with my teammates

### As a coach, I want to:
- See detailed shot breakdowns for my players
- Identify which areas need focused training
- Track player progress in specific shot types
- Provide data-backed feedback

### As a competitive player, I want to:
- Analyze my opponents' shot patterns before matches
- Know which shots to attack on their weak side
- Develop game plans based on statistical advantages

## Proposed UX

### Point Entry Screen (During Match)
- **Floating button** in corner: "Record Shot" (only visible if feature enabled)
- **Quick tap interface:**
  - Row 1: Shot types (8 buttons with icons)
  - Row 2: Outcomes (Winner, Forced Error, Unforced Error, Rally)
  - Row 3: Direction (optional)
- **"Skip" button** to skip point entry
- **Undo** button for last entry

### Shot Statistics Page
- **Hero section:** "Tu análisis de golpes" with summary cards
  - "Ganador: Forehand volleys (72%)"
  - "A mejorar: Backhand down the line (40%)"
- **Charts section:**
  - Win rate by shot (pie chart)
  - Shot distribution (bar chart)
  - Error breakdown (stacked bar)
- **Patterns section:** "Patrones detectados" with insights
- **Timeline section:** Interactive shot timeline visualization
- **Filters:** Match date range, opponent, court type

### Settings Page
- New section: "Registro de golpes"
- Toggle: "Activar registro de golpes durante partidos"
- Quick tutorial: "Cómo funciona" (1-minute explainer)
- "Reset all shot data" button

## Acceptance Criteria
- [ ] Shot entry screen is accessible from match detail page
- [ ] Shot entry takes <5 seconds per point
- [ ] "Skip point" option allows users to skip entry
- [ ] Shot statistics page displays win rate by shot type
- [ ] Shot statistics page displays shot distribution
- [ ] Shot statistics page displays error breakdown (forced vs unforced)
- [ ] Pattern recognition identifies at least 3 winning patterns
- [ ] Pattern recognition identifies at least 3 problem patterns
- [ ] Shot timeline visualization shows point-by-point shot data
- [ ] Comparative analysis shows personal improvement over time
- [ ] Settings page allows enabling/disabling shot recording
- [ ] All pages are responsive (mobile-friendly)
- [ ] Performance: shot stats load in <2 seconds for 50+ matches with shot data
- [ ] Must pass: `npm test`

## Technical Notes

### Database Schema Changes

**New table:** `points`
```sql
CREATE TABLE points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  game_number INTEGER NOT NULL,
  point_number INTEGER NOT NULL,
  player_id UUID NOT NULL REFERENCES auth.users(id), -- player who hit the shot
  shot_type TEXT NOT NULL CHECK (shot_type IN ('serve', 'return', 'forehand', 'backhand', 'volley', 'smash', 'lob', 'bandeja')),
  outcome TEXT NOT NULL CHECK (outcome IN ('winner', 'forced_error', 'unforced_error', 'rally')),
  direction TEXT CHECK (direction IN ('down_the_line', 'cross_court', 'center', 'wide')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, set_number, game_number, point_number)
);
```

**New table:** `shot_types` (enum-like)
```sql
CREATE TABLE shot_types (
  id TEXT PRIMARY KEY,
  label_es TEXT NOT NULL,
  label_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

INSERT INTO shot_types (id, label_es, label_en, icon, color) VALUES
('serve', 'Saque', 'Serve', '🎾', '#3B82F6'),
('return', 'Resto', 'Return', '↩️', '#8B5CF6'),
('forehand', 'Derecha', 'Forehand', '🔵', '#10B981'),
('backhand', 'Revés', 'Backhand', '🔴', '#EF4444'),
('volley', 'Volea', 'Volley', '⚡', '#F59E0B'),
('smash', 'Remate', 'Smash', '💥', '#EC4899'),
('lob', 'Lob', 'Lob', '🎈', '#6366F1'),
('bandeja', 'Bandeja', 'Bandeja', '🏓', '#14B8A6');
```

**New table:** `outcomes` (enum-like)
```sql
CREATE TABLE outcomes (
  id TEXT PRIMARY KEY,
  label_es TEXT NOT NULL,
  label_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

INSERT INTO outcomes (id, label_es, label_en, icon, color) VALUES
('winner', 'Ganador', 'Winner', '✅', '#10B981'),
('forced_error', 'Error forzado', 'Forced error', '⚠️', '#F59E0B'),
('unforced_error', 'Error no forzado', 'Unforced error', '❌', '#EF4444'),
('rally', 'Rally continues', 'Rally continues', '➡️', '#6B7280');
```

**New index:**
```sql
CREATE INDEX idx_points_match_id ON points(match_id);
CREATE INDEX idx_points_player_id ON points(player_id);
CREATE INDEX idx_points_shot_type ON points(shot_type);
CREATE INDEX idx_points_outcome ON points(outcome);
```

### API Endpoints

**Create point** - `POST /api/points`
```typescript
{
  match_id: UUID,
  set_number: number,
  game_number: number,
  point_number: number,
  player_id: UUID,
  shot_type: ShotType,
  outcome: Outcome,
  direction?: Direction
}
```

**Get points for match** - `GET /api/matches/[id]/points`
- Returns all points for a match

**Get shot statistics** - `GET /api/stats/shots`
```typescript
Query params: {
  player_id?: UUID,
  match_id?: UUID,
  start_date?: ISODate,
  end_date?: ISODate
}

Response: {
  win_rate_by_shot: { [shotType]: number },
  shot_distribution: { [shotType]: number },
  error_breakdown: {
    forced_errors: { [shotType]: number },
    unforced_errors: { [shotType]: number }
  },
  total_points: number,
  winners: number,
  errors: number
}
```

**Get patterns** - `GET /api/stats/shots/patterns`
```typescript
Query params: {
  player_id: UUID,
  match_id?: UUID,
  start_date?: ISODate,
  end_date?: ISODate
}

Response: {
  winning_patterns: Pattern[],
  problem_patterns: Pattern[]
}

interface Pattern {
  type: 'winning' | 'problem';
  description: string;
  confidence: number;
  recommendation: string;
}
```

**Get shot timeline** - `GET /api/matches/[id]/timeline`
- Returns point-by-point shot data for visualization

### Frontend Components

**New page:** `src/app/stats/shots/page.tsx` - Shot statistics dashboard

**New components:**
- `src/components/ShotEntryForm.tsx` - Quick shot entry interface
- `src/components/ShotStatsDashboard.tsx` - Main dashboard with charts
- `src/components/ShotWinRateChart.tsx` - Pie chart for win rates
- `src/components/ShotDistributionChart.tsx` - Bar chart for shot usage
- `src/components/ShotTimeline.tsx` - Interactive timeline visualization
- `src/components/PatternInsights.tsx` - Display detected patterns

**Modified components:**
- `src/app/matches/[id]/page.tsx` - Add "Record Shot" button and shot entry form
- `src/components/MatchCard.tsx` - Add shot data summary badge

### Pattern Recognition Logic

**File:** `src/lib/shot-patterns.ts`

```typescript
interface Pattern {
  type: 'winning' | 'problem';
  description: string;
  confidence: number; // 0-1
  recommendation: string;
}

function detectPatterns(points: Point[], player_id: UUID): Pattern[] {
  // Analyze points and identify patterns
  // Example: Forehand volley win rate > 70% -> winning pattern
  // Example: Backhand error rate > 50% -> problem pattern
}
```

### State Management

**Player settings:** Add to `profiles` table
```sql
ALTER TABLE profiles ADD COLUMN shot_recording_enabled BOOLEAN DEFAULT false;
```

## Data Requirements

**New tables:**
- `points` - stores point-level shot data
- `shot_types` - reference table for shot types
- `outcomes` - reference table for shot outcomes

**New columns:**
- `profiles.shot_recording_enabled` - opt-in flag for shot recording

**No changes to:** `matches`, `sets`, `players`, etc. (backward compatible)

## Test Impact

### Unit Tests
- Test shot pattern detection logic
- Test win rate calculation
- Test error classification (forced vs unforced)
- Test pattern confidence scoring

### E2E Tests
- Test shot entry flow (tap shot type, tap outcome)
- Test "Skip point" functionality
- Test shot statistics page loads and displays data
- Test filters work correctly (date range, opponent)
- Test shot timeline visualization

### Test Data
- Add sample matches with shot data for testing
- Create test scenarios for various patterns

## Estimated Size
large

## Migration Notes

**Backward compatibility:**
- Feature is opt-in - existing functionality unchanged
- Matches without shot data continue to work normally
- Shot statistics page shows empty state if no data available

**Data seeding:**
- Provide sample shot data for demo purposes
- Create onboarding tutorial for new users

## Notes

### Implementation Priority
**Phase 1 (MVP):**
- Point entry UI
- Shot statistics dashboard
- Basic win rate and distribution charts
- Simple pattern detection (hardcoded rules)

**Phase 2 (Future):**
- Advanced pattern detection (machine learning)
- Comparative analysis (vs self, vs others)
- Shot timeline visualization
- Voice capture for shot entry
- Shot-based ELO system (separate feature)

### User Adoption Tips
- Make the entry flow as fast as possible (3 taps max)
- Provide "Quick Demo" mode with sample data
- Show personalized insights on dashboard to motivate use
- Allow post-match data entry (not just during matches)
- Consider gamification: unlock achievements for tracking X points

### Privacy Considerations
- Shot data is sensitive - ensure proper RLS policies
- Allow users to delete all shot data
- Consider export functionality (CSV download)

### Performance Considerations
- Shot data grows quickly (~150-200 points per match)
- Index points table properly
- Consider data aggregation for long-term storage
- Cache shot statistics calculations

### Accessibility
- Large tap targets for shot entry (min 48x48px)
- High contrast colors for shot types
- Screen reader support for shot labels
- Keyboard navigation for shot entry

### Future Enhancements
- **Shot Heatmap:** Show where on the court shots land (if user provides coordinates)
- **Serve Placement Tracking:** Track where serves go (wide, body, T)
- **Opponent Shot Analysis:** See which shots opponents struggle against
- **Training Recommendations:** Suggest drills based on weak shot types
- **Video Integration:** Link shots to video timestamps (if video feature exists)
- **AI Shot Detection:** Auto-classify shots from video (advanced ML)
- **Live Mode Integration:** Sync shot entry with live match scoring
