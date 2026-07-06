# Global Admin Activity Log — Implementation Plan

> Goal: one place that records **every state-changing action** taken in admin-web —
> who did it, what changed (old → new), on which record, from where, and when —
> across all modules, with the same rich detail the inventory log already has.

Branch: `feat/global-admin-activity-log` (based off `feat/inventory-activity-log`,
which carries the activity-log foundation + latest `dev`).

---

## 1. Scope

**Captured (actions only):**
- Auth: login, logout, **failed login** (security-relevant)
- Products: create, update, delete, activate/deactivate, in-stock/out-of-stock, stock add/deduct, stock count
- Categories: create, update, delete
- Purchase orders: create, update, receive, etc.
- Orders: status change, payment-status change, cancel, add/edit items, fees
- Customers: create, update, credit-related actions
- Credit: approve, reject, repayment actions
- Messages: send
- Coupons / promotions: create, update, delete
- Admins & roles: create, update, delete, role/permission changes
- …and any future mutating endpoint (auto-covered by the interceptor)

**Not captured:** page/record views (GETs), browsing, searching, filtering, and
sensitive payload contents (passwords, full payment details).

---

## 2. The richness standard (model = current inventory logs)

Inventory already logs **field-level before→after detail**. Every other module
must match this. Pattern:

```js
changes['market price']           = { old: 2000, new: 2500 }
changes['pieces (selling price)'] = { old: 3000, new: 3200 }
description = "Updated Pasture: market price, pieces (selling price)"
metadata    = { changes, priceChange: true }
```

Specific transitions carry the exact change:
```
out of stock → metadata { field: 'inStock', old: true,  new: false }
deactivate   → metadata { field: 'active',  old: true,  new: false }
add batch    → "Add batch product … Unit Price: 2500. Remaining 80"
```

### Shared helper (new)
Factor the inventory diff logic into a reusable helper so all modules log in one
consistent shape and the UI renders them uniformly:

```ts
// apps/legacy-api/src/utils/activity-changes.util.ts
buildChanges(before, after, fields): Record<string, { old, new }>
// + description builder: "Updated <name>: <changed field labels>"
```

`metadata.changes` is the canonical place for the diff; `priceChange: true` (and
similar flags) stay for filtering.

---

## 3. Per-module detail to capture

| Module | Description example | metadata.changes |
|---|---|---|
| Customers | "Updated Acme Ltd: phone, address" | `{ phone:{old,new}, address:{old,new} }` |
| Orders | "Order #1234 status: Pending → Delivered" | `{ status:{old,new} }`, payment from→to, items add/remove |
| Credit | "Approved credit for Acme — limit ₦500k" | `{ status:{old,new}, limit:{old,new} }` |
| Coupons | "Updated SAVE10: value 5% → 10%" | `{ value:{old,new}, expiry:{old,new} }` |
| Admins/roles | "Changed Jane's role: Staff → Manager" | `{ role:{old,new} }`, permission diffs |
| Messages | "Sent message to <segment> — subject: …" | `{ recipients, subject }` |
| Auth | "Logged in" / "Logged out" / "Failed login" | `{ }` + ipAddress |

---

## 4. Backend design

### 4a. Explicit rich logging (primary, for meaningful actions)
Each meaningful mutation calls the activity service with a computed diff +
description, exactly like inventory does now. Uses the shared `buildChanges`
helper. This is where the quality detail comes from.

### 4b. Global interceptor (safety net, for breadth)
`AdminActivityInterceptor`, registered app-wide:
- Fires only on `POST/PATCH/PUT/DELETE` **after** a successful response (no views).
- Derives `module` from the route, `action` from the HTTP method (+ a route→action
  map for `/activate`, `/in-stock`, etc.), `initiator` from `req.user`,
  `ipAddress` from the request.
- Writes a fallback log ("Updated <module> <id>", request body summary in
  metadata) for any endpoint **not** already logged explicitly.
- **De-dup:** handlers that log explicitly are marked with a `@SkipActivityLog()`
  decorator so we never get two entries for one action.
- Fire-and-forget + try/catch — a logging failure can never break the request.

### 4c. Auth
Explicit logs in `auth.service.login` (success + failure) and the logout path —
`action: LOGIN | LOGOUT`, with IP.

### 4d. Action vocabulary
Extend `ACTIVITY_LOG_ACTION_TYPE` with: `ACTIVATE`, `DEACTIVATE`, `STOCK_IN`,
`STOCK_OUT`, `LOGIN_FAILED` (alongside CREATE/UPDATE/DELETE/LOGIN/LOGOUT/OTHERS),
and add to `FilterActivityDto` so they're filterable.

### 4e. Data model
No structural change needed — `ActivityLog` already has description, objectId,
initiator (+name/role), initiatorType, module, action, ipAddress, metadata,
timestamps. Add **indexes** (`createdAt`, `module`, `action`, `initiator`) and an
optional **TTL** (default proposal: 12 months) since the global log grows fast.

---

## 5. Frontend (Option B — both pages)

- **Standalone global page** `pages/activity-log.vue` at route `/activity-log`
  (re-enable the already-stubbed `ACTIVITY_LOG: '/activity-log'`), with a
  **top-level sidebar entry**. Shows **all modules**, with filters: module,
  action, admin (initiator), IP, date range, search.
- **Inventory-scoped view** stays at `/inventory/activity-log`, pre-filtered to
  `module ∈ {Product, Category, PurchaseOrder}` — a convenience view of the same
  data. (Note: the standalone page is a superset and also shows inventory rows.)
- Both reuse the existing generic components: `ActivityLogTable`,
  `ActivityLogFilterBar`, `ActivityLogDetailPanel`. The detail panel renders
  `metadata.changes` as an old → new table.
- Proxy `server/api/activity/index.get.ts` already forwards all filters.

---

## 6. Risks & mitigations
- **Volume / retention** — indexes + TTL; list is paginated.
- **Performance** — writes are async / fire-and-forget; never block the action.
- **Duplicates** — `@SkipActivityLog()` on explicitly-logged handlers.
- **Sensitive data** — never put passwords / full payment data in metadata.
- **Initiator availability** — interceptor runs after auth guards so `req.user` is set.
- Admin-web actions only (customer-web is out of scope, by design).

---

## 7. Rollout
- **Phase 1:** shared `buildChanges` helper · interceptor + `@SkipActivityLog` ·
  action-enum extension · login/logout/failed-login · standalone page + nav +
  keep inventory view. → broad coverage with rich detail on the high-value modules.
- **Phase 2:** enrich remaining modules' descriptions/diffs to the inventory bar.

---

## 8. Open items (defaults chosen; confirm or override)
1. **Failed actions** — capture failed logins (default: yes). Permission-denied
   actions: optional (default: no).
2. **Retention TTL** — default 12 months. Keep forever instead?
3. **Action enum additions** — ACTIVATE/DEACTIVATE/STOCK_IN/STOCK_OUT/LOGIN_FAILED
   (default: add, for precise filtering).
