# Feature: Racket Performance Tracker

**Status:** PROPOSED

## Why
Padel players are passionate about their equipment. Different rackets affect power, control, feel, and ultimately performance. Many players own multiple rackets and switch between them based on conditions, opponents, or experimentation.

Currently, Padelapp tracks matches and ELO but doesn't connect performance to equipment. Players have no data-driven way to know:
- Which racket gives them the best win rate
- How their ELO changes with different rackets
- Which racket works best for different match types (indoor/outdoor, day/night)
- When a racket needs replacement (performance declining over time)

**Why this matters:**
Rackets are expensive (€200-500+ for high-end models). Making an informed decision about which racket to buy or use can save money and improve results. Data-driven racket insights turn trial-and-error into measurable comparisons.

## User Stories

### As a player, I want to:
- Add my racket(s) to my profile (model, brand, weight, balance, purchase date)
- Select which racket I used for each match
- See my performance stats (win rate, ELO change, matches played) per racket
- Compare my rackets side-by-side to see which performs best
- See how my racket performance changes over time (age, string wear, etc.)

### As a player, I want to:
- Receive insights like "You win 15% more matches with your Bullpadel Vertex"
- Understand if my decline in ELO is due to racket wear or form
- Share my racket stats with friends for recommendations

### As a group, I want to:
- See which rackets are most popular in the group
- Share racket recommendations based on real performance data
- Compare how different rackets perform across multiple players

## Scope
Add racket tracking and performance analytics:
- Racket management (add/edit/remove rackets per player)
- Racket selection during match creation/editing
- Per-racket performance dashboard
- Racket comparison tool
- Insights and recommendations

### Proposed UX
- **Player Profile → Rackets Tab** (`/g/[slug]/players/[id]/rackets`):
  - List of all rackets with key stats:
    - Racket name and brand (e.g., "Bullpadel Vertex 03")
    - Matches played
    - Win rate (matches won / matches played)
    - ELO change (total ELO gained/lost with this racket)
    - Last used date
  - "Add Racket" button opens modal
  - Click racket to see detailed stats
- **Racket Detail Page** (`/g/[slug]/players/[id]/rackets/[racketId]`):
  - Performance charts:
    - Win rate over time (rolling 10-match window)
    - ELO trajectory with this racket
    - Win rate by match type (indoor vs outdoor, day vs night)
  - Recent matches played with this racket
  - Comparison with other rackets (side-by-side stats)
  - Insights (e.g., "Your win rate is 8% higher with this racket than average")
- **Match Creation/Edit** (`/g/[slug]/matches/new` and `/g/[slug]/matches/[id]/edit`):
  - Add "Racket" dropdown for each player (defaults to "No racket selected")
  - Filter by player to show only their rackets
  - Optional field (not required)
- **Racket Comparison Modal** (`/g/[slug]/players/[id]/rackets/compare`):
  - Select 2-4 rackets to compare
  - Side-by-side comparison table:
    - Matches played
    - Win rate
    - ELO change
    - Avg ELO during matches
    - Best performance (biggest ELO gain)
    - Worst performance (biggest ELO drop)
  - Visual comparison bar charts
- **Insights Card** on player profile:
  - "Best performing racket: Bullpadel Vertex 03 (72% win rate, +45 ELO)"
  - "Most used racket: Adidas Adipower (42 matches)"
  - "Racket aging warning: You've played 80+ matches with Wilson Blade, consider checking for wear"

### Data Model
- **Racket** (one-to-many with players):
  - `id` (UUID)
  - `player_id` (FK → players.id)
  - `brand` (text, e.g., "Bullpadel", "Adidas", "Wilson")
  - `model` (text, e.g., "Vertex 03", "Adipower", "Blade")
  - `weight` (integer, grams, optional)
  - `balance` (integer, mm from head, optional)
  - `purchase_date` (date, optional)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- **MatchRacket** (join table for match → player → racket):
  - `id` (UUID)
  - `match_id` (FK → matches.id)
  - `player_id` (FK → players.id)
  - `racket_id` (FK → rackets.id, nullable)
  - `created_at` (timestamptz)
  - `unique(match_id, player_id)` - one racket per player per match

