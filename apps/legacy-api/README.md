# `@gosource/legacy-api`

This app is the imported legacy GoSource backend, brought into the monorepo to support a frontend-first migration.

## Purpose

Use this service as the active backend while:

1. `customer-web` is rebuilt and modernized
2. `admin-web` is rebuilt and modernized
3. backend replacement decisions are deferred until the frontend migration is stable

## Workspace usage

From the monorepo root:

```bash
pnpm install
pnpm --filter @gosource/legacy-api dev
```

## Required environment setup

Copy:

```bash
cp apps/legacy-api/.env.example apps/legacy-api/.env
```

Then provide the real values for:

1. `DB_URL`
2. `JWT_SECRET`
3. `REDIS_URL`
4. email provider variables if the flow needs them
5. paystack/cloudinary/termii values if those flows are being tested

## Notes

1. This app is intentionally imported with minimal behavior changes first.
2. We should prefer adapting the frontend and BFF layers before rewriting backend internals.
3. Old deployment or local-repo artifacts have been removed where they were not useful inside the monorepo.
