# Head-to-Head Comparison Feature - Test Report

**Date**: 2026-01-21
**URL Tested**: http://localhost:3000/g/padel/players/compare
**Environment**: localhost:3000 (Development)
**Test Framework**: Playwright
**Browser**: Chromium

---

## Executive Summary

The head-to-head comparison feature has a **critical bug** that prevents the dropdown selectors from working. The backend data fetching and display logic work correctly, but the client-side state management in `PlayerSelector.tsx` is broken.

**Status**: ❌ FAILING
**Severity**: HIGH
**User Impact**: Users cannot select players using the dropdown menus. The feature only works if users manually edit the URL.

---

## Root Cause Analysis

### The Bug

**Location**: `D:\padelApp\src\app\g\[slug]\players\compare\PlayerSelector.tsx`

**Problem**: The component uses props (`playerA` and `playerB`) to pass values to `handleChange`, but these props are `undefined` until navigation occurs. This creates a catch-22:

1. User selects Player A from dropdown
2. `handleChange` is called with `(playerAId, playerB || "")`
3. Since `playerB` prop is `undefined`, it passes `""` (empty string)
4. Condition `if (newPlayerA && newPlayerB)` evaluates to `FALSE`
5. Navigation does NOT happen
6. Props are never updated
7. Same issue when selecting Player B

**Buggy Code** (Lines 36 and 52):

```tsx
// Line 36 - Player A dropdown
onChange={(e) => handleChange(e.target.value, playerB || "")}
// Problem: playerB is undefined initially

// Line 52 - Player B dropdown
onChange={(e) => handleChange(playerA || "", e.target.value)}
// Problem: playerA is undefined initially
```

**handleChange Logic** (Line 21):

```tsx
const handleChange = (newPlayerA: string, newPlayerB: string) => {
  if (newPlayerA && newPlayerB) {  // Both must be truthy
    router.push(
      `/g/${slug}/players/compare?playerA=${newPlayerA}&playerB=${newPlayerB}`
    );
  }
};
```

### Why It Never Works

| Step | User Action | playerA prop | playerB prop | handleChange receives | Navigation? |
|------|-------------|--------------|--------------|----------------------|-------------|
| 1 | Page loads | `undefined` | `undefined` | N/A | N/A |
| 2 | Selects Player A | `undefined` | `undefined` | `(playerAId, "")` | ❌ No (empty playerB) |
| 3 | Selects Player B | `undefined` | `undefined` | `("", playerBId)` | ❌ No (empty playerA) |

---

## Test Results

### Test 1: Initial Investigation
**File**: `tests/e2e/head-to-head-comparison.spec.ts`
**Result**: ✅ PASS (identified the issue)

**Findings**:
- Page loads correctly after authentication
- Dropdowns are populated with 5 players: Fachi, Fede, Leo, Lucho, Nico
- Selecting players does NOT change the URL
- No navigation occurs (URL change history: empty)
- Debug box is NOT visible (because no query params)
- Stats grid is NOT visible

**Screenshots**:
- `test-results/01-initial-page.png` - Shows empty state
- `test-results/04-after-player-b-selected.png` - Shows dropdowns populated but no data displayed

---

### Test 2: URL Navigation Debug
**File**: `tests/e2e/head-to-head-debug.spec.ts`
**Result**: ✅ PASS (confirmed the workaround)

**Findings**:
- **Manual Navigation WORKS**: When navigating to `/g/padel/players/compare?playerA=xxx&playerB=yyy`, the stats display correctly
- **Dropdown Selection FAILS**: URL does not change, no query parameters added
- **Backend is Working**: Data fetching, calculations, and display logic all work properly
- **Stats Available**: Fachi vs Fede shows 5 total matches with correct win/loss stats

**Key Evidence**:
```
URL after Player A selection: http://localhost:3000/g/padel/players/compare
URL after Player B selection: http://localhost:3000/g/padel/players/compare
URL change history: []  ← No navigation occurred!
```

When manually navigating with query params:
```
Debug box visible: true
Stats grid visible: true  ← Feature works!
```

**Screenshot**: `test-results/manual-navigation.png` shows working feature with:
- Debug data: Full stats object visible
- Comparison cards: Fachi (1 win, 20%) vs Fede (4 wins, 80%)
- Total matches: 5 games
- Match history: 5 matches listed with dates and scores

---

### Test 3: Root Cause Analysis
**File**: `tests/e2e/head-to-head-root-cause.spec.ts`
**Result**: ✅ PASS (confirmed the exact bug)

**Detailed Walkthrough**:

