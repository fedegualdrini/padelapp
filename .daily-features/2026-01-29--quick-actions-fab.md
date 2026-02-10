# Feature: Quick Actions Floating Action Button (FAB)

**Status:** IMPLEMENTED (commit: 9707302)

## Why
While the dashboard already has "Acciones rápidas" (Quick Actions) buttons, they are only visible when scrolling to the bottom of the page. On mobile devices, this creates friction for the most common action: loading a new match.

A Floating Action Button (FAB) would:
1. **Always visible** - Stays fixed at the bottom of the screen regardless of scroll position
2. **One-tap access** - No need to scroll or hunt for buttons
3. **Mobile-first UX** - Follows Material Design and modern app patterns
4. **Faster workflow** - Primary action (load match) is just one tap away

Most mobile apps (Gmail, Maps, etc.) use FABs for the primary action because it significantly reduces friction.

## Scope
Add a floating action button that provides quick access to common actions:
- Primary action: "Cargar partido" (load match) - prominent, always visible
- Secondary actions (on tap): "Crear evento", "Nuevo jugador", "Ver calendario"
- Smooth animation for expanding/collapsing secondary actions
- Responsive design: FAB visible on mobile and desktop (with adjusted position)
- Keyboard accessible for power users

### Proposed UX
- **FAB Placement**:
  - Fixed position at bottom-right of viewport
  - Mobile: 16px from bottom/right edges
  - Desktop: 32px from bottom/right edges
- **Primary State**:
  - Shows "+" icon with tooltip "Cargar partido" on hover
  - Background color: accent color (brand color)
  - Shadow for depth (elevation)
  - Ripple effect on tap (optional)
- **Expanded State** (after tap):
  - FAB rotates to "×" icon to close
  - Secondary buttons animate up from FAB position:
    1. "Cargar partido" (topmost, same as primary action)
    2. "Crear evento"
    3. "Nuevo jugador"
    4. "Ver calendario"
  - Each secondary button has icon + label
  - Labels fade in after animation
- **Animation**:
  - Smooth spring animation (150-200ms)
  - Stagger secondary buttons (50ms delay between each)
  - Close animation reverses stagger
- **Accessibility**:
  - Keyboard focusable (Tab key)
  - Enter/Space to open/close
  - Arrow keys to navigate secondary actions
  - Escape to close
  - ARIA labels for screen readers
- **Responsive Behavior**:
  - Mobile: Full FAB experience with animations
  - Desktop: Reduced animation (fade only) to avoid distraction

### Visual Design
- **Primary FAB**:
  - Size: 56px diameter (mobile), 48px (desktop)
  - Border-radius: 50% (circular)
  - Icon: "+" (24px)
  - Color: `var(--accent)` for background, white for icon
  - Shadow: `0 4px 12px rgba(0,0,0,0.15)`
  - Hover: Scale to 1.05, shadow increases
- **Secondary Actions**:
  - Size: 40px diameter
  - Background: `var(--card-solid)`
  - Icon: 18px, `var(--ink)`
  - Label: Small text next to icon, `var(--muted)`
  - Hover: Background becomes `var(--accent)`, text becomes white
- **Labels**:
  - Font-size: 12px
  - Color: `var(--ink)`
  - Padding: 4px 8px
  - Background: `var(--card-solid)`
  - Border-radius: 4px
  - Opacity: 0.9

## Acceptance Criteria
- [ ] FAB is always visible at bottom-right on all pages in `/g/[slug]/*` except join page
- [ ] FAB has "+" icon with accent color background
- [ ] Hover effect shows tooltip "Cargar partido"
- [ ] Tap on FAB expands secondary actions with smooth animation
- [ ] FAB rotates to "×" icon when expanded
- [ ] Secondary buttons animate up in staggered order
- [ ] Secondary buttons show: "Cargar partido", "Crear evento", "Nuevo jugador", "Ver calendario"
- [ ] Each secondary button has icon and label
- [ ] Tap on secondary action navigates to correct page
- [ ] Tap outside FAB area or on "×" closes expanded state
- [ ] Escape key closes expanded state
- [ ] Tab key can focus FAB and secondary actions
- [ ] Arrow keys navigate between secondary actions when expanded
- [ ] Enter/Space triggers focused action
- [ ] ARIA labels announce FAB and secondary actions to screen readers
- [ ] FAB does not overlap important content (buttons, forms, etc.)
- [ ] Animation is smooth and doesn't cause layout shift
- [ ] Mobile: FAB is 16px from edges, animations fully enabled
- [ ] Desktop: FAB is 32px from edges, reduced animation
- [ ] Must pass: `npm test`

## Technical Notes
- Create client component: `src/components/QuickActionsFAB.tsx`
- Use `useState` for expanded/collapsed state
- Use CSS transitions/animations for smooth motion
- Consider using `framer-motion` library for complex animations (if not already installed)
- For accessibility: `role="button"`, `aria-expanded`, `aria-label`, `tabIndex`
- Keyboard event handlers: `onKeyDown` for Escape, Arrow keys, Enter, Space
- Use `useEffect` to close on click outside (detect with `mousedown` event)
- Icons: use Lucide React icons (already in project: `Plus`, `X`, `Calendar`, `UserPlus`, `Trophy`)
- Add to layout: include FAB in `src/app/g/[slug]/(protected)/layout.tsx` to show on all protected pages
- Check current route to disable on specific pages if needed (e.g., `/g/[slug]/join`)

## Test Impact
- Add unit tests for FAB component:
  - Renders in collapsed state
  - Expands on click
  - Closes on click outside
  - Closes on Escape key
  - Shows correct secondary actions
  - Navigates to correct pages
- Add unit tests for accessibility:
  - Keyboard navigation works
  - ARIA attributes are correct
  - Focus management (returns to FAB after action)
- Add E2E test for FAB:
  - Verify FAB is visible on dashboard
  - Click FAB, verify expansion
  - Click secondary action, verify navigation
  - Verify FAB not visible on join page
- Must pass: `npm test`

## Estimated Size
small

## Notes
- Consider making FAB configurable per group (e.g., admin can change primary action)
- Consider showing badge/indicator on FAB for pending actions (e.g., "3 matches need review" in future)
- For small screens (iPhone SE, etc.), ensure FAB doesn't overlap important UI elements
- Long-term: Add haptic feedback on mobile devices using Web Vibration API
- Long-term: Allow customizing secondary actions per user or per group
- Consider adding "recent actions" (e.g., "Load match again" for the last created match)
- FAB should not be visible on `/g/[slug]/join` page (before joining)
- FAB should persist across route changes within `/g/[slug]/*`
- Use `client-only` pattern to prevent hydration mismatch
- For animations, prefer CSS transitions over JavaScript for performance