## Acceptance Criteria
- [ ] Player can add racket (brand, model, optional specs)
- [ ] Racket is listed on player profile → Rackets tab
- [ ] Racket can be edited or deleted
- [ ] Match creation/edit allows selecting racket per player
- [ ] Racket selection is saved correctly in match
- [ ] Racket detail page shows performance stats:
  - [ ] Matches played
  - [ ] Win rate
  - [ ] Total ELO change
  - [ ] Performance over time charts
- [ ] Racket comparison modal allows comparing 2-4 rackets
- [ ] Comparison shows all key metrics side-by-side
- [ ] Insights are generated correctly (best performing, most used, aging)
- [ ] Empty state handled for players with no rackets
- [ ] Racket field is optional in match creation
- [ ] Performance stats are calculated correctly (matches must be included in ELO calculation)
- [ ] Charts render correctly on mobile
- [ ] Must pass: `npm test`

## Data Requirements
- New table: `rackets`
  ```sql
  create table rackets (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references players(id) on delete cascade,
    brand text not null,
    model text not null,
    weight integer, -- grams
    balance integer, -- mm from head (head-heavy if <, head-light if > mid-point)
    purchase_date date,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (weight is null or (weight >= 300 and weight <= 400)),
    check (balance is null or (balance >= 250 and balance <= 310))
  );

  create index idx_rackets_player_id on rackets(player_id);
  ```
- New table: `match_rackets`
  ```sql
  create table match_rackets (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references matches(id) on delete cascade,
    player_id uuid not null references players(id) on delete cascade,
    racket_id uuid references rackets(id) on delete set null,
    created_at timestamptz not null default now(),
    unique(match_id, player_id)
  );

  create index idx_match_rackets_match_id on match_rackets(match_id);
  create index idx_match_rackets_racket_id on match_rackets(racket_id);
  ```
- New queries:
  - `getPlayerRackets(playerId)` - returns all rackets for a player
  - `getRacketStats(racketId, groupId)` - calculates win rate, ELO change, matches played
  - `getRacketPerformanceOverTime(racketId, groupId)` - time series data for charts
  - `compareRackets(playerId, racketIds[])` - side-by-side comparison
  - `getPlayerInsights(playerId)` - best racket, most used, aging warnings

## Technical Notes
- Racket stats should only count matches that are included in ELO calculation (check `included_in_elo` flag on matches)
- ELO change calculation: For each match, calculate the ELO delta for the player and sum all deltas for that racket
- Win rate: (matches won as team with this racket) / (matches played with this racket)
- Performance over time: Use a rolling window (e.g., last 10 matches) to calculate rolling win rate
- Aging warning: If racket has been used for 80+ matches and win rate has declined by >10% from peak, suggest checking for wear
- Comparison modal should handle edge cases:
  - Racket with 0 matches (show "Not enough data")
  - Racket with 1 match (show win rate but note "Small sample size")
- Consider caching racket stats to avoid recalculating on every page load (update when match is added/edited)

## Test Impact
- Add unit tests for racket CRUD:
  - Create racket with valid data
  - Create racket with invalid weight/balance fails
  - Update racket details
  - Delete racket cascades to match_rackets (sets racket_id to null)
- Add unit tests for racket stats calculation:
  - Win rate calculation
  - ELO change calculation
  - Matches played count
  - Performance over time rolling window
- Add unit tests for insights:
  - Best performing racket identification
  - Most used racket identification
  - Aging warning triggered correctly
- Add E2E tests for:
  - Adding racket on player profile
  - Selecting racket during match creation
  - Viewing racket detail page and charts
  - Comparing rackets side-by-side
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Racket field is optional for backward compatibility (existing matches won't have racket data)
- Consider adding "racket of the month" leaderboard (most improved player with a specific racket)
- Future: Add photos of rackets for visual identification
- Future: Group-wide racket analytics (which rackets are most popular in the group, which brands perform best)
- Future: Integration with racket databases (e.g., pull specs from manufacturer APIs)
- Future: String tracking (type of strings, tension, and when restrung)
- Mobile: Ensure racket dropdown is easy to use on small screens
- Accessibility: Ensure racket names are screen-reader friendly
- Performance: Batch queries for racket stats to avoid N+1 queries
