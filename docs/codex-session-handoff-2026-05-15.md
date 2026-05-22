# Codex Session Handoff

Date: 2026-05-15  
Workspace: `/Users/acumenspare/Documents/codebase/personal/gosource-lab`

## Purpose

This file is a continuation handoff for a long Codex pairing session across:

1. `apps/customer-web`
2. `apps/legacy-api`
3. the imported legacy reference apps

It is meant to let a new Codex session resume quickly on another computer.

Important note:

- This is not a byte-for-byte raw transcript export.
- It is a high-fidelity Markdown reconstruction of the work, decisions, bugs, fixes, and next steps from the session.
- It preserves the important technical context needed to continue safely.

---

## High-level Goal

We are migrating the web experience to use the imported legacy backend instead of forcing everything through the rebuilt backend.

Main direction:

1. keep `apps/legacy-api` as the migration baseline
2. adapt `apps/customer-web` through proxy/normalization
3. avoid risky data-model changes in the legacy backend

---

## Core Architecture Decision

We explicitly agreed on this rule:

1. no more schema/entity/model changes in `apps/legacy-api`
2. avoid controller/service changes there unless absolutely necessary
3. all compatibility shaping should happen in `apps/customer-web`

Why:

1. safer migration
2. lower data risk
3. legacy backend stays close to original behavior
4. frontend can still reshape routes and responses as needed

This means future work should prefer:

- [apps/customer-web/server/api/proxy/[...path].ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/proxy/[...path].ts)
- [apps/customer-web/server/utils/legacy-resource-compat.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/legacy-resource-compat.ts)
- server auth/session routes in `apps/customer-web`

over editing legacy controllers/services.

---

## Legacy API Audit Result

We audited `apps/legacy-api` against the imported reference.

Findings:

1. no schema files were modified
2. no entity/model files were modified
3. no collection names were changed
4. no persisted Mongo document shapes were changed

Meaning:

- data migration risk from the code changes made so far is low

The touched legacy files were mostly:

1. runtime/build fixes
2. local-dev survivability fixes
3. small branch/member compatibility response changes

Examples of touched legacy files:

- [apps/legacy-api/package.json](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/package.json)
- [apps/legacy-api/tsconfig.json](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/tsconfig.json)
- [apps/legacy-api/src/slack/slack.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/src/slack/slack.service.ts)
- [apps/legacy-api/src/branch/branch.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/src/branch/branch.service.ts)
- [apps/legacy-api/src/employee/employee.controller.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/src/employee/employee.controller.ts)
- [apps/legacy-api/src/employee/employee.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/legacy-api/src/employee/employee.service.ts)

---

## Legacy Backend Boot Notes

Main setup path used during this session:

1. install and run Redis locally
2. configure `apps/legacy-api/.env`
3. point `DB_URL` at the real legacy Mongo URI
4. run `pnpm --filter @gosource/legacy-api dev`

Important lessons from booting:

1. Redis is required
2. a missing local Mongo at `127.0.0.1:27017` causes the Mongoose retry loop
3. Slack webhook config originally crashed boot and was made optional for local development
4. `@gosource/api` was not the target backend for this migration slice

The active stack for testing became:

1. `@gosource/legacy-api`
2. `@gosource/customer-web`

Not:

3. `@gosource/api`

---

## Auth Integration Summary

Auth was wired so `customer-web` can talk to the legacy backend while keeping the newer frontend contract.

Key files:

- [apps/customer-web/server/utils/customer-api-mode.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/customer-api-mode.ts)
- [apps/customer-web/server/utils/legacy-customer-auth.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/legacy-customer-auth.ts)
- [apps/customer-web/server/utils/customer-auth-session.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/customer-auth-session.ts)
- [apps/customer-web/server/api/auth/session/login.post.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/auth/session/login.post.ts)
- [apps/customer-web/server/api/auth/session/me.get.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/auth/session/me.get.ts)
- [apps/customer-web/server/api/auth/session/logout.post.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/auth/session/logout.post.ts)
- [apps/customer-web/server/api/auth/signup.post.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/auth/signup.post.ts)
- [apps/customer-web/server/api/auth/verify-password-otp.post.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/auth/verify-password-otp.post.ts)

Notable auth fixes:

1. signup response normalization for the frontend
2. OTP length support:
   - legacy mode uses 4 digits
   - modern mode uses 6 digits
3. password-reset OTP verify maps `token` to legacy `otp`
4. employee setup route now points to the correct legacy-aware backend
5. `/api/auth/session/me` refreshes profile data for legacy sessions instead of relying only on stale snapshot cookies
6. session restore calls were skipped on public auth pages to avoid noisy 401s

---

## Branches Integration Summary

Branches were wired through the compatibility proxy.

Supported flows:

1. list branches
2. branch details
3. create branch
4. update branch
5. activate branch
6. deactivate branch
7. delete branch

Key files:

- [apps/customer-web/app/services/branch.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/services/branch.service.ts)
- [apps/customer-web/server/api/proxy/[...path].ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/api/proxy/[...path].ts)
- [apps/customer-web/server/utils/legacy-resource-compat.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/legacy-resource-compat.ts)
- [apps/customer-web/app/pages/branches/index.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/branches/index.vue)
- [apps/customer-web/app/pages/branches/[id].vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/branches/[id].vue)

Important branch fixes made:

1. legacy branch ids were normalized more reliably
2. guard against `/branch/undefined` actions
3. branch status updates now reflect immediately in the UI after activate/deactivate
4. detail-page branch id stability was improved
5. action menus were expanded and cleaned up

---

## Members and Invites Integration Summary

This slice was implemented but should still be treated as recently stabilized, not casually assumed.

Intended supported flows:

1. send invite
2. get invitation details
3. list branch members
4. include pending invites in member list
5. cancel invite
6. resend invite
7. refresh invite link
8. get employee detail
9. update employee
10. deactivate employee
11. reactivate employee
12. delete employee
13. employee setup from invite
14. employee login

Key files:

- [apps/customer-web/app/services/employee.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/services/employee.service.ts)
- [apps/customer-web/app/pages/members/index.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/members/index.vue)
- [apps/customer-web/app/components/members/MemberActionsMenu.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/members/MemberActionsMenu.vue)
- [apps/customer-web/app/components/members/MemberResendInviteOverlay.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/members/MemberResendInviteOverlay.vue)
- [apps/customer-web/app/components/members/MemberEditOverlay.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/members/MemberEditOverlay.vue)

Important member/invite fixes:

1. catch-all proxy route path splitting was fixed so nested member routes were normalized correctly
2. pending invites are merged into member lists at the proxy layer
3. employee sessions skip admin-only pending-invite fetches
4. dedicated `Refresh invite link` action was added to the member action menu

Current caution:

- This area was working through several stabilization bugs, so if continuing here later, do a quick browser verification pass.

---

## Market / Categories / Products Integration Summary

We started the market integration using the agreed proxy-based strategy.

### Legacy endpoints identified as the basis

Categories:

1. `GET /v2/category`
2. `GET /v2/category/plain`
3. `GET /v2/category/:id`
4. `GET /v2/category/plain/:id`

Products:

1. `GET /v2/product`
2. `GET /v2/product/search`
3. `GET /v2/product/recent-orders/:branchId`
4. `GET /v2/product/:id`

Cart:

1. `POST /v2/cart`
2. `GET /v2/cart/:branchId`
3. `PATCH /v2/cart/:cartId`
4. `PATCH /v2/cart/update-quantity/:cartId`
5. `DELETE /v2/cart/delete/:cartId`
6. `DELETE /v2/cart/:branchId`

### Files used for market integration

- [apps/customer-web/app/services/market.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/services/market.service.ts)
- [apps/customer-web/app/composables/useMarketCatalog.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/composables/useMarketCatalog.ts)
- [apps/customer-web/app/lib/marketplace-data.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/lib/marketplace-data.ts)
- [apps/customer-web/server/utils/legacy-resource-compat.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/legacy-resource-compat.ts)
- [apps/customer-web/app/pages/market/index.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/index.vue)
- [apps/customer-web/app/pages/market/category/[id].vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/category/[id].vue)
- [apps/customer-web/app/pages/market/product/[id].vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/product/[id].vue)
- [apps/customer-web/app/components/market/MarketProductAddModal.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/market/MarketProductAddModal.vue)

### What was integrated

1. categories from legacy
2. category pages from legacy
3. product details from legacy
4. similar products use fetched catalog context
5. product modal and PDP support legacy unit selection

