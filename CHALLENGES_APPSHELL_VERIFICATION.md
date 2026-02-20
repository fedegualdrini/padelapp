# Challenges Page AppShell Verification

**Task:** Add AppShell to Challenges Page  
**Card:** https://trello.com/c/pSRH87sg  
**Branch:** `padel-frontend/challenges-appshell-20260220`

## Verification Results

The challenges page is already properly located in the `(protected)` route group and inherits AppShell.

### Current Structure

```
src/app/g/[slug]/(protected)/
├── layout.tsx          # Wraps all children in AppShell (membership check + redirect)
├── challenges/
│   ├── page.tsx        # ✓ Uses AppShell via layout.tsx
│   └── challenges-dashboard.tsx  # Client component with design system tokens
```

### AppShell Applied Via Parent Layout

The `(protected)/layout.tsx`:
- Checks membership via `isGroupMember(group.id)`
- Redirects non-members to `/g/${slug}/join`
- Renders children inside `<AppShell groupName={...} slug={...}>`

### Challenges Page Features

✅ **Location correct**: `src/app/g/[slug]/(protected)/challenges/page.tsx`  
✅ **Uses AppShell**: Via parent layout.tsx  
✅ **Has NavBar**: Provided by AppShell  
✅ **Design system tokens**: Uses CSS variables throughout
✅ **Membership handling**: Parent layout enforces membership + redirect

### Design System Compliance

The `challenges-dashboard.tsx` uses:
- `bg-[color:var(--card-glass)]` - Card backgrounds
- `bg-[color:var(--card-solid)]` - Solid backgrounds
- `border-[color:var(--card-border)]` - Borders
- `text-[var(--ink)]` - Primary text
- `text-[var(--muted)]` - Secondary text
- `bg-[var(--accent)]` - Accent color

### No Dark Gradient Issue

The code does NOT use a dark gradient background. The `ChallengesDashboard` uses the standard card-based design system.

### Access Behavior

The parent `layout.tsx` handles this:
```tsx
const isMember = await isGroupMember(group.id);
if (!isMember) {
  redirect(`/g/${slug}/join`);
}
```

## Acceptance Criteria Status

| Criteria | Status | Notes |
|----------|--------|-------|
| Challenges page wrapped in AppShell | ✅ Already done | Via (protected)/layout.tsx |
| Consistent NavBar | ✅ Already done | From AppShell |
| Fix access behavior (redirect to join) | ✅ Already done | Parent layout handles this |
| Dark gradient migrated | ✅ N/A | No dark gradient uses design system |

## Conclusion

This feature was already implemented. The challenges directory was moved into the `(protected)` route group, automatically inheriting:
- AppShell wrapper with NavBar
- Membership checks with redirect to join page
- Consistent styling with design system

No code changes required.
