# Feature: Visual Calendar View

**Status:** IMPLEMENTED

**Commit:** 94eed27
**Implemented:** 2026-01-29

## Why
Currently, the app displays events and matches in list views on separate pages. While functional, this makes it difficult to see the overall schedule at a glance and understand temporal patterns. A visual calendar view would:

1. **Improve planning** - Users can see upcoming events and matches across weeks/months in one view
2. **Identify gaps** - Easy to spot open dates or see when attendance is low
3. **Better UX** - Calendars are intuitive for scheduling applications
4. **Mobile-friendly** - Tap dates on mobile vs scrolling through lists
5. **Quick context** - See event status, match results, and attendance at a glance

Most scheduling apps use calendar views because they're more scannable than lists for time-based data.

## Scope
Add a calendar view that combines events and matches into a single visual interface:
- Monthly calendar grid with event/match indicators on each day
- Color-coded day markers (event planned, match played, attendance confirmed)
- Clicking a day shows details for that date (events, matches, attendance)
- Navigate between months with prev/next controls
- Responsive design: full-month on desktop, week or day view on mobile
- Quick action buttons to create events or matches from the calendar

### Proposed UX
- **Calendar Page**: New route at `/g/[slug]/calendar`
  - Header: Month/year title with prev/next navigation
  - Grid: 7 columns (Sun-Sat) with 5-6 rows for days
  - Each day cell shows:
    - Date number (1-31)
    - Small colored dots for events (green for upcoming, gray for past)
    - Small colored dots for matches (blue for played, gray for scheduled)
    - Attendance indicator (checkmark for confirmed, question mark for pending)
  - Today's date is highlighted with a border or background color
- **Day Details Modal/Sheet**:
  - Clicking a day opens a bottom sheet (mobile) or modal (desktop)
  - Shows list of events for that date with:
    - Event name and time
    - Attendance count (X/4 confirmed)
    - Status badge (open/locked/completed)
    - Quick action: "View event details" or "Join" if open
  - Shows list of matches for that date with:
    - Match teams and score
    - MVP if assigned
    - Link to match details
  - "Create event" button for dates without events
  - "Create match" button for dates without matches
- **Responsive Behavior**:
  - Desktop: Full 7-column calendar grid
  - Mobile: Option to toggle between month/week/day views
  - Mobile default: Week view (current week, horizontal scroll)
- **Quick Actions**:
  - "Today" button to jump to current month
  - Filter toggle: "Show all" / "Events only" / "Matches only"

## Acceptance Criteria
- [x] Calendar page displays current month with 7-column grid
- [x] Each day cell shows date number and activity indicators
- [x] Events show green dots (upcoming) or gray dots (past)
- [x] Matches show blue dots (played) or gray dots (scheduled)
- [x] Today's date is visually highlighted
- [x] Prev/next month navigation updates calendar
- [x] Clicking a day opens details modal with events and matches
- [x] Day details modal shows event name, time, attendance count, status
- [x] Day details modal shows match teams, score, MVP
- [ ] Quick action buttons create new events/matches from calendar (deferred)
- [x] "Today" button jumps to current month
- [x] Filter toggle shows/hides events and matches
- [x] Mobile-responsive with week view option (using responsive grid)
- [x] Empty states handled (no events/matches for selected month)
- [x] Must pass: `npm test` (44 tests passed)

## Data Requirements
- New query: `getCalendarData(groupId, year, month)` returns:
  - `events`: array of `{id, name, date, time, status, attendanceCount, capacity}`
  - `matches`: array of `{id, date, team1, team2, score1, score2, mvpPlayerId}`
- Date filtering for efficient queries (only fetch data for displayed month)
- Existing `getUpcomingOccurrences` and `getMatches` queries can be reused with date filters

## Test Impact
- Add unit tests for calendar data aggregation:
  - Correct date range filtering
  - Event/match counting per day
  - Status badge determination
  - Empty month handling
- Add E2E test for calendar page rendering
- Add E2E test for month navigation
- Add E2E test for day details modal
- Add E2E test for creating event from calendar
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- Consider using a lightweight calendar library (date-fns, dayjs) for date manipulation
- For mobile, week view could show 3-4 columns horizontally swipeable
- Long-term: Add year view for annual planning
- Long-term: Support recurring event visualization (e.g., show "Weekly" indicator on Thursdays)
- Calendar view could become the default homepage for logged-in users (current home page shows activity feed)
- Consider adding "quick stats" in calendar header (e.g., "3 events this month", "8 matches played")
- For accessibility, ensure keyboard navigation works for day cells
- Timezone handling: Use group's timezone or browser's timezone for date display
