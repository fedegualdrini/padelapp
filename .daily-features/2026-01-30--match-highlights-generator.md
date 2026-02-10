# Feature: Match Highlights Generator

## ⚠️ KEY CLARIFICATION (READ THIS FIRST!)
**THIS IS NOT A VIDEO UPLOAD SYSTEM.**
- ❌ No filming required
- ❌ No video uploads
- ❌ No user action needed to create highlights
- ✅ **All highlights are automatically generated from match score data**

The system analyzes match results (sets, games, tiebreaks) to identify exciting moments and presents them as:
- Badges and visual indicators
- Story snippets explaining what made the match exciting
- Shareable image cards (static graphics) for social media

**Example:** If a team loses 3-6 in the first set, then wins 6-4, 6-4, the system automatically detects this as a "Comeback" and displays a 🔄 badge with the story.

## Why
Matches are memorable not just for the final score, but for the drama along the way. A comeback from 2-0 down, a 7-6 tiebreak, or winning by a single game are the moments players talk about long after the match ends.

## 🔥 HOW IT WORKS (NO VIDEO REQUIRED!)

**This is critical: There is NO video upload or user filming required.**

The system automatically analyzes existing match data (sets, games, tiebreaks) to identify exciting moments. Everything is computed from the score data that's already being tracked.

**What you get:**
- 📊 **Badges & indicators** on match cards (🔄 Remontada, 🏆 Tiebreak, etc.)
- 📖 **Story snippets** that explain what made the match exciting (e.g., "Lost first set 3-6, then won 6-4, 6-4")
- 🖼️ **Shareable image cards** - static graphics you can share on Instagram/WhatsApp with the match highlights

**What you DON'T need to do:**
- ❌ No filming matches
- ❌ No uploading videos
- ❌ No extra data entry
- ❌ No user action required

The system does all the work automatically based on the match scores already in the database.

Padelapp records every match, but there's no easy way to identify or showcase these exciting moments. Players have to scroll through match history manually to find their "best" matches.

A Match Highlights Generator would automatically identify and showcase:
- **Comebacks**: Teams that trailed then won
- **Close sets**: Sets decided by 1-2 games
- **Dramatic finishes**: Matches won in final set by close margin
- **Tiebreaks**: Sets ending in tiebreaks
- **Perfection**: 6-0, 6-0 (bagels)

This helps players:
- Relive exciting matches
- Find their most dramatic performances
- Share highlights on social media
- Discover stories they forgot about

## Future Enhancement (Phase 2)
Video highlights could be added later where users upload match clips and attach them to highlight moments (requires file upload, video processing, storage). This is explicitly **out of scope for MVP**.

## Scope
Create a system that automatically generates match highlights and makes them discoverable:

### Highlight Detection
Automatically identify matches with notable moments:

**Comeback Badge** 🔄
- Team lost first set, then won the match
- Or team lost first 2 sets, then won 3rd set
- Or team was down by 4+ games in a set, then won that set

**Close Set Badge** 🎯
- Any set decided by 1-2 games (e.g., 6-4, 7-5)
- Not including tiebreaks (those get separate badge)

**Dramatic Finish Badge** ⚡
- Final set won by 1-2 games (e.g., 7-6, 6-4)
- Or match-winning tiebreak in final set

**Tiebreak Badge** 🏆
- Any set ending in tiebreak (7-6, 7-5 tiebreak formats)

**Perfect Set Badge** 💎
- Any set won 6-0 (bagel)

### Match Detail View
Add "Highlights" section to existing match detail page:
- List all highlights for this match
- Each highlight shows: badge, description, context (set/game details)
- Example: "🔄 Comeback! Team A lost first set 3-6, then won 6-4, 6-4"

### Highlights Feed (New Page)
Dedicated page showing all matches with highlights, grouped by type:
- **Comebacks**: All comeback matches with brief story
- **Close Sets**: Matches with narrow set victories
- **Dramatic Finishes**: Matches with edge-of-seat conclusions
- **Tiebreaks**: All tiebreak matches
- **Perfect Games**: Matches with bagel sets

Each entry shows:
- Match thumbnail (date, teams, score)
- Highlights summary with badges
- "Ver más" link to full match details
- Share button (generates shareable card)

### Social Media Card
Generate shareable image/card for highlighted matches:
- Match score summary
- Highlight badges with descriptions
- Short exciting caption
- Padelapp branding
- Ideal for sharing on Instagram, WhatsApp, etc.

### Event Cards (Quick View)
Add highlight badges to match list cards (e.g., in event matches, match history):
- Show 1-2 small badge icons on card if match has highlights
- Hover shows quick summary (e.g., "Comeback + Tiebreak")

### Proposed UX
**Match Detail Page - Highlights Section**
- Located below score summary, above detailed stats
- Heading: "Momentos destacados" with icon
- Cards for each highlight with emoji badge + description
- Color-coded badges: comebacks (purple), close sets (orange), dramatic finishes (red)

**Highlights Feed Page** `/highlights`
- Hero section: "🎬 Destacados de partidos" with search/filter
- Filter tabs: All | Comebacks | Close Sets | Dramatic Finishes | Tiebreaks | Perfect Sets
- Grid layout for match cards
- Each card shows: thumbnail image (gradient with date), teams, score summary, badges
- Click card → match detail page
- Share button → opens shareable card modal

