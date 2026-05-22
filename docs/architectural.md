# GoSource Architecture

## Purpose

This document is the architecture contract for the new GoSource monorepo.
It is written to support a production-grade build of:

- `admin-web-app`
- `customer-web-app`
- `backend-api`

It is based on the product requirements in [`docs/PRD.md`](docs/PRD.md) and informed by the reference applications in `reference/gosource-api`, `reference/gosource-web-app`, and `reference/gosource-admin-v2`.

The reference apps are treated as patterns and context, not as the implementation source of truth. We are building the new platform from scratch with cleaner boundaries, stronger consistency, and production-ready operational controls.

## Executive Summary

GoSource is a B2B procurement and working-capital platform for SMBs.
The monorepo is intentionally simple:

- one customer web app
- one admin web app
- one backend API
- one worker process when async jobs need separation
- shared UI, tokens, types, and tooling in packages

The goal is to stay understandable while still being production-ready.

## Simple Explanation

If this is your first monorepo and your first backend for the web apps, the easiest way to think about this setup is:

- one repo holds everything
- one backend serves both web apps
- one shared UI system keeps the apps consistent
- one shared API contract keeps frontend and backend aligned

The goal is not to make the codebase fancy.
The goal is to make it easier to build, change, and maintain without duplicating work.

## What Each Part Is For

### `apps/customer-web`

This is the customer-facing app.
People from businesses will use it to:

- sign up and log in
- browse products
- add items to cart
- place orders or requests
- check wallet balance
- track orders
- request or view credit
- manage branches, members, and lists

### `apps/admin-web`

This is the internal operations app.
Your team will use it to:

- manage orders
- manage inventory and catalog items
- review businesses and customers
- handle credit applications
- manage promotions and coupons
- manage roles and settings
- view reports and analytics

### `apps/api`

This is the backend.
It is the source of truth for everything important.
It will:

- authenticate users
- store business and branch data
- manage products and inventory
- create and update orders and requests
- manage wallet and payment logic
- handle credit and repayment logic
- write audit records
- trigger notifications and jobs

### `apps/worker`

This is the background processor.
It runs tasks that should not block the user while they wait, such as:

- sending notifications
- retrying failed jobs
- generating invoices
- reconciling payments
- running scheduled tasks

If the first version does not need a separate worker process, we can still keep the folder ready and start by running jobs inside the API until separation becomes useful.

## Product Framing

GoSource is a B2B procurement and working-capital platform for SMBs.
The architecture must support:

- fast purchasing flows
- branch-aware ordering
- approval-based procurement
- auditable financial actions
- repeatable, idempotent workflows
- a single backend source of truth for both web apps

The PRD defines the domain priorities and must be the first reference when product or implementation decisions conflict.

## Architecture Principles

1. The API is the system of record.
2. Business logic lives in the backend, not in the web apps.
3. Financial state is append-only or strictly controlled through audit-safe mutations.
4. Every state transition that matters must be validated centrally.
5. Every money-related, status-related, or notification-related operation must be idempotent.
6. Every flow must be branch-aware and business-scoped from day one.
7. Shared code should be extracted into packages, not copied between apps.
8. The repo should favor clarity and maintainability over clever abstractions.
9. Domain modules should be isolated enough to evolve independently.
10. Production concerns such as observability, testing, and security are first-class, not afterthoughts.

## Monorepo Strategy

Use a single monorepo that contains all deployable applications and shared packages.
This keeps contracts aligned, reduces duplication, and makes it easier to share types, API clients, validation schemas, and UI primitives.

### Proposed Top-Level Layout

```text
/
├── apps/
│   ├── customer-web/
│   ├── admin-web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── types/
│   ├── eslint-config/
│   └── tsconfig/
│
├── docs/
├── infrastructure/
├── scripts/
├── pnpm-workspace.yaml
├── package.json
└── turbo.json
```

### Monorepo Tooling

Recommended baseline:

- `pnpm` workspaces for dependency management
- `Turborepo` for task orchestration and caching
- `TypeScript` everywhere
- `ESLint` and `Prettier` shared across the repo
- `Husky` and commit hooks for quality gates

