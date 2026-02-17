# Frontend Standards

## React Patterns

### Component Structure
```typescript
'use client';  // Required for client components

import { useRouter } from 'next/navigation';
import type { FC } from 'react';

// Define types at top
interface MyComponentProps {
  prop1: string;
  prop2?: number;
}

// Use default export for page components
export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  const router = useRouter();
  
  // Event handlers
  const handleClick = () => {
    // logic
  };
  
  return (
    // JSX
  );
}
```

### Props Pattern
- Use destructuring for props
- Define interfaces before component
- Use readonly arrays: `readonly MatchTeam[]`
- Use optional props with `?` syntax

### State Management
- Use `useState` for local state
- Use `useRouter` from `next/navigation` for navigation
- Prefer composition over context for simple cases
- Use Supabase directly for data fetching

## Tailwind CSS v4

### Variable Colors
Use CSS variables defined in globals.css:
```css
--bg-base        /* Background base */
--card-border    /* Card borders */
--card-glass     /* Glassmorphism background */
--card-solid     /* Solid backgrounds */
--ink            /* Primary text */
--muted          /* Secondary text */
--accent         /* Brand accent */
```

### Component Styling
```tsx
<div className="
  flex flex-col gap-4
  rounded-2xl
  border border-[color:var(--card-border)]
  bg-[color:var(--card-glass)]
  p-4
  shadow-[0_18px_40px_rgba(0,0,0,0.08)]
  backdrop-blur
  transition hover:-translate-y-0.5
  cursor-pointer
">
```

### Tailwind Patterns
- Use arbitrary values for colors: `[color:var(--card-border)]`
- Use responsive prefixes: `sm:`, `md:`, `lg:`
- Use state variants: `hover:`, `focus:`, `active:`
- Use `group` for parent hover effects
- Use `peer` for sibling element styling

## Component Development

### Interactive Components
```tsx
// Click handlers with router
onClick={() => router.push(matchHref)}

// Keyboard accessibility
onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    router.push(matchHref);
  }
}}

// Clickable elements
tabIndex={0}
role="link"
```

### Forms
- Use controlled components
- Inline validation where appropriate
- Clear feedback on success/error

### Data Display
- Use conditional rendering for empty states
- Format dates with helper functions
- Display scores clearly

## Conventions

### File Organization
```
src/components/
├── ui/              # Generic UI (Button, Card, etc.)
├── matches/         # Match-specific components
├── players/         # Player-specific components
├── widget/          # Widget components
└── [feature]/       # Feature-specific components
```

### Naming
- Components: PascalCase (`MatchCard`)
- Files: match component name (`MatchCard.tsx`)
- Props interfaces: `[ComponentName]Props`

### Imports
```typescript
// Next.js
import { useRouter } from 'next/navigation';

// React
import type { FC, ReactNode } from 'react';

// Components
import { MatchCard } from '@/src/components/matches/MatchCard';

// Lib
import { formatDate } from '@/src/lib/utils';
```

## Anti-patterns (Avoid)
- Don't use `use client` on server-only components
- Don't inline styles when Tailwind classes available
- Don't mix import patterns (use @/src/ consistently)
- Don't hardcode colors (use CSS variables)
- Don't forget keyboard accessibility for interactive elements
