# `@gosource/api` (paused)

This Nest app is **kept in the repo** but **not started** by the root dev workflow.

We use **`apps/legacy-api`** as the operational backend for admin-web and customer-web today.

## Run manually (if needed)

```bash
pnpm --filter @gosource/api dev:run
# or
pnpm --filter @gosource/api build && pnpm --filter @gosource/api start
```

## Monorepo scripts

Root `pnpm dev` excludes this package (`--filter=!@gosource/api`). See the root `package.json`.