### Important market UI decisions made

1. market browsing should not be blocked by branch existence
2. branch should matter for:
   - add to cart
   - cart
   - request/checkout
3. branch creation should happen via modal/gate, not by redirecting to a dedicated onboarding page

---

## Market Loading/Image/Caching Behavior

We checked the old `gosource-web-app` and matched several behaviors.

### What the old app did

1. used a large grey basket/G `logo.png` as image loading/broken-image placeholder
2. made that placeholder pulse while loading
3. used fetch caching so names/prices appeared faster on repeat loads

### What was implemented in `customer-web`

Shared image behavior:

- [apps/customer-web/app/components/market/MarketProductImage.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/market/MarketProductImage.vue)
- [apps/customer-web/public/images/logo.png](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/public/images/logo.png)

Result:

1. missing images use the large grey placeholder
2. broken images use the same placeholder
3. loading uses the same pulsing placeholder

Lightweight catalog caching:

- [apps/customer-web/app/services/market.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/services/market.service.ts)
- [apps/customer-web/app/composables/useMarketCatalog.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/composables/useMarketCatalog.ts)

Result:

1. category list/category detail/product detail cache briefly
2. repeat visits feel faster

Category image behavior:

1. on successful load, categories use their normal emoji
2. during loading/fallback, categories use the smaller pulsing placeholder image

Also:

- proxy-generated `imageGradient` was removed from the live backend response normalization path

---

## Market Unit Parsing and Rendering

This was a major topic near the end of the session.

### Legacy pattern discovered in old app

The old app used:

1. `unit`
2. `discountedUnit`

as the source of truth.

It did **not** rely on `unitPriceBadge` for rendering unit choices.

Card behavior:

1. show minimum unit price
2. show `from` if multiple units exist

PDP/modal behavior:

1. parse unit map
2. show selectable units
3. show per-unit price
4. show discounted per-unit price if applicable

### Important parser work done

In:

- [apps/customer-web/server/utils/legacy-resource-compat.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/server/utils/legacy-resource-compat.ts)

we made unit parsing tolerant of:

1. valid JSON strings like:
   - `{"kilogram":"200","gram":"400"}`
2. malformed semicolon-heavy legacy strings like:
   - `{"Kilogram":"200";"Gram":"400"}`
3. numeric-string values

This matters because the backend sometimes returns:

```json
{
  "unit": "{\"kilogram\":\"200\",\"gram\":\"400\"}",
  "unitPriceBadge": "{\"kilogram\":\"200\",\"gram\":\"400\"} = ₦12.00"
}
```

Key insight:

- `unitPriceBadge` is noisy display metadata
- `unit` should be parsed into real unit choices

The parser fix included:

1. numeric-string support in `toNumber(...)`
2. tolerant fallback parsing
3. unit key normalization to lowercase

Expected frontend outcome:

1. `Kilogram`
2. `Gram`

should render as selectable unit choices instead of the raw blob.

---

## Market Branch Gate / Login Bootstrap

We redesigned this significantly.

### Previous problem

Market pages were white/blank initially because they waited on branch fetching.

### New behavior

Market pages no longer block rendering on branch existence.

Important files:

- [apps/customer-web/app/composables/useMarketBranchGate.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/composables/useMarketBranchGate.ts)
- [apps/customer-web/app/layouts/default.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/layouts/default.vue)
- [apps/customer-web/app/components/market/MarketHeaderCartButton.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/market/MarketHeaderCartButton.vue)

### Customer login/bootstrap behavior

We kept the server-side branch bootstrap knowledge, but stopped redirecting customers away from market.

Current behavior:

1. customer login/session bootstrap checks whether a branch exists
2. employee login skips branch-creation checks
3. customer always lands on `/market`
4. branch-dependent actions trigger the branch gate when needed

### No-branch banner

Added:

- [apps/customer-web/app/components/market/MarketBranchSetupBanner.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/market/MarketBranchSetupBanner.vue)

Behavior:

1. shows only for customer users without a branch
2. appears on market index/category/PDP
3. offers `Create branch` and `Maybe later`
4. disappears once a branch exists

---

## Product Modal vs Branch Gate Fix

Late in the session, the user reported this UX problem:

1. no branch exists
2. user opens product details modal
3. clicks `Add to cart`
4. create-branch modal appears behind the product modal

