# Mongo Backend Revamp Plan

| Field | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | May 13, 2026 |
| **Scope** | `apps/api` backend persistence revamp |

## Purpose

This document turns the MongoDB migration decision into a practical backend execution plan for this repo.

It answers:

1. what folder structure we should use
2. which collections we should create first
3. which schemas/models should be defined first
4. the safest module migration order
5. which files in `apps/api` should change first

This plan assumes:

1. we want to align with the legacy GoSource MongoDB domain structure
2. we want to preserve the stronger new auth/security work
3. we want to keep the backend simple and avoid over-engineering

---

## Core Strategy

## Goal

Move `apps/api` from:

- `NestJS + PostgreSQL + Drizzle`

to:

- `NestJS + MongoDB`

while keeping:

1. current Nest module boundaries
2. current auth/session security improvements
3. current DTO validation approach
4. current controller/service structure where it still fits

## Guiding rule

We are **replacing the persistence layer first**, not rewriting the whole backend blindly.

That means:

1. keep modules
2. keep service intent
3. replace repositories and storage assumptions
4. update domain shapes where legacy Mongo is more correct

---

## Recommended Stack

## Backend stack

Use:

1. `NestJS`
2. `MongoDB`
3. `Mongoose`

### Why Mongoose here

Recommended because:

1. it matches the likely team familiarity around the old `gosource-api`
2. schema definitions will be faster to express than raw driver-only code
3. hooks, indexes, validation, and references are easier to manage for this phase
4. it keeps the backend simple without building our own abstraction layer

### What not to add

Do **not** add:

1. CQRS
2. event buses
3. generic repository frameworks
4. domain layers for their own sake
5. dual database support long-term

---

## Target Folder Structure

Keep the current module layout, but replace the database layer with a Mongo-specific one.

## Recommended `apps/api/src` structure

```text
apps/api/src
├── common
├── config
├── infrastructure
│   ├── mongo
│   │   ├── mongo.constants.ts
│   │   ├── mongo.module.ts
│   │   ├── mongo.providers.ts
│   │   ├── schemas
│   │   │   ├── business-customer.schema.ts
│   │   │   ├── employee.schema.ts
│   │   │   ├── employee-invite.schema.ts
│   │   │   ├── branch.schema.ts
│   │   │   ├── otp.schema.ts
│   │   │   ├── session.schema.ts
│   │   │   ├── wallet.schema.ts
│   │   │   ├── wallet-transaction.schema.ts
│   │   │   ├── user-wallet-ledger.schema.ts
│   │   │   ├── transaction-ledger.schema.ts
│   │   │   ├── request.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   ├── shopping-list.schema.ts
│   │   │   ├── purchase-order.schema.ts
│   │   │   ├── product.schema.ts
│   │   │   ├── category.schema.ts
│   │   │   ├── address.schema.ts
│   │   │   ├── admin-user.schema.ts
│   │   │   └── role.schema.ts
│   │   └── indexes
│   │       └── bootstrap-indexes.ts
├── modules
│   ├── admin-auth
│   ├── auth
│   ├── branch
│   ├── employee
│   ├── health
│   ├── requests
│   ├── orders
│   ├── wallet
│   ├── lists
│   ├── purchase-orders
│   └── catalog
```

## Structure notes

### Keep

Keep:

1. `modules/*`
2. `common/*`
3. `config/*`

### Replace

Replace:

- `infrastructure/database/*`

with:

- `infrastructure/mongo/*`

### Temporary transition

During the revamp, it is okay to keep both:

- `infrastructure/database`
- `infrastructure/mongo`

for a short period.

But the end state should have Mongo as the primary persistence layer.

---

## Target Collection List

These are the collections we should support, grouped by domain.

## Phase 1 collections

These are the first collections to implement because they unlock auth, branches, and members.

1. `businesscustomers`
2. `employees`
3. `employeeinvites`
4. `branches`
5. `otps`
6. `customer_sessions`
7. `employee_sessions`
8. `adminusers`
9. `roles`

## Phase 2 collections

These support the first real transactional product flows.

10. `requests`
11. `orders`
12. `shoppinglists`
13. `products`
14. `categories`
15. `addresses`

## Phase 3 collections

These support wallet and accounting.

16. `wallets`
17. `wallettransactions`
18. `userwalletledgers`
19. `transactionledgers`
20. `paymentreferences`

