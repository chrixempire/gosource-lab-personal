# GoSource Frontend Rules

> Scope: `apps/customer-web/app/` and `apps/admin-web/app/`

These rules keep both Nuxt apps simple, consistent, and easy to maintain.

## Core Rules

- The browser should talk to the Nuxt server/BFF, not directly to backend services.
- Pages should stay thin and mostly route data into composables or components.
- Components should be presentational unless there is a very good reason otherwise.
- Composables own reactive orchestration and local view logic.
- Services own HTTP calls.
- Mappers convert API data into UI-friendly shapes.
- Shared UI should come from `packages/ui`, not duplicated inside each app.

## Data Flow

Use this order:

`page -> composable -> service -> mapper -> API/BFF -> types`

Rules:

- Use `useAsyncData` for SSR or initial page data.
- Use `useFetch` only when it fits Nuxt’s data layer and the request is still app-local.
- Keep raw `$fetch` inside service files only.
- Do not call backend URLs directly from components or pages.
- Do not let components know about transport details.

## Component Rules

- Components receive props and emit events.
- Components should not fetch data directly.
- Components should not know business rules.
- Components should not own global state.
- Reusable UI belongs in `packages/ui`.
- Page-specific composition belongs in the app.

## State Rules

- Use Pinia only for truly global state.
- Keep most state in composables.
- Keep auth/session state in a small, explicit store.
- Keep branch, tenant, and user context easy to trace.

## Styling Rules

- Both apps must share the same brand system.
- Use the shared design tokens and global styles.
- Avoid arbitrary Tailwind values unless there is no good token for the case.
- Keep layouts calm, readable, and operational.
- Buttons, inputs, and common controls should come from the shared UI package.

## App Boundaries

### `apps/customer-web`

- Customer browsing
- Cart and checkout
- Branch-aware flows
- Orders and tracking
- Account and profile flows

### `apps/admin-web`

- Operational dashboards
- Catalog and inventory management
- Order management
- Customer and business management
- Reporting and settings

## What Not To Do

- Do not put business logic in the frontend.
- Do not let the client call the backend directly.
- Do not duplicate the same component patterns in both apps.
- Do not introduce new shared packages just to avoid a small amount of duplication.
- Do not overbuild the UI abstraction before the product needs it.