Keep tooling simple at first.
We can still keep the setup small while using `Turborepo` from day one.

### What Each Folder Is For

- `apps/customer-web`: the customer-facing Nuxt app
- `apps/admin-web`: the internal admin Nuxt app
- `apps/api`: the NestJS backend that serves both apps
- `apps/worker`: background jobs and async work
- `packages/ui`: shared UI components and design system pieces
- `packages/shared`: shared design tokens, base CSS, and only the smallest truly common helpers
- `packages/types`: shared TypeScript types and contracts
- `packages/eslint-config`: shared lint rules
- `packages/tsconfig`: shared TypeScript config presets
- `docs`: PRD, architecture notes, and future decisions
- `infrastructure`: deployment and environment setup
- `scripts`: small helper scripts for development and maintenance

### How We Start

We should build this in small steps:

1. create the root workspace files
2. set up shared linting and TypeScript config
3. scaffold the `apps/` folders
4. scaffold the `packages/` folders
5. add the first app only after the workspace is stable

That keeps the project simple and avoids a lot of confusion early on.

## Stack Phases

The implementation order lives in [`docs/roadmap.md`](docs/roadmap.md).
Keep this document focused on structure, not sequencing.

## Deployable Units

### 1. `apps/customer-web`

Customer-facing Nuxt application for:

- onboarding
- market browsing
- cart and checkout
- requests and approvals
- wallet
- orders and tracking
- credit
- lists, branches, and members

### 2. `apps/admin-web`

Internal operations Nuxt application for:

- dashboard and analytics
- orders management
- inventory and catalog management
- customers and businesses
- credit operations
- promotions and discounts
- purchase orders
- roles, users, and settings
- reporting and exports

### 3. `apps/api`

Backend NestJS application that owns:

- authentication and authorization
- business and branch data
- catalog and inventory
- requests and orders
- wallet and payments
- credit and repayment logic
- accounting and ledger events
- notifications
- analytics and logs
- background jobs and automation

### 4. `apps/worker`

Background worker process for asynchronous processing such as:

- notifications
- payment reconciliation
- invoice generation
- stock synchronization
- scheduled jobs
- event retries
- low-priority data processing

The worker should share the same domain packages and queue contracts as the API.

## What We Are Not Doing Yet

To keep the first version manageable, we are intentionally postponing:

- backend service splitting beyond the main API and worker
- a dedicated API client package until the backend contracts stabilize
- large shared utility packages
- microservices
- overbuilt design-system abstraction
- domain packages that do not yet have real duplication

## Frontend Architecture

Both web apps should be built with:

- `Nuxt`
- `Vue 3`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn-vue` components
- a shared component system in `packages/ui`
- typed API access through a shared client later, if duplication justifies it

### Frontend Stack Summary

The frontend stack should stay close to what you asked for:

- `Nuxt 4` for the app framework
- `Tailwind v4` for styling
- `shadcn` for reusable UI building blocks
- `Pinia` for app state
- `VueUse` for utility composables

This gives us a good balance of speed, consistency, and maintainability without needing a heavyweight frontend architecture.

### Customer Web App

Customer UX should optimize for:

- speed
- clarity
- low-friction repeat purchasing
- branch context visibility
- trust and financial transparency

### Admin Web App

Admin UX should optimize for:

- dense information display
- filters and search
- tables and workflows
- operational confidence
- auditability

### Frontend Rules

1. Frontend code should not calculate authoritative financial state.
2. Frontend may format values, but backend decides the truth.
3. Pages should be thin; domain logic belongs in composables, stores, and API modules.
4. Shared UI primitives should be reused across both apps.
5. Route guards and UI states must reflect backend permissions, not replace them.

### Shared Frontend Patterns

- route middleware for auth and onboarding gating
- composables for data fetching and view state
- typed API access through a common client
- form validation using a shared schema strategy
- global session state in a lightweight store
- design tokens and theme variables shared across apps

## Backend Architecture

The backend should be a modular NestJS application organized by domain.
The module boundary should match business capability, not just technical layer.

### Backend Stack Summary

For the backend, we should keep the same disciplined shape used in `reference/daash-lab`, but simplify it for GoSource:

- `NestJS`
- `TypeScript`
- `PostgreSQL`
- `Drizzle`
- `Redis` for cache, locks, and queue support
- background jobs with `BullMQ`
- validation with DTOs and class-validator/class-transformer
- Swagger/OpenAPI for API documentation

That is a sensible backend direction for GoSource because it fits the transactional parts of the product, stays manageable for a first serious backend project, and gives us a cleaner path for migration work than the old MongoDB setup.

### Recommended Domain Modules

- `auth`
- `identity`
- `business`
- `branch`
- `employee`
- `catalog`
- `inventory`
- `cart`
- `request`
- `order`
- `wallet`
- `payment`
- `credit`
- `accounting`
- `promotion`
- `coupon`
- `notification`
- `analytics`
- `audit`
- `jobs`
- `admin`
- `integration`

### Module Structure

Each domain module should contain:

- controller
- service
- dto or schema
- repository or persistence adapter
- domain events
- guards or policies if needed
- tests

### Backend Design Rules

1. Keep controllers thin.
2. Put business rules in services or domain objects.
3. Publish events when a domain action needs side effects.
4. Use async jobs for work that does not need to block the request cycle.
5. Keep side effects out of transaction-like flows unless the operation is idempotent.
6. Never trust the frontend to enforce permissions or validity.

## Data Architecture

The data layer must reflect the need for transactional correctness and traceability.

### Suggested Storage Layers

- `PostgreSQL` for domain data, transactional records, and reporting-friendly relational data
- `Redis` for caching, locks, rate limiting, sessions, and queues
- object storage such as S3-compatible storage for invoices, receipts, and uploads
- optional search index later for product and request search at scale

### Data Rules

1. Ledger records must be immutable once written.
2. Status transitions must be validated centrally.
3. Financial writes must be idempotent.
4. Requests that can be retried must have explicit idempotency keys.
5. Derived read models should be rebuildable from the source data or events.
6. Critical workflow history should be audit-friendly and timestamped.

### Why This Matters

The PRD requires business, branch, request, order, wallet, and credit flows to remain stable under retries and delayed processing.
That is much easier to guarantee when the data model is intentionally designed, the status transitions are centralized, and write operations are protected with idempotency and audit logging.

## API Contract

The backend should expose versioned APIs, ideally under a stable prefix such as `/api/v1`.

### API Rules

1. Public contracts must be versioned.
2. Breaking changes require a new version.
3. Response shapes should be consistent across modules.
4. Validation should happen at the boundary.
5. Errors should be typed and understandable for both apps.

### Recommended Contract Assets

- OpenAPI/Swagger generated from the backend
- a shared typed API client for both web apps
- request/response DTOs shared where appropriate
- consistent pagination, filtering, and sorting conventions

## Identity and Access

Identity must support:

- business registration
- login/logout
- password reset
- OTP or verification
- invite-based onboarding
- role-based access control
- branch-scoped permissions

### Access Model

Use a combination of:

- authentication for identity
- authorization for role and permission checks
- business scope for tenant isolation
- branch scope for operational restrictions

The backend must always validate:

- who is acting
- which business they belong to
- which branch context applies
- whether the action is allowed for that role

## Workflow and State Management

GoSource includes workflows that can be interrupted, retried, and resumed.
Examples include:

- onboarding
- request approval
- order fulfillment
- payment confirmation
- credit review
- repayment tracking

### Workflow Rules

1. Every state machine must have explicit allowed transitions.
2. Invalid transitions should fail fast.
3. Long-running steps should be broken into asynchronous jobs where appropriate.
4. Any external callback must be treated as unreliable and deduplicated.
5. Reprocessing should be safe.

## Notifications and Integrations

External systems and notifications should be isolated behind integration adapters.

Examples:

- SMS/OTP provider
- email provider
- payment provider
- file storage provider
- Slack or internal alerting

### Integration Rules

1. Never let third-party APIs dictate core business state.
2. Always store the internal domain event first when possible.
3. External side effects should be retried through a queue or job system.
4. Webhooks must be verified and deduplicated.

## Background Jobs

Use background jobs for:

- emails and SMS
- payment reconciliation
- delayed state transitions
- analytics aggregation
- document generation
- retry handling
- export generation

### Job Rules

1. Jobs should be idempotent.
2. Jobs should be observable and retryable.
3. Failed jobs should be quarantined or dead-lettered.
4. Job payloads should be small and stable.

## Observability

Production software must be observable by default.

### Required Signals

- structured application logs
- request correlation IDs
- error tracking
- metrics for latency, error rate, and queue depth
- audit logs for sensitive actions
- job execution visibility

### Operational Visibility

The team should be able to answer:

- who did what
- when it happened
- what the system believed at the time
- whether a workflow was retried
- whether a payment or status change was duplicated

## Security

### Baseline Security Controls

- secure password hashing
- signed tokens or session management
- refresh token rotation if JWT is used
- CSRF protection where relevant
- request validation and sanitization
- rate limiting on public endpoints
- helmet and security headers
- file upload restrictions
- least-privilege service credentials

### Security Rules

1. Never expose secrets in frontend code.
2. Never trust client-side checks for authorization.
3. Store and rotate secrets through environment management.
4. Treat webhooks and callbacks as untrusted input.
5. Sanitize all user-controlled data before persistence or rendering.

## Testing Strategy

### Backend

- unit tests for domain rules
- integration tests for persistence and services
- e2e tests for core workflows
- contract tests for API shape
- job tests for retries and idempotency

### Frontend

- component tests for shared UI
- composable and store tests
- e2e tests for onboarding, ordering, and admin workflows
- visual QA for critical screens if needed

### Test Priority

The first tests should cover:

- auth
- onboarding
- request approval
- order creation
- wallet funding
- credit application
- inventory status updates

## CI/CD

The repo should use a pipeline that runs:

1. install and cache dependencies
2. lint
3. type-check
4. unit tests
5. integration tests
6. build all apps
7. run e2e smoke tests where feasible
8. publish deployable artifacts

### Deployment Units

Deploy each app independently:

- customer web app
- admin web app
- backend API
- background worker

This allows independent scaling and safer releases.

## Environment Model

Recommended environments:

- local
- development
- staging
- production

Each environment should have its own:

- database
- cache
- queue
- storage bucket
- third-party credentials
- feature flags

## Documentation and Governance

### Required Documents

- `docs/PRD.md`
- `architectural.md`
- API documentation generated from code
- ADRs for major decisions
- runbooks for deployments and incidents

### Governance Rules

1. Update the architecture doc when a foundational decision changes.
2. Capture important tradeoffs in ADRs.
3. Keep the PRD and architecture aligned.
4. Avoid silent drift between the reference apps and the new monorepo.

## Recommended Build Order

1. Scaffold the monorepo and workspace tooling.
2. Establish shared config, linting, and TypeScript setup.
3. Build the backend foundation: auth, business, branch, and audit.
4. Build the shared API client and shared UI package.
5. Build customer onboarding and market browsing.
6. Build admin authentication, dashboard, and order management.
7. Add requests, wallet, and credit workflows.
8. Add background jobs, notifications, analytics, and exports.
9. Harden observability, security, and test coverage.

## Keep It Practical

Because this is your first monorepo and first backend for these apps, we should avoid these common traps:

- splitting the backend into microservices too early
- creating too many shared packages before we know we need them
- abstracting every domain rule on day one
- introducing multiple data stores without a clear reason
- building a complex event system before the core flows work

The first version should be understandable by one developer, even if that developer is new to monorepos.

## Non-Goals For The First Pass

- microservices
- event-driven distributed architecture beyond the core queue/jobs layer
- multi-region active-active deployment
- overly generic plugin systems
- premature abstraction of domain modules

Start as a well-structured modular monolith with clear boundaries, then split only when scale or team size demands it.

## Definition Of Done For The Architecture

This architecture is ready when:

- the repo structure is agreed
- the shared packages are defined
- the backend module boundaries are named
- the data and workflow rules are explicit
- the deployable units are clear
- the testing and observability baseline is documented

That gives us a production-grade foundation without overengineering the first release.
