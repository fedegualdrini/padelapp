# Feature: Weekly Event Attendance UI

**Status:** APPROVED

## Why
The database already has a complete attendance planning system (weekly_events, event_occurrences, attendance, whatsapp_identities tables) designed for WhatsApp bot integration, but there's no web UI for it. Groups need a way to:
- Set up recurring weekly matches (e.g., "Thursday 20:00")
- See who's coming to next week's match
- Manage attendance confirmations without relying solely on WhatsApp
- View attendance history and spot no-shows

This bridges the gap between the existing data model and user-facing functionality.

## Scope
Create a new page at `/g/[slug]/events` that displays:
- List of upcoming weekly events (next 4-6 occurrences)
- Current attendance status for each occurrence (confirmed/declined/maybe/waitlist)
- Ability to confirm/decline attendance for upcoming matches
- Weekly event configuration (for group admins)
- Attendance history view (past occurrences)

### Proposed UX
- New navigation item "Eventos" in group dashboard
- Card-based layout showing upcoming occurrences
- Each occurrence card shows: date/time, current confirmed count, list of confirmed players
- Quick action buttons: "Voy" / "No voy" / "Tal vez" per occurrence
- Admin section to configure: weekday, time, capacity, cutoff time
- Visual indicators for full capacity vs available spots
- Past events collapsible section with attendance summary

## Acceptance Criteria
- [ ] Route `/g/[slug]/events` exists and displays upcoming event occurrences
- [ ] Players can see their own attendance status and change it
- [ ] Players can view who else is confirmed/declined/maybe
- [ ] Waitlist functionality: when capacity is reached, new confirmations go to waitlist
- [ ] Group admins can configure weekly event settings (time, day, capacity)
- [ ] Attendance counts update in real-time (or on refresh)
- [ ] Past occurrences are shown in a separate section with summary stats
- [ ] Mobile-responsive layout
- [ ] 404 for non-group members
- [ ] Must pass: `npm test`

## Data Requirements
- Use existing tables: `weekly_events`, `event_occurrences`, `attendance`
- Reuse RLS policies already defined
- New queries needed:
  - `getWeeklyEvents(groupId)` - get configured weekly events
  - `getUpcomingOccurrences(groupId, limit)` - get next N occurrences with attendance
  - `getAttendanceForOccurrence(occurrenceId)` - get all attendance records
  - `upsertAttendance(occurrenceId, playerId, status)` - confirm/decline
  - `getPastOccurrences(groupId, limit)` - for history view

## Test Impact
- Add E2E tests for attendance flow (confirm/decline)
- Add E2E tests for admin configuration
- Add component tests for attendance cards
- Must pass: `npm test`

## Estimated Size
medium

## Notes
- This feature builds on existing database schema from migration 20260126_000001
- Can integrate with WhatsApp bot later (bot already writes to same tables)
- Consider email/notification feature in future iteration
- Cutoff time enforcement can be UI-only initially (soft enforcement)