## Phase 4 collections

These support internal/admin procurement operations.

21. `purchaseorders`
22. `inventorymovements`
23. `stockcounts`
24. `specialprices`
25. `promotions`

---

## Schema / Model Definitions to Create First

The first models should support the already-implemented product flows so we preserve momentum.

## 1. `businesscustomers`

Represents the business owner / primary customer account.

Recommended fields:

1. `_id`
2. `businessName`
3. `firstName`
4. `lastName`
5. `phoneNumbers`
6. `email`
7. `type: 'BUSINESS'`
8. `passwordHash`
9. `verified`
10. `isDeactivated`
11. `role: 'super_admin'`
12. `createdAt`
13. `updatedAt`

### Notes

- do **not** keep plaintext `password`
- do **not** keep `confirmPassword`
- keep owner role explicit

## 2. `employees`

Represents invited branch-scoped members.

Recommended fields:

1. `_id`
2. `businessId`
3. `branchId`
4. `email`
5. `firstName`
6. `lastName`
7. `phoneNumber`
8. `normalizedPhoneNumber`
9. `position`
10. `role: 'manager' | 'employee'`
11. `passwordHash`
12. `verifiedAt`
13. `status`
14. `isDeactivated`
15. `createdAt`
16. `updatedAt`

## 3. `employeeinvites`

Recommended fields:

1. `_id`
2. `email`
3. `businessId`
4. `branchId`
5. `role`
6. `status`
7. `callbackUrl`
8. `createdAt`
9. `updatedAt`

## 4. `branches`

Recommended fields:

1. `_id`
2. `branchName`
3. `streetName`
4. `lga`
5. `branchCode`
6. `businessId`
7. `isHeadquarter`
8. `isDeactivated`
9. `activatedAt`
10. `createdAt`
11. `updatedAt`

## 5. `otps`

Recommended fields:

1. `_id`
2. `email`
3. `codeHash`
4. `purpose`
5. `expiresAt`
6. `createdAt`
7. `updatedAt`

### Notes

- use a separate collection only if we want Mongo parity
- keep hashes, not plaintext
- include purpose so signup/reset flows do not collide

## 6. `customer_sessions`

Recommended fields:

1. `_id`
2. `customerAccountId`
3. `refreshTokenHash`
4. `expiresAt`
5. `revokedAt`
6. `createdAt`
7. `updatedAt`

## 7. `employee_sessions`

Recommended fields:

1. `_id`
2. `employeeAccountId`
3. `refreshTokenHash`
4. `expiresAt`
5. `revokedAt`
6. `createdAt`
7. `updatedAt`

## 8. `adminusers`

Recommended fields:

1. `_id`
2. `firstName`
3. `lastName`
4. `email`
5. `passwordHash`
6. `status`
7. `createdAt`
8. `updatedAt`

## 9. `roles`

Recommended fields:

1. `_id`
2. `name`
3. `permissions: string[]`
4. `isActive`
5. `createdAt`
6. `updatedAt`

---

## Module Migration Order

This is the safest order for the revamp.

## Phase 1 — Infrastructure and auth foundation

### Step 1. Add Mongo infrastructure

Create:

1. `mongo.module.ts`
2. `mongo.providers.ts`
3. schema files for first collections

### Step 2. Port auth persistence

Port:

1. customer signup/login/reset persistence
2. employee signup/login/reset persistence
3. OTP persistence
4. session persistence

### Step 3. Port admin auth persistence

Port:

1. admin login persistence
2. admin role lookup

## Phase 2 — Branches and members

### Step 4. Port branch persistence

Port:

1. branch list
2. branch detail
3. branch create/update/deactivate/delete

### Step 5. Port employee/member persistence

Port:

1. member listing
2. invite create/resend/cancel
3. member detail/update/deactivate/reactivate/delete

## Phase 3 — First transactional customer flows

### Step 6. Build Requests on Mongo

Use the legacy `requests` structure as the main blueprint.

### Step 7. Build Orders on Mongo

Use the legacy `orders` snapshot style.

### Step 8. Build Lists on Mongo

Use `shoppinglists`.

## Phase 4 — Finance

### Step 9. Build Wallet

Collections:

1. `wallets`
2. `wallettransactions`
3. `userwalletledgers`
4. `transactionledgers`

