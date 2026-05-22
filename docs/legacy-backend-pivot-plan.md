# Legacy Backend Pivot Plan

## Decision

Use the existing `gosource-api` as the active backend during the migration, and focus current product delivery on rebuilding the web apps inside the monorepo.

This means:

1. `apps/customer-web` and `apps/admin-web` continue as the primary rewrite surface
2. the legacy backend is brought into the monorepo as a managed app
3. the new rebuilt backend stops being the primary delivery target for now
4. backend replacement work becomes selective and later, not parallel and broad

## Why this is the better move now

### Business reason

The legacy backend already contains the live domain:

1. auth
2. products
3. categories
4. cart
5. requests
6. orders
7. wallet
8. admin operations

That gives us a much smoother migration path for users than replacing backend, frontend, and database architecture all at once.

### Engineering reason

The current rebuild has already produced valuable frontend architecture and safer session handling, but rebuilding the full backend in parallel creates too many moving parts:

1. API contract drift
2. duplicated business logic
3. migration risk on real data
4. slower product progress

### Recommendation

Pivot to:

1. frontend-first modernization
2. legacy-backend integration
3. later backend extraction or replacement module by module

## Recommended monorepo structure

### Keep

1. [apps/customer-web](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web)
2. [apps/admin-web](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/admin-web)
3. [packages/api-client](/Users/acumenspare/Documents/codebase/personal/gosource-lab/packages/api-client)
4. [packages/ui](/Users/acumenspare/Documents/codebase/personal/gosource-lab/packages/ui)
5. [packages/shared](/Users/acumenspare/Documents/codebase/personal/gosource-lab/packages/shared)
6. [packages/icons](/Users/acumenspare/Documents/codebase/personal/gosource-lab/packages/icons)

### Introduce

Import the legacy backend into the workspace as:

1. `apps/legacy-api`

This is better than keeping it only under `reference/` because:

1. it becomes runnable by the workspace tooling
2. env management becomes clearer
3. frontend integration targets a first-class app
4. future cleanup and extraction are easier

### Do not do

Do not replace `apps/api` with the legacy code directly.

Keep `apps/api` separate so we retain:

1. the new auth/session/security experiments
2. the Mongo rebuild work as reference material
3. a safe place for future targeted backend replacement work

## What to import from the legacy backend

Bring in the full backend app, but treat some files as migration scaffolding only.

### Import fully

1. `src/`
2. `package.json`
3. `nest-cli.json`
4. `tsconfig.json`
5. `tsconfig.build.json`
6. `.env.example`

### Do not preserve as-is without review

1. `.git/`
2. old deployment files
3. local dumps like `dump.rdb`
4. old CI files if they conflict with monorepo delivery

### Immediate cleanup after import

1. remove the nested git metadata from the imported backend
2. rename the package to `@gosource/legacy-api`
3. normalize its scripts to fit the workspace
4. point env files to current local conventions

## Import plan

### Step 1

Copy:

1. `reference/gosource-api` -> `apps/legacy-api`

### Step 2

Update `apps/legacy-api/package.json`:

1. set `"name": "@gosource/legacy-api"`
2. keep `dev`, `build`, and `start` scripts
3. avoid changing runtime behavior yet

### Step 3

Remove legacy repo-specific clutter:

1. nested `.git`
2. old deployment-only files that are no longer needed immediately
3. accidental local artifacts

### Step 4

Install and validate:

1. `pnpm install`
2. `pnpm --filter @gosource/legacy-api build`
3. `pnpm --filter @gosource/legacy-api dev`

### Step 5

Wire frontend apps to the legacy backend through env-driven base URLs first.

## How to wire `customer-web` and `admin-web`

### Guiding rule

Use the legacy backend as the system of record, but keep the new Nuxt server routes and BFF behavior where they improve:

1. cookie handling
2. session normalization
3. error normalization
4. frontend-safe proxying

### Customer web

For [apps/customer-web](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web):

1. point `NUXT_PUBLIC_API_BASE_URL` to the legacy backend
2. keep the Nuxt server proxy layer
3. keep the normalized error forwarding
4. adapt `packages/api-client` to the legacy endpoint shapes where needed

