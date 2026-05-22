# GoSource Roadmap

This roadmap keeps the build order simple and incremental.

## Phase 1 — Workspace Foundation

Goal:
- set up the monorepo shell
- get tooling consistent
- keep the repo easy to work in

Includes:
- `pnpm`
- `Turborepo`
- TypeScript
- ESLint
- Prettier
- workspace scripts and folder structure

## Phase 2 — Frontend Foundation

Goal:
- get both Nuxt apps booting
- establish the shared visual system
- keep frontend structure consistent

Includes:
- `Nuxt 4`
- `Vue 3`
- `Tailwind CSS v4`
- `shadcn-vue`
- `Pinia`
- `VueUse`
- shared UI components
- shared design tokens

## Phase 3 — Backend Foundation

Goal:
- build the backend base cleanly
- store data safely
- support background work

Includes:
- `NestJS`
- `PostgreSQL`
- `Drizzle`
- `Redis`
- `BullMQ`

## Phase 4 — Drizzle Port

Goal:
- switch the backend data layer to the Daash-style Drizzle setup before real product flows

Includes:
- replace Prisma with Drizzle ORM
- wire `drizzle-kit` migrations
- convert the existing baseline model
- keep the API behavior stable during the swap
- verify build and typecheck after the port

## Phase 5 — Shared Contracts

Goal:
- reduce duplication between frontend and backend
- keep data shapes aligned

Includes:
- `packages/types`
- small shared helpers only where needed
- shared client abstractions only if duplication makes them worth it

## Phase 6 — Product Features

Goal:
- build the actual GoSource flows
- keep the first release focused

Includes:
- customer authentication first
- customer onboarding first
- admin authentication next
- employee invite acceptance
- branch onboarding
- catalog
- cart
- orders
- inventory
- admin dashboard

## Roadmap Rules

- Finish the current phase before starting the next one.
- Do not add infrastructure early just because it sounds useful.
- Build the smallest complete step first.
- Keep docs updated when phases change.