**Shareable Card Modal**
- Preview of card image
- "Copiar enlace" button
- "Descargar imagen" button
- "Compartir en WhatsApp" button (if supported)

### Visual Design
- **Highlight Badges**: Circular icons with emoji + label
  - 🔄 Remontada (Comeback) - Purple background
  - 🎯 Set cerrado (Close set) - Orange background
  - ⚡ Final dramático (Dramatic finish) - Red background
  - 🏆 Tiebreak - Gold background
  - 💎 Set perfecto (Perfect set) - Blue background
- **Match Thumbnails**: Gradient backgrounds with team initials or match date
- **Highlights Feed**: Masonry-style grid for match cards
- **Shareable Cards**: Professional design with Padelapp logo, match score, highlights, QR code to match

## Acceptance Criteria
- [ ] Match detail page shows "Highlights" section with all detected highlights
- [ ] Highlights are correctly detected: comebacks, close sets, dramatic finishes, tiebreaks, perfect sets
- [ ] Highlights feed page displays all matches with highlights, filterable by type
- [ ] Match cards in lists show highlight badges (1-2 badges max)
- [ ] Shareable card can be generated for highlighted matches
- [ ] Shareable card displays correctly: score, highlights, branding
- [ ] All pages are responsive (mobile-friendly)
- [ ] Performance: highlights feed loads in <2 seconds for 100+ matches
- [ ] Must pass: `npm test`

## Technical Notes
- **Highlight detection logic**: Create utility function in `src/lib/highlights.ts`
  - `detectComebacks(sets)`: Returns true if team lost first set then won match
  - `detectCloseSets(sets)`: Returns sets decided by 1-2 games
  - `detectDramaticFinish(sets)`: Returns true if final set won by 1-2 games
  - `detectTiebreaks(sets)`: Returns sets ending in tiebreak
  - `detectPerfectSets(sets)`: Returns sets won 6-0
  - `getMatchHighlights(match)`: Returns array of highlight objects
- **API endpoint**: `GET /api/matches/[id]/highlights`
  - Returns highlights for a specific match
- **API endpoint**: `GET /api/highlights`
  - Query params: `type` (comeback|close_set|dramatic_finish|tiebreak|perfect_set), `limit`, `offset`
  - Returns matches with specified highlight type
- **New page**: `src/app/highlights/page.tsx` - Highlights feed
- **New component**: `src/components/MatchHighlights.tsx` - Highlights section on match detail
- **New component**: `src/components/HighlightBadge.tsx` - Reusable badge component
- **New component**: `src/components/MatchCardHighlights.tsx` - Match card with highlight badges
- **Shareable card generation**: Use canvas-to-image library (e.g., `html2canvas`) to generate card images on client side
- **Caching**: Cache highlights calculation for 5 minutes to improve performance
- **Database**: No schema changes - all highlights derived from existing match/set data

## Data Requirements
- **No new tables** - highlights are computed from existing `sets` and `set_scores` data
- **Highlight types enum**:
  ```typescript
  enum HighlightType {
    COMEBACK = 'comeback',
    CLOSE_SET = 'close_set',
    DRAMATIC_FINISH = 'dramatic_finish',
    TIEBREAK = 'tiebreak',
    PERFECT_SET = 'perfect_set'
  }
  ```
- **Highlight metadata** (computed on-the-fly):
  ```typescript
  interface MatchHighlight {
    type: HighlightType;
    badge: string; // emoji
    label: string; // Spanish label
    description: string; // e.g., "Team A lost first set 3-6, then won 6-4, 6-4"
    set_number?: number; // for set-specific highlights
    team_id?: string; // for team-specific highlights (comebacks)
  }
  ```

## Test Impact
- Add unit tests for highlight detection functions:
  - `detectComebacks` correctly identifies comebacks
  - `detectCloseSets` identifies sets decided by 1-2 games
  - `detectDramaticFinish` identifies dramatic final sets
  - `detectTiebreaks` identifies tiebreak sets
  - `detectPerfectSets` identifies bagel sets
  - `getMatchHighlights` returns correct combination of highlights
- Add unit tests for `MatchHighlights` component:
  - Renders correct badges and descriptions
  - Handles empty state (no highlights)
  - Displays all highlights for a match
- Add E2E tests:
  - Navigate to match detail page, verify highlights section displays
  - Navigate to highlights feed, verify filtering works
  - Test shareable card generation and download
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider adding "Most Memorable" algorithm that combines multiple factors (comeback + tiebreak + dramatic finish)
- Consider showing highlights on player profile (e.g., "This player has 3 comebacks, 5 tiebreak wins")
- Long-term: Allow users to manually add "custom highlights" with notes/photos
- Long-term: Highlight notifications (e.g., "You just won your first comeback match!")
- For shareable cards, consider adding QR code that links to match detail page
- Consider localization: Highlight labels and descriptions should be translatable for future Spanish/English support
- Ensure accessibility: All badges have alt text, keyboard navigation works on highlights feed
- For large groups (200+ matches), consider pagination for highlights feed
- Consider adding "Top Highlights" section on dashboard showing recent exciting matches
- **Clarification**: No video upload/filming required - all highlights are computed from match score data
- **Future Enhancement Phase 2**: Video highlights where users can upload match clips and attach them to highlight moments (requires file upload, video processing, storage)