```
Initial state:
  playerA prop: undefined
  playerB prop: undefined

User selects Player A:
  handleChange called with: ("8f48c743-...", "")
  Condition: if ("8f48c743..." && "") → FALSE
  Result: Navigation DOES NOT HAPPEN

User selects Player B:
  handleChange called with: ("", "f6389fd4-...")
  Condition: if ("" && "f6389fd4...") → FALSE
  Result: Navigation DOES NOT HAPPEN
```

**Conclusion**: The component needs local state management (`useState`) instead of relying on props.

---

## Authentication Testing

**Finding**: Initial tests failed because the feature requires group membership.

**Solution**: Tests now authenticate by:
1. Navigating to `/g/padel/join`
2. Entering passphrase: `padel`
3. Clicking "Ingresar"
4. Waiting for redirect to group pages

This authentication flow is now included in all test cases.

---

## Backend Verification

**Database Connectivity**: ✅ VERIFIED
**Data Fetching**: ✅ WORKING
**RLS Policies**: ✅ ENFORCED
**Head-to-Head Logic**: ✅ CORRECT

**Test Data Available**:
- Group: `padel` (slug)
- Players: 5 (Fachi, Fede, Leo, Lucho, Nico)
- Matches: Multiple matches with head-to-head data
- Example: Fachi vs Fede have faced each other 5 times

**Function Tested**: `getHeadToHeadStats(groupId, playerAId, playerBId)`
- Returns correct player names
- Calculates wins/losses accurately
- Counts sets won correctly
- Retrieves match history with dates and scores

---

## Console Errors

**JavaScript Errors**: None
**Network Errors**: None
**React Errors**: None

**Console Output** (development only):
- React DevTools suggestion (informational)
- HMR connected (Hot Module Reload - expected)
- Fast Refresh messages (expected in dev mode)

---

## Network Analysis

**Supabase API Calls**: Minimal (as expected for Server Components)
**Failed Requests**: 0
**CORS Issues**: None
**Authentication Issues**: None (after initial login)

The application correctly uses Server Components for data fetching, so most Supabase calls happen server-side and are not visible in browser network logs.

---

## User Journey Testing

### Expected Flow
1. ✅ User navigates to `/g/padel/players/compare`
2. ✅ User sees dropdown menus for "Jugador A" and "Jugador B"
3. ❌ User selects first player (NO action occurs)
4. ❌ User selects second player (NO action occurs)
5. ❌ Stats do NOT display

### Actual Behavior
- Dropdowns are functional (clickable, populated)
- Selections are reflected in dropdown UI
- URL does NOT update
- Page does NOT reload/navigate
- No comparison data is displayed

### Workaround (Manual URL Entry)
1. ✅ User navigates to `/g/padel/players/compare?playerA=xxx&playerB=yyy`
2. ✅ Page loads with both players selected
3. ✅ Stats grid displays correctly
4. ✅ Match history shows all encounters
5. ✅ Win percentages calculated correctly

---

## Visual Evidence

### Screenshot Analysis

**Initial Page** (`01-initial-page.png`):
- Clean UI with dropdown selectors
- "Elegir jugador" placeholder text
- No stats displayed (expected on initial load)

**After Selections** (`04-after-player-b-selected.png`):
- Dropdowns show "Fachi" and "Fede"
- URL still shows no query parameters
- No stats displayed (BUG - should show data)

**Working State** (`manual-navigation.png`):
- Debug box shows: `Debug: playerA=8f48c743-...&playerB=f6389fd4-...`
- Stats object: Full JSON with player data, wins, matches
- Comparison cards visible:
  - **Fachi**: 1 victoria, 4 sets ganados, 20% win rate
  - **5 PARTIDOS** (total matches)
  - **Fede**: 4 victorias, 9 sets ganados, 80% win rate
- Match history section with 5 matches:
  - 19 de feb de 2026: Juampi/Fachi vs Fede/Lucho → Ganó Fede
  - 05 de feb de 2026: Fachi/Lucho vs Nico/Fede → Ganó Fede
  - 29 de ene de 2026: Fachi/Mauro vs Fede/Lucho → Ganó Fachi
  - 22 de ene de 2026: Fachi/Lucho vs Leo/Fede → Ganó Fede
  - 18 de ene de 2026: Lucho/Fachi vs Fede/Nico → Ganó Fede

---

## Recommended Fix

### Solution: Add Local State Management

**File**: `src/app/g/[slug]/players/compare/PlayerSelector.tsx`

Replace the component with this implementation:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PlayerSelectorProps = {
  players: Array<{ id: string; name: string }>;
  slug: string;
  playerA?: string;
  playerB?: string;
};

