# Stitch to PadelApp Implementation Plan

## Screen Mapping

| # | Stitch Screen | Target Route | Priority | Status | Notes |
|---|---------------|--------------|----------|--------|-------|
| 1 | padelapp_landing_page_main | `/` (root) | 🔴 High | Pending | Replace current home page |
| 2 | padelapp_group_dashboard_dark_mode | `/g/[slug]` | 🔴 High | Pending | Adapt existing dashboard |
| 3 | padelapp_groups_directory_screen | `/` or `/groups` | 🟡 Medium | Pending | Could merge with landing |
| 4 | padelapp_player_profile_screen | `/g/[slug]/players/[id]` | 🟡 Medium | Pending | Player detail view |
| 5 | padelapp_venues_directory_screen_1 | `/g/[slug]/venues` | 🟢 Low | Pending | New feature |
| 6 | padelapp_venues_directory_screen_2 | `/g/[slug]/venues` | 🟢 Low | Pending | Alt design - pick best |
| 7 | padelapp_court_booking_screen | `/g/[slug]/booking` | 🟢 Low | Pending | New feature |

## Key Adaptations Needed

### 1. Tailwind v3 → v4 Migration
- Stitch uses Tailwind v3 CDN syntax
- App uses Tailwind v4 with CSS-first config
- Convert inline config to CSS variables
- Update color tokens to match app theme

### 2. Component Extraction
Common patterns to extract:
- `Header` - Glassmorphism nav with logo
- `Card` - Rounded containers with border
- `Button` - Primary/secondary variants
- `Icon` - Replace Material Symbols with Lucide

### 3. React Conversion
- Static HTML → React components
- Add TypeScript types
- Use Server Components where possible
- Client Components for interactivity

### 4. Design Tokens
```
primary: #13ec13 (bright green)
background-light: #f6f8f6
background-dark: #102210
charcoal: #0d1b0d
wimbledon-green: #006400
```

## Implementation Order

1. **Phase 1: Core UI** (Landing + Dashboard)
   - [ ] Create design tokens in globals.css
   - [ ] Extract shared components (Header, Card, Button)
   - [ ] Implement Landing Page (`/`)
   - [ ] Adapt Group Dashboard (`/g/[slug]`)

2. **Phase 2: Player Features**
   - [ ] Player Profile screen
   - [ ] Groups directory integration

3. **Phase 3: New Features** (if requested)
   - [ ] Venues directory
   - [ ] Court booking

## Questions for Fede

1. Do you want to keep the bright green (#13ec13) as primary, or use a different color?
2. Venues and Booking screens - are these new features you want to add now, or skip for later?
3. Two venue screens - which design do you prefer, or should I pick the best elements from both?
4. Dark mode - should all screens support it, or just the dashboard as designed?
