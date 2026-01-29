# Feature: Match Activity Feed

**Status:** IMPLEMENTED (commit: 6e22ba6)

## Why

Currently, the app tracks all changes via the `audit_log` table (matches created, edited, MVP assigned, players updated), but there's no way for users to see what's been happening in their group. An activity feed would:

1. Increase transparency - users can see who created/edited matches
2. Help catch mistakes - recent changes are visible and can be verified
3. Create engagement - users can see group activity at a glance
4. Aid debugging - admins can trace when/what was changed

## What

Add a "Recent Activity" section to the group home page that shows:
- Match created (with creator, timestamp, team players)
- Match edited (with editor, timestamp, what changed)
- MVP assigned (with assigner, player)
- Player added/updated

Each activity item should be human-readable with relative timestamps ("hace 5 minutos", "hace 2 horas").

## UI/UX

- Add an "Actividad reciente" section to `/g/[slug]/(protected)/page.tsx`
- Show last 10-15 activities
- Display as a vertical timeline with icons
- Include relative timestamps
- Each item links to the relevant entity (match, player, etc.)

## Technical Notes

- Use existing `audit_log` table (already has triggers on matches, players, etc.)
- New data function: `getRecentActivity(groupId: string, limit?: number)`
- Filter by `entity_type` to create human-readable messages:
  - `matches` + `INSERT` = "Partido creado"
  - `matches` + `UPDATE` = "Partido editado"  
  - `matches.mvp_player_id` change = "MVP asignado"
  - `players` + `INSERT` = "Jugador agregado"
- Parse `changed_by` for user identification
- Use `changed_at` for timestamps

## Out of Scope

- Real-time updates (poll on page load is fine)
- Activity filtering by type
- Activity pagination/load more
- Notifications for new activity

## Success Criteria

- [x] Activity feed visible on group home page
- [x] Shows at least 10 recent activities
- [x] Each activity has clear description, actor, and timestamp
- [x] Links work to relevant matches/players
- [x] Responsive design matches existing UI