export default function PlayerSelector({
  players,
  slug,
  playerA,
  playerB,
}: PlayerSelectorProps) {
  const router = useRouter();

  // Track selected values in local state
  const [selectedPlayerA, setSelectedPlayerA] = useState(playerA || "");
  const [selectedPlayerB, setSelectedPlayerB] = useState(playerB || "");

  const handlePlayerAChange = (newPlayerA: string) => {
    setSelectedPlayerA(newPlayerA);
    if (newPlayerA && selectedPlayerB) {
      router.push(
        `/g/${slug}/players/compare?playerA=${newPlayerA}&playerB=${selectedPlayerB}`
      );
    }
  };

  const handlePlayerBChange = (newPlayerB: string) => {
    setSelectedPlayerB(newPlayerB);
    if (selectedPlayerA && newPlayerB) {
      router.push(
        `/g/${slug}/players/compare?playerA=${selectedPlayerA}&playerB=${newPlayerB}`
      );
    }
  };

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Jugador A
        <select
          name="playerA"
          value={selectedPlayerA}
          className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
          onChange={(e) => handlePlayerAChange(e.target.value)}
        >
          <option value="">Elegir jugador</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
        Jugador B
        <select
          name="playerB"
          value={selectedPlayerB}
          className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3 py-2 text-sm"
          onChange={(e) => handlePlayerBChange(e.target.value)}
        >
          <option value="">Elegir jugador</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

**Key Changes**:
1. Added `useState` to track selected values locally
2. Created separate handlers for each dropdown
3. Changed `defaultValue` to `value` (controlled components)
4. Each handler updates local state AND navigates if both are selected

---

## Alternative Solution: Navigate on Single Selection

If you want the page to navigate even when only one player is selected (showing a "select another player" message):

```tsx
const handlePlayerAChange = (newPlayerA: string) => {
  setSelectedPlayerA(newPlayerA);
  router.push(
    `/g/${slug}/players/compare?playerA=${newPlayerA}${selectedPlayerB ? `&playerB=${selectedPlayerB}` : ''}`
  );
};

const handlePlayerBChange = (newPlayerB: string) => {
  setSelectedPlayerB(newPlayerB);
  router.push(
    `/g/${slug}/players/compare?${selectedPlayerA ? `playerA=${selectedPlayerA}&` : ''}playerB=${newPlayerB}`
  );
};
```

This would allow users to select players in any order and see partial state.

---

## Test Coverage Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication flow | ✅ PASS | Join page works correctly |
| Page load | ✅ PASS | Compare page renders |
| Dropdown population | ✅ PASS | All players listed |
| Dropdown selection | ❌ FAIL | No navigation occurs |
| URL with query params | ✅ PASS | Manual URL entry works |
| Data fetching | ✅ PASS | Backend returns correct data |
| Stats display | ✅ PASS | When URL has params, displays correctly |
| Match history | ✅ PASS | Shows all head-to-head matches |
| Debug box | ✅ PASS | Displays when playerA & playerB present |

---

## Next Steps

### Required Actions
1. **Fix the bug**: Implement local state management in `PlayerSelector.tsx`
2. **Test the fix**: Re-run Playwright tests to verify dropdowns work
3. **Remove debug box**: Remove the red debug box from production (lines 57-63 in compare page)

### Recommended Actions
1. **Add loading state**: Show spinner while navigating between selections
2. **Improve UX**: Add "Select both players to compare" message when only one is selected
3. **Add validation**: Prevent selecting the same player in both dropdowns
4. **Add unit tests**: Test the component logic with React Testing Library

### Future Enhancements
1. **Persist selections**: Use URL params to maintain state on page refresh
2. **Quick compare**: Add "Compare" buttons on player cards
3. **Share functionality**: Add "Share comparison" button with copyable link
4. **Historical data**: Add date range filter for head-to-head stats

---

## Test Files Created

1. `tests/e2e/head-to-head-comparison.spec.ts` - Initial investigation
2. `tests/e2e/head-to-head-debug.spec.ts` - URL navigation debugging
3. `tests/e2e/head-to-head-root-cause.spec.ts` - Root cause analysis

All tests pass and correctly identify the issue. Screenshots are saved in `test-results/`.

---

## Conclusion

The head-to-head comparison feature is **functionally correct** at the backend level but has a **critical client-side bug** that prevents normal usage. The bug is in the state management of `PlayerSelector.tsx`, where the component relies on props that are never updated because navigation never occurs.

**Impact**: HIGH - Feature is completely unusable via the UI
**Difficulty**: LOW - Simple fix with useState
**Priority**: HIGH - Should be fixed before release

The feature works perfectly when tested with direct URL navigation, confirming that the entire backend logic, data fetching, and display components are working correctly.
