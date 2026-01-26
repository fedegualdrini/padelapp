---
name: react-19
description: >
  React 19 patterns used in this repo.
  Trigger: when editing client components, forms, or interactive UI.
license: Apache-2.0
metadata:
  author: padel-app
  version: "1.0"
---

## Component boundaries

- Default to Server Components (Next.js).
- Use Client Components only for interactivity: forms, toggles, local state.
- Keep client components small and focused.

## State and effects

- Avoid useEffect for data fetching; fetch on the server instead.
- Use local state for UI controls and transient form state.
- Prefer derived state over duplicating props.

## Forms and actions

- Use standard form elements and submit handlers in client components.
- Keep data writes in server actions or server-side helpers.

## Performance

- Avoid prop drilling by passing only what is needed.
- Memoize only when measurable, do not pre-optimize.
- Use stable keys when rendering lists.

## Keywords
react, hooks, client components, forms, state
