# GoSource Monorepo Rules

This document keeps the monorepo clean and easy to understand while we build GoSource in small steps.

## Core Rule

- Keep the repo boring, obvious, and easy to navigate.
- Extract code only when it is duplicated 2 or 3 times.
- Do not create new packages just because they seem useful.

## Package Ownership

### `apps/customer-web`

- Customer-facing UI
- Routes, pages, layouts, page state
- UI composition for customer flows

### `apps/admin-web`

- Internal admin UI
- Routes, pages, layouts, admin state
- UI composition for operations flows

### `apps/api`

- Backend API
- Business logic
- Auth, permissions, data access, validation

### `apps/worker`

- Background jobs
- Async processing
- Scheduled tasks and retries

### `packages/ui`

- Reusable UI components only
- Button, inputs, cards, tables, etc.
- No business logic

### `packages/shared`

- Shared design tokens
- Base CSS
- Very small shared utilities only if truly common

### `packages/types`

- Shared TypeScript contracts only
- DTOs, request/response types, enums
- No UI and no business logic

### `packages/eslint-config`

- Shared lint configuration only

### `packages/tsconfig`

- Shared TypeScript configuration only

## Keep

- `apps/customer-web`
- `apps/admin-web`
- `packages/ui`
- `packages/shared`
- `packages/types`
- `packages/eslint-config`
- `packages/tsconfig`
- `pnpm-workspace.yaml`
- `turbo.json`
- root `package.json`

## Change Carefully

- Keep `packages/shared` small and focused.
- Keep `packages/ui` focused on reusable components.
- Keep each Nuxt app owning its own Tailwind entry file.
- Keep design tokens in one place.
- Keep button variants centralized in `packages/ui`.

## Postpone

- Large `types` or `shared` packages
- Shared API client
- Backend module extraction beyond the current needs
- Extra abstraction packages
- Microservices
- Premature component libraries
- Premature design-system complexity

## Working Rules

1. Apps should not contain business logic that belongs in the backend.
2. Shared packages should not become dumping grounds.
3. Prefer clear code paths over clever abstractions.
4. Keep the first version understandable by one developer.
5. When in doubt, build the simplest thing that works.

## Folder Hygiene

- Do not commit generated files like `.nuxt/`, `node_modules/`, or `.DS_Store`.
- Remove placeholder files once a folder contains real source files.
- Keep the repo tree easy to scan.

## When To Extract

Extract shared code only when:

- the same logic appears in multiple places
- the code is stable enough to reuse
- the abstraction makes the code simpler, not harder

If a shared package makes the code harder to follow, it is too early.
