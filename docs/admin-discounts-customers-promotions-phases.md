# Admin web: Discounts, Customers, Promotions

Phased rollout mirroring `gosource-admin-v2` + legacy API (BFF only in `admin-web`; **no legacy-api schema changes**).

## Phase 1 — Discounts (`/discounts`) ✅ Implemented in admin-web

| Area | Features |
|------|----------|
| **List** | Stat cards (all / active / inactive / expired / deactivated / used), SearchField (code), filters (discount type, created date, expiry date), table + card toggle, checkboxes, pagination |
| **Actions** | Copy code, edit, activate, deactivate, delete (where allowed by status) |
| **Create** | Type picker → 4 flows: amount off category, amount off items, amount off order, free delivery |
| **Form fields** | Code, fixed/percentage amount, category or products, min order (order/free delivery), usage limit, target (all/new/old), start/end date+time, expiry toggle |
| **API** | `GET/POST /admin/coupon`, `GET/PATCH/DELETE /admin/coupon/:id`, `PATCH .../activate`, `PATCH .../deactivate` |

## Phase 2 — Customers (`/customers`) ✅ Implemented in admin-web

| Area | Features |
|------|----------|
| **List** | Stat cards, search, filters (status, account type, date), table/cards, checkboxes, CSV export |
| **Row actions** | View details, enable/disable credit |
| **Detail** | Profile, wallet (top-up/withdraw/stats), orders tab, credit tab, branches tab (deactivate, HQ) |
| **API** | `GET /admin/customer`, `GET :id`, transactions, orders, credit, branches, `PATCH enable-credit/disable-credit`, `POST :id/reset-password`, `PATCH :id/activate|deactivate`, `DELETE :id` |

## Phase 3 — Promotions (`/promotions`) ✅ Implemented in admin-web

| Area | Features |
|------|----------|
| **List** | Stat cards + usage, search, date/status filters, table/cards, checkboxes |
| **Actions** | Create, edit, duplicate, activate, deactivate, delete |
| **Form** | Name, description, discount %, product line items, schedule |
| **API** | `GET/POST /admin/promotion`, `GET/PATCH/DELETE :id`, `POST :id/duplicate`, activate/deactivate |