## Phase 5 — Admin procurement ops

### Step 10. Build Purchase Orders

Use `purchaseorders`.

---

## Files in `apps/api` That Should Change First

This is the practical file-level order.

## 1. New infrastructure files

Create first:

1. `apps/api/src/infrastructure/mongo/mongo.constants.ts`
2. `apps/api/src/infrastructure/mongo/mongo.module.ts`
3. `apps/api/src/infrastructure/mongo/mongo.providers.ts`

## 2. Config

Update:

4. [apps/api/src/config/env.validation.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/config/env.validation.ts)

Add:

5. `MONGODB_URI`
6. `MONGODB_DB_NAME`

## 3. App module wiring

Update:

7. [apps/api/src/app.module.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/app.module.ts)

Swap:

- database module usage

for:

- mongo module usage

## 4. Auth module first

Update first because everything depends on it:

8. [apps/api/src/modules/auth/auth.module.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/auth/auth.module.ts)
9. [apps/api/src/modules/auth/auth.repository.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/auth/auth.repository.ts)
10. [apps/api/src/modules/auth/auth.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/auth/auth.service.ts)

## 5. Employee module next

11. [apps/api/src/modules/employee/employee.module.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/employee/employee.module.ts)
12. [apps/api/src/modules/employee/employee.repository.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/employee/employee.repository.ts)
13. [apps/api/src/modules/employee/employee.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/employee/employee.service.ts)

## 6. Branch module after that

14. [apps/api/src/modules/branch/branch.module.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/branch/branch.module.ts)
15. [apps/api/src/modules/branch/branch.repository.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/branch/branch.repository.ts)
16. [apps/api/src/modules/branch/branch.service.ts](/Users/acumenspare/Documents/codebase/personal/gosource-lab/apps/api/src/modules/branch/branch.service.ts)

## 7. Remove or retire Drizzle only after auth + branch + employee are stable

Do **not** start by deleting Drizzle.

Retire later:

17. `apps/api/src/infrastructure/database/*`
18. Drizzle schema imports
19. migration-specific scripts/config

Only once Mongo-backed core flows pass build and runtime checks.

---

## Index Strategy

Legacy Mongo indexing is too sparse to copy directly.

We should define indexes intentionally from the start.

## Must-have indexes first

### `businesscustomers`

1. unique `email`

### `employees`

2. unique `email`
3. unique `normalizedPhoneNumber`
4. index `businessId`
5. index `branchId`

### `employeeinvites`

6. compound index on:
   - `businessId`
   - `branchId`
   - `email`

### `branches`

7. index `businessId`
8. unique `branchCode`

### `otps`

9. index `email`
10. index `expiresAt`

### `wallets`

11. unique `reference`
12. index `businessId`

### `wallettransactions`

13. unique `reference`
14. unique `paymentReference`
15. index `businessId`

### `requests`

16. index `branchId`
17. index `initiatorId`
18. index `status`
19. index `reference`

### `orders`

20. index `businessId`
21. index `branchId`
22. index `status`

---

## Transitional Rules

While revamping:

1. preserve existing API route shapes where possible
2. keep frontend contracts stable where possible
3. only change response shapes if the legacy domain model makes it necessary
4. migrate one module fully before moving to the next

## Do not do this

1. do not rewrite all modules at once
2. do not delete Drizzle first
3. do not mix Postgres and Mongo long-term
4. do not copy legacy plaintext OTP/password behavior

---

## Recommended First Milestone

The first meaningful milestone should be:

### Mongo-backed auth + branch/member core

That means:

1. customer signup/login/reset works on Mongo
2. employee invite/setup/login works on Mongo
3. branch list/detail/create/edit works on Mongo
4. member list/invite/detail works on Mongo

Once this milestone is stable, the backend direction is effectively proven.

---

## Recommended Next Milestone

After that:

### Requests + Orders + Lists

because those are the most valuable legacy Mongo domain references for the customer product.

---

## Final Recommendation

## Best path

1. add Mongo infrastructure first
2. port auth
3. port employee/member
4. port branches
5. then build Requests, Orders, Lists, Wallet around the legacy document model

## Architecture principle

The new backend should become:

- **same stack direction as legacy**
- **same useful domain shape as legacy**
- **cleaner security and simpler boundaries than legacy**

That is the balance we want to preserve over time.
