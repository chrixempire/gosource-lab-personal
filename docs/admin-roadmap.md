# Admin Implementation Roadmap

This roadmap uses `reference/gosource-admin-v2` and `reference/gosource-api` as the target shape for the admin experience and backend surface.

Implement in `apps/admin-web`; treat `apps/legacy-api/src/admin` as the operational API contract today (`legacy-api` and `reference/gosource-api` admin modules match). New auth/session work lands in `apps/api` first; other modules proxy `legacy-api` until migrated.

## Reference alignment

Phases and build order match the reference apps. Paths below are the **actual** reference routes—use them when wiring BFF proxies or reading `gosource-admin-v2` (`lib/constants.ts` → `QUERY_PATHS` / `PAGE_ROUTE`).

### Auth (Phase 1)

| Roadmap (generic) | Reference API | Notes |
|-------------------|---------------|--------|
| `GET /admin/auth/me` | `GET /admin/admin/profile` | Current signed-in admin |
| `POST /admin/auth/logout` | *(none)* | Client clears token; no server logout route |
| invite / set password | `PATCH /admin/auth/complete-admin-signup` | After invite token |
| invite admin | `POST /admin/auth/register` | Super-admin only |
| resend invite | `POST /admin/auth/resend-invite` | |

Password reset: `POST /admin/auth/initiate-password-reset`, `POST /admin/auth/verify-otp`, `POST /admin/auth/complete-password-reset`. Login: `POST /admin/auth/login`.

### Dashboard (Phase 2)

- **API:** `GET /admin/admin/stats`, `GET /admin/activity`
- **UI:** Reference `pages/index.vue` is still a placeholder; stat cards / activity on `/` are **net-new** in `admin-web`, not a copy-paste from admin-v2.

### Orders (Phase 3)

- List/filter: `GET /admin/order/filtered` (and `GET /admin/order`)
- Detail / status: `GET /admin/order/:id`, `PATCH /admin/order/:id/update-order-status`, cancel/update actions on same controller
- Invoices (if needed): `admin/invoice` (separate from order detail)

### Inventory (Phases 4–5)

| UI (admin-v2) | API prefix |
|---------------|------------|
| Item list → `/inventory` (not `inventory/items/index`) | `admin/product` (primary), `admin/item` (some ops) |
| `inventory/items/create`, `inventory/items/[id]` | `admin/product` |
| `inventory/category/index` | `admin/category` |
| `inventory/purchase-orders/*` | `admin/purchaseorder` |
| `inventory/items/store-count` | `admin/product` (stock-count) |
| Extra in reference: `inventory/items/inventory-report` | `admin/product` (reports / movement) |

### Discounts vs coupons (Phase 8)

- **UI routes:** `/discounts/*`
- **API:** `admin/coupon` (not `admin/discount`)

### Settings (Phase 10)

Reference also includes:

- `settings/fees-charges` → `admin/system-config` (fees/charges)
- `settings/roles-permissions/[roleId]/edit`
- `settings/roles-permissions/[roleId]/users`

Roles: `admin/role` (+ `GET admin/role/permissions`). Admins: `admin/admin` (list, search, profile, change-password).

### In reference, not phased here

- **Messaging** — nav stub in admin-v2, no route yet
- **Invoice** module — `admin/invoice` (partially covered under orders)

### Monorepo status (snapshot)

| Area | Reference | This repo |
|------|-----------|-----------|
| Admin UI | `gosource-admin-v2` | `apps/admin-web` — auth shell + stub home |
| Auth API | `gosource-api` | `apps/api` — login only so far |
| Operations API | `gosource-api` | `apps/legacy-api` — full admin surface |

## Phase 0: Foundation

Goal: make `admin-web` and the admin backend safe to build on.

### Frontend

- auth-aware app shell
- route middleware
- protected layout
- guest layout
- shared page header
- shared table/filter/search primitives
- shared modal/drawer patterns
- shared empty/loading/error states
- session composable/store

### Backend

- admin auth module baseline
- auth guard / token verification
- current-admin endpoint (`GET /admin/admin/profile` in reference; implement in `apps/api` or proxy legacy)
- consistent admin response shapes
- role/permission payload in admin session
- admin error handling conventions

### Deliverable

- admin app can boot, protect routes, restore session, and support real modules

## Phase 1: Auth

Goal: complete admin authentication flows first.

### Frontend pages

1. `auth/sign-in`
2. `auth/reset-password`
3. `auth/setup-profile`

### Frontend work

- sign in form
- forgot password flow
- OTP verify flow
- reset password flow
- invited admin setup flow
- logout
- session restore on refresh
- auth redirect logic

### Backend work

- `POST /admin/auth/login`
- `GET /admin/admin/profile` (session / current admin; reference—not `/admin/auth/me`)
- `POST /admin/auth/initiate-password-reset`
- `POST /admin/auth/verify-otp`
- `POST /admin/auth/complete-password-reset`
- `PATCH /admin/auth/complete-admin-signup` (invited admin set password)
- `POST /admin/auth/register` (invite admin), `POST /admin/auth/resend-invite`
- client-side logout (no reference logout endpoint)

### Deliverable

- admin can sign in, recover password, and complete invite setup

## Phase 2: Admin Shell + Dashboard

Goal: build the real app frame and first landing surface.

### Frontend pages

1. `/`
2. layout/sidebar/topbar

### Frontend work

- nav from reference sections
- dashboard stat cards
- recent activity section
- quick links
- responsive admin shell
- permission-aware nav hiding

### Backend work

- `GET /admin/admin/stats` (dashboard summary)
- `GET /admin/activity` (recent activity; permission-gated)
- `GET /admin/admin/profile` if not already wired in Phase 1

### Deliverable

- real admin home page with live summary data