### Admin web

For [apps/admin-web](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/admin-web):

1. point its API base URL to the legacy backend
2. finish session restore/logout around the legacy admin auth endpoints
3. keep admin auth in same-origin server routes rather than direct browser-to-API token handling

## Integration strategy

### Preferred approach

Keep the new frontend server layer as the contract boundary.

That means:

1. browser -> Nuxt server routes
2. Nuxt server routes -> legacy backend
3. UI components depend on normalized frontend-facing payloads

### Why this matters

This lets us modernize:

1. session cookies
2. error shapes
3. redirect behavior
4. role/session normalization

without rewriting the backend immediately.

## What to keep from the current rebuilt backend

Keep these parts actively:

1. the current `customer-web` architecture
2. the current `admin-web` architecture
3. the shared UI system
4. the shared typed API client package
5. the safer cookie/session proxy patterns
6. the cleaned error forwarding helpers

Keep these as reference assets, not active delivery:

1. [apps/api](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api)
2. Mongo schema ideas
3. request model experiments
4. branch/member auth modeling work

## What to stop using as the primary path

Stop treating the rebuilt backend as the main implementation target for current roadmap delivery.

That means:

1. stop expanding `apps/api` as the main backend for product rollout
2. stop building new domain modules there unless they are exploratory
3. stop spending roadmap velocity on full backend parity from scratch

## What to keep only if useful later

The rebuilt backend still has value as:

1. a sandbox
2. a future replacement candidate
3. a source of improved auth/security ideas
4. a source of future extraction patterns

But it should no longer block product progress.

## Endpoint migration policy

For each feature, choose one of three modes:

### Mode 1: direct legacy use

Use the legacy backend endpoint as-is behind the Nuxt server layer.

Use this for:

1. auth
2. products
3. categories
4. cart
5. orders
6. wallet

### Mode 2: adapted legacy use

Use the legacy backend endpoint, but normalize the response or auth behavior in the BFF.

Use this for:

1. session handling
2. role mapping
3. request status display
4. admin auth/session flows

### Mode 3: future replacement

Keep using the legacy backend now, but plan to replace later only if needed.

Use this for:

1. branch/member management if legacy becomes too limiting
2. request/order lifecycle modules if we need cleaner contracts later
3. security-sensitive auth/session subsystems if the legacy model becomes a blocker

## Recommended rollout order after the pivot

### Phase 1

Import and run `legacy-api` inside the monorepo.

### Phase 2

Repoint:

1. `customer-web`
2. `admin-web`

to the legacy backend through env + BFF routes.

### Phase 3

Stabilize key user flows:

1. sign up
2. sign in
3. branch access
4. members
5. market
6. cart
7. requests
8. orders

### Phase 4

Only after the web apps are stable, decide which backend modules are worth replacing.

## Risks of this pivot

### Risk 1

Legacy backend quality issues come along for the ride.

Mitigation:

1. keep frontend BFF boundaries
2. normalize auth and errors there
3. patch the legacy backend only where necessary

### Risk 2

The team may keep accidentally building against both backends.

Mitigation:

1. declare `legacy-api` the active backend
2. mark `apps/api` as non-primary
3. document the rule clearly

### Risk 3

Legacy contracts may be inconsistent.

Mitigation:

1. centralize all HTTP access through `packages/api-client`
2. normalize in server routes where needed
3. do not let random components call backend endpoints directly

## Final recommendation

For the next stage of the project:

1. import the legacy backend into `apps/legacy-api`
2. make it the active backend service
3. continue rebuilding `customer-web` and `admin-web`
4. keep `apps/api` as a reference/sandbox, not the main delivery backend

This is the most practical path to:

1. smooth user migration
2. faster visible progress
3. lower platform risk
4. cleaner eventual backend replacement decisions

## Immediate next tasks

1. import `reference/gosource-api` to `apps/legacy-api`
2. rename package and remove nested `.git`
3. boot the legacy backend in the workspace
4. point `customer-web` to it first
5. validate auth, branches, members, market, and requests against the real legacy contracts
