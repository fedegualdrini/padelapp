# Partnerships Pages AppShell Verification

**Task:** Add AppShell to Partnerships Pages  
**Card:** https://trello.com/c/b0Q4hMiM  
**Branch:** `padel-frontend/partnerships-appshell-20260220`

## Verification Results

Both partnerships pages are already in the `(protected)` route group and inherit AppShell.

### Current Structure

```
src/app/g/[slug]/(protected)/
├── layout.tsx          # AppShell wrapper (membership check + redirect)
├── partnerships/
│   ├── page.tsx        # ✓ List page - uses AppShell via layout
│   └── [player1Id]/[player2Id]/
│       └── page.tsx    # ✓ Detail page - uses AppShell via layout
```

### AppShell Applied Via Parent Layout

Both pages are wrapped by `(protected)/layout.tsx` which:
- Enforces membership (redirects to `/join` if not member)
- Wraps content in `<AppShell>` with NavBar
- Provides consistent container/max-width

### Partnerships List Page (`page.tsx`)

✅ **Location**: `src/app/g/[slug]/(protected)/partnerships/page.tsx`  
✅ **AppShell**: Via parent layout  
✅ **Design tokens**: Uses CSS variables throughout  
✅ **Spanish copy**: "Parejas", "Reiniciar", "Filtrando por jugador"

### Partnership Detail Page (`[player1Id]/[player2Id]/page.tsx`)

✅ **Location**: `src/app/g/[slug]/(protected)/partnerships/[player1Id]/[player2Id]/page.tsx`  
✅ **AppShell**: Via parent layout  
✅ **Design tokens**: Uses CSS variables  
✅ **Spanish copy**: "Volver a parejas", "Estadísticas de la pareja", "Sinergia"

### Design System Compliance

Both pages use:
- `text-[var(--ink)]` - Primary text
- `text-[var(--muted)]` - Secondary text
- `bg-[color:var(--card-glass)]` - Card backgrounds
- `bg-[color:var(--card-solid)]` - Solid backgrounds
- `border-[color:var(--card-border)]` - Borders
- `text-[var(--accent)]` - Accent color

### No Issues Found

| Issue from Card | Status | Notes |
|-----------------|--------|-------|
| No AppShell | ✅ Already has | Via parent layout |
| Container mismatch | ✅ N/A | Uses AppShell container |
| Design token mismatch | ✅ Already uses CSS vars | No bg-white/text-gray-* |
| English copy | ✅ Already Spanish | "Parejas", "Volver" |
| Gradient/blue avatars | ✅ N/A | Uses InitialBadge with card-solid bg |

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Partnerships list uses AppShell | ✅ Already done |
| Partnership detail uses AppShell | ✅ Already done |
| Migrate to CSS variables | ✅ Already using |
| Update copy to Spanish | ✅ Already Spanish |
| Consistent with dashboard | ✅ Matches design |

## Conclusion

Both partnerships pages were already moved to the `(protected)` route group and automatically inherit AppShell. All acceptance criteria satisfied.

No code changes required.