## Phase 3: Orders

Goal: first full operational module.

### Frontend pages

1. `orders/index`
2. `orders/[id]`

### Frontend work

- orders table
- search
- status/date filters
- pagination
- row actions
- order details view
- order timeline/activity
- payment/delivery summary
- invoice/download hooks if supported
- status update actions

### Backend work

- `GET /admin/order/filtered`, `GET /admin/order` (list)
- `GET /admin/order/:id` (detail)
- update status, cancel, payment/product patches on `admin/order`
- `admin/invoice` if invoice create/list is in scope

### Deliverable

- admin can manage order lifecycle end to end

## Phase 4: Inventory Core

Goal: product and category management.

### Frontend pages

1. `inventory/index` (item list; reference uses this path, not `inventory/items/index`)
2. `inventory/items/create`
3. `inventory/items/[id]`
4. `inventory/category/index`
5. *(optional)* `inventory/items/inventory-report` (exists in reference)

### Frontend work

- item list table
- create/edit item form
- item detail page
- category list
- category create/edit
- stock display
- product media handling
- filters by category/status

### Backend work

- `admin/product` — list/create/update, media, stock fields
- `admin/category` — list/create/update
- `admin/item` — supplementary item ops where reference uses it

### Deliverable

- admin can manage product catalog and categories

## Phase 5: Purchase Orders + Store Count

Goal: stock operations after inventory core exists.

### Frontend pages

1. `inventory/purchase-orders/index`
2. `inventory/purchase-orders/create`
3. `inventory/purchase-orders/[id]`
4. `inventory/items/store-count`

### Frontend work

- purchase order list
- create purchase order form
- purchase order details
- receiving flow
- store count form/workflow
- stock reconciliation UI
- count history if supported

### Backend work

- `admin/purchaseorder` — list, create, get, receive/update
- `admin/product` — store count, stock history / movement (see stock-count + report paths)

### Deliverable

- admin can manage inbound stock and stock count workflows

## Phase 6: Customers

Goal: customer/business visibility.

### Frontend pages

1. `customers/index`
2. `customers/[id]`

### Frontend work

- customers table
- customer search/filter
- customer details page
- branch summary
- order history section
- wallet summary section
- credit summary section
- status/metadata display

### Backend work

- list customers
- get customer details
- customer branches endpoint
- customer orders endpoint
- customer wallet summary endpoint
- customer credit summary endpoint

### Deliverable

- admin can inspect customer accounts and business activity

## Phase 7: Credit

Goal: full credit operations.

### Frontend pages

1. `credit/analytics/index`
2. `credit/application/index`
3. `credit/application/[id]`
4. `credit/request/index`
5. `credit/request/[id]`
6. `credit/repayment/index`

### Frontend work

- analytics dashboard
- application list/detail
- request list/detail
- repayment list
- approval/rejection actions
- risk/review sections
- filters by status/date/customer

### Backend work

- credit analytics endpoint
- list/get credit applications
- approve/reject/review actions
- list/get credit requests
- repayments list/history
- customer credit summary hooks

### Deliverable

- admin credit team can work entirely from the app

## Phase 8: Discounts

Goal: manage discount structures.

### Frontend pages

1. `discounts/index`
2. `discounts/[slug]/index`
3. `discounts/[slug]/[id]`

### Frontend work

- discount group list
- discount detail pages
- create/edit discount setup
- status activation/deactivation
- usage/eligibility display

### Backend work

- `admin/coupon` — list, get, create/update, activate/deactivate (UI is “discounts”)

### Deliverable

- admin can manage discount programs

## Phase 9: Promotions

Goal: campaign and promo management.

### Frontend pages

1. `promotions/index`
2. `promotions/create`
3. `promotions/[id]`

### Frontend work

- promotions list
- create/edit promotion form
- product targeting
- activation windows
- promo details
- promo status controls

### Backend work

- `admin/promotion` — list, create, update, get, enable/disable, product targeting

### Deliverable

- admin can run product promotions and campaigns

## Phase 10: Settings

Goal: admin self-service and system configuration.

### Frontend pages

1. `settings/index`
2. `settings/users`
3. `settings/security`
4. `settings/fees-charges`
5. `settings/roles-permissions/index`
6. `settings/roles-permissions/create`
7. `settings/roles-permissions/[roleId]/edit`
8. `settings/roles-permissions/[roleId]/users`

### Frontend work

- admin users list
- invite/create admin user
- role list
- create/edit roles
- permissions matrix
- profile/security settings
- system settings forms
- fees/charges config if available

### Backend work

- `admin/admin` — list, search, profile, `PATCH change-password`
- invite: `POST /admin/auth/register`, `POST /admin/auth/resend-invite`
- `admin/role` — CRUD, `GET /admin/role/permissions`
- `admin/system-config` — fees/charges and system settings

### Deliverable

- admin org can manage its own operators and settings

## Recommended Build Order

### Milestone A

- Phase 0
- Phase 1

### Milestone B

- Phase 2
- Phase 3

### Milestone C

- Phase 4
- Phase 5

### Milestone D

- Phase 6
- Phase 7

### Milestone E

- Phase 8
- Phase 9
- Phase 10

## Backend Strategy

- use `apps/api` for auth/session/permissions
- for operational modules, compare each reference surface against what already exists in our repo
- if the module already exists cleanly in `legacy-api`, proxy it first
- only migrate into `apps/api` when we are ready, module by module

So:

- auth: `apps/api`
- everything else: decide per module based on current repo reality, not ideology

## First Real Implementation Slice

If we are starting now, the first delivery chunk should be:

1. Phase 0 foundation
2. Phase 1 auth
3. Phase 2 shell/dashboard
4. Phase 3 orders

That gives us a working admin app people can actually log into and use.
