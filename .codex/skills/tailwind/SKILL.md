---
name: tailwind-4
description: >
  Tailwind CSS v4 patterns used in this repo.
  Trigger: when editing styles, layouts, or theming.
license: Apache-2.0
metadata:
  author: padel-app
  version: "1.0"
---

## Styling approach

- Use Tailwind utility classes for layout and component styling.
- Keep styles close to the JSX; avoid unnecessary custom CSS.
- Prefer composition of utilities over custom classnames.

## Theme and tokens

- Light/dark theme is controlled by `next-themes`.
- Use existing CSS variables if present; do not introduce new tokens without need.

## Layout patterns

- Prefer `flex`/`grid` utilities for layout structure.
- Use responsive variants (`sm:`, `md:`, `lg:`) for breakpoints.
- Keep spacing consistent with `gap-*`, `px-*`, `py-*`, `space-*`.

## Components

- Use clear semantic elements (`button`, `nav`, `main`, `section`).
- Ensure interactive elements have visible hover/focus states.
- Keep class lists readable; wrap long lines only when necessary.

## Keywords
tailwind, tailwindcss, utility classes, layout, theming