Expected behavior requested:

1. close product modal
2. open create-branch modal
3. after branch creation succeeds, reopen the product modal

This was implemented.

Files changed:

- [apps/customer-web/app/composables/useMarketBranchGate.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/composables/useMarketBranchGate.ts)
- [apps/customer-web/app/components/market/MarketProductAddModal.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/components/market/MarketProductAddModal.vue)
- [apps/customer-web/app/pages/market/index.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/index.vue)
- [apps/customer-web/app/pages/market/category/[id].vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/category/[id].vue)

Mechanism:

1. product modal checks branch requirement without immediately opening the gate
2. if branch is missing:
   - save pending product in shared state
   - close modal
   - open branch gate
3. once branch creation succeeds:
   - if a pending product exists
   - reopen its modal automatically

This currently applies to modal-based market surfaces:

1. market index
2. market category page

It does not need the same logic for the full PDP because that page is not inside another modal.

---

## UI Tweaks Completed

A lot of fine UI polish happened. The important ones:

1. removed the redundant `Category` label above the market category rail
   - [apps/customer-web/app/pages/market/index.vue](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/customer-web/app/pages/market/index.vue)
2. active category image/chip gets the nav-hover tint background
3. branch setup banner buttons sit side by side on wider screens
4. branch setup banner spacing/padding was reduced slightly
5. product unit rows use balanced vertical padding
6. modal/PDP image hover magnification was enabled

---

## Current State of Product Response Example

The user provided this backend response for a product:

```json
{
  "id": "66bc97d4f7c609c7b3f47e73",
  "name": "FDJKGLDF",
  "description": "ASDFSDFSDF",
  "imageUrl": "https://gosource.sfo3.digitaloceanspaces.com/hupodh226dvhupodh226dvLogo.png",
  "longDescription": "ASDFSDFSDF",
  "brandLabel": "SDFASDF",
  "priceNaira": 12,
  "compareAtNaira": 12444,
  "discountPct": 100,
  "unit": "{\"kilogram\":\"200\",\"gram\":\"400\"}",
  "stockNote": "Many in stock",
  "unitPriceBadge": "{\"kilogram\":\"200\",\"gram\":\"400\"} = ₦12.00",
  "categoryName": "6470c46d548ec6b3d1af8fe4"
}
```

Important interpretation:

1. `unit` is valid as a unit-price map, but values are numeric strings
2. `unitPriceBadge` should not be the source of truth
3. `categoryName` is actually a category id in this response

This directly informed the parser fix described above.

---

## Current Build Confidence

During the session, repeated builds of:

```bash
pnpm --filter @gosource/customer-web build
```

were run after many of these changes and completed successfully.

The last confirmed build was green after:

1. market branch-gate modal handoff changes
2. market category rail label cleanup
3. unit parser hardening

---

## Most Likely Next Task

The next recommended implementation slice is:

## Cart Integration

Why:

1. categories/products are already rendering from legacy
2. branch gating is in the right place
3. unit selection is working
4. add-to-cart is the next missing real backend behavior

Recommended next implementation order:

1. normalize legacy cart responses in the customer-web proxy
2. wire `POST /v2/cart`
3. wire `GET /v2/cart/:branchId`
4. wire `PATCH /v2/cart/:cartId`
5. wire `DELETE /v2/cart/delete/:cartId`
6. wire `DELETE /v2/cart/:branchId`
7. update `useMarketplaceCart` and `MarketCartDrawer` to use backend state

After cart:

1. request creation / checkout
2. then orders

---

## Suggested Prompt For A New Codex Session

Use something close to this:

```text
Please read /Users/acumenspare/Documents/codebase/personal/gosource-lab/docs/codex-session-handoff-2026-05-15.md first and continue from there.

Important rules:
1. Do not change schema/entity/model files in apps/legacy-api.
2. Avoid legacy controller/service changes unless absolutely necessary.
3. Do compatibility shaping in apps/customer-web proxy/adapters.

Current likely next task:
Integrate cart against legacy /v2/cart endpoints.
```

---

## Final Reminder

If continuing this work:

1. treat `apps/legacy-api` as the stable data-facing backend
2. prefer shaping in `apps/customer-web`
3. verify market unit rendering against real legacy products
4. take cart next

