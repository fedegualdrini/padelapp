# Git Hooks (local)

This repo uses a **pre-push hook** to prevent pushing unless the full test suite passes.

## Enable hooks

```bash
git config core.hooksPath .githooks
```

## Required env

The hook needs `DATABASE_URL` (test database). Easiest is to create a local file (ignored by git):

```bash
echo 'DATABASE_URL=postgresql://...' > .env.test
```

## What runs on push

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:db`
- `npm run test:e2e`
