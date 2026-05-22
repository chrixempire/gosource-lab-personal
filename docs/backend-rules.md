# GoSource Backend Rules

> Scope: `apps/api/`, `apps/worker/`, and future backend modules

These rules keep the backend safe, testable, and production-ready.

## Core Rules

- The backend is the source of truth for business rules.
- Controllers should stay thin.
- Services should contain business logic.
- Repositories should only handle data access.
- Background work should be handled by the worker or an async job layer.
- Money-related writes must be idempotent and transaction-safe.

## Data Rules

- Use PostgreSQL for transactional and relational data.
- Model financial and workflow state so it can be audited.
- Prefer explicit constraints over implicit app-only checks.
- Validate critical state transitions centrally.
- Never trust the frontend to enforce permissions or correctness.

## Service Rules

- Organize NestJS modules by business capability, not technical layer.
- Keep domain boundaries clear.
- Use DTOs or schemas at the edge.
- Keep persistence adapters separate from core service logic.
- Emit events for side effects instead of scattering them around the codebase.

## Idempotency Rules

- All mutating endpoints should support idempotent handling.
- Key any retriable write with a stable idempotency identifier.
- Do not create duplicate records when a request is retried.
- Make it safe for clients and workers to retry failures.

## Event Rules

- Use durable events for cross-domain work.
- Prefer an outbox-style flow for database-backed events.
- Do not call external event systems in a way that can lose writes.
- Keep async work out of the request path when possible.

## Observability Rules

- Add request logging early.
- Keep trace/correlation IDs attached to backend work.
- Make health and readiness checks meaningful.
- Capture errors in a way that helps debugging, not just alerting.

## Security Rules

- Secrets stay on the server.
- Auth logic should live in the backend, not the UI.
- Multi-tenancy must be enforced at the data or request boundary.
- Do not expose internal service details to the browser.

## What Not To Do

- Do not put business rules in controllers.
- Do not let services read another service’s database.
- Do not make side effects depend on best-effort in-memory events.
- Do not add a new backend package or service unless the boundary is real.
- Do not optimize for abstraction before correctness.

