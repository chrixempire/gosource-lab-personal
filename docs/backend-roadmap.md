# GoSource Backend Roadmap

This roadmap is the step-by-step plan for the backend only.
We keep it boring, small, and migration-aware.

## Guiding Rules

- Finish one phase before starting the next.
- Keep the backend simple enough to understand.
- Build for the old `gosource-api` migration, not against it.
- Add infrastructure only when the current phase needs it.
- Prefer boring, explicit code over clever abstractions.

## Phase 1 — API Skeleton

Goal:
- get `apps/api` booting cleanly
- keep the first backend step tiny and reliable

Includes:
- NestJS app bootstrap
- `GET /health`
- graceful shutdown hooks
- root app module
- basic package scripts
- workspace wiring

Status:
- complete

## Phase 2 — Config + Database

Goal:
- make the backend safe to run
- prepare it for real data

Includes:
- env loading and validation
- PostgreSQL connection
- database module
- readiness endpoint
- clean shutdown for the DB pool

Status:
- complete

## Phase 2.5 — Drizzle Port

Goal:
- switch the backend database layer to the Daash-style Drizzle setup before we build real business flows

Includes:
- install and wire `drizzle-orm`, `drizzle-kit`, and the Postgres driver
- replace Prisma client code with a Drizzle database module
- define the first GoSource tables in Drizzle
- create the Drizzle migration flow
- keep the existing health endpoints working through the new layer
- move one existing model at a time
- verify build, typecheck, and migration execution after each step

Suggested step order:
1. remove Prisma dependencies and replace them with Drizzle packages
2. create the Drizzle config and schema entrypoint
3. wire the database module to Drizzle
4. convert the existing `Business` model
5. run and verify the first migration
6. update the health readiness check to use Drizzle
7. clean up any Prisma-specific files and scripts
8. confirm the API boots, builds, and typechecks cleanly

Status:
- complete

## Phase 3 — Authentication + Onboarding

This phase is now split into smaller flows so we can build the customer path first.

### Phase 3A — Customer Registration

Goal:
- let a new business/customer start registration and complete first account setup

Includes:
- `POST /auth/signup`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`
- `PATCH /auth/setup-account`
- customer registration UI flow
- migration-aware business/customer identity fields

Status:
- next

### Phase 3B — Customer Sign-In + Password Reset

Goal:
- let customer users sign in and recover access cleanly

Includes:
- `POST /auth/login`
- `POST /auth/send-password-email`
- `POST /auth/verify-password-otp`
- `POST /auth/reset-password`
- customer login UI
- customer forgot-password UI

### Phase 3C — Admin Authentication

Goal:
- let internal admins get into the admin product safely

Includes:
- `POST /admin/auth/login`
- `POST /admin/auth/register`
- `PATCH /admin/auth/complete-admin-signup`
- `POST /admin/auth/initiate-password-reset`
- `POST /admin/auth/complete-password-reset`
- `POST /admin/auth/verify-otp`
- `POST /admin/auth/resend-invite`
- admin auth UI flow

Status:
- started

### Phase 3D — Employee Invite Acceptance

Goal:
- let invited team members join a business or branch cleanly

Includes:
- `GET /employee/invite/:invitationId`
- `POST /employee/setup-account`
- invite acceptance UI

### Phase 3E — Branch Onboarding

Goal:
- let a newly registered business create its first branch

Includes:
- `POST /branch/create`
- first-branch onboarding UI

## Phase 4 — Business + Branch Core

Goal:
- establish the core tenant and access structure for GoSource

Includes:
- business profile
- branch profile
- member assignment
- branch access boundaries
- controller, service, repository, DTOs, tests

## Phase 5 — Migration-Aware Core Models

Goal:
- align the new backend with the legacy `gosource-api` model without forcing a hard rewrite

Includes:
- product/catalog mapping
- cart/request mapping
- order/request mapping
- legacy status mapping
- legacy ID references where useful

## Phase 6 — Write Safety

Goal:
- make mutations safe and repeatable

Includes:
- idempotency
- transaction-safe writes
- soft delete where needed
- validation on mutating endpoints

## Phase 7 — Operational Support

Goal:
- make the backend ready for real usage

Includes:
- structured logging
- Swagger docs
- Redis only if needed
- background jobs only when needed
- basic monitoring hooks

## Phase 8 — Migration Work

Goal:
- move real data from `gosource-api` into the new backend

Includes:
- migration scripts
- entity mapping
- import order
- validation after each import batch
- legacy reference tracking

## What Not To Do Yet

- microservices
- queues before we need them
- event buses before we need them
- advanced observability before the API is stable
- heavy shared backend packages
- overbuilt abstractions
