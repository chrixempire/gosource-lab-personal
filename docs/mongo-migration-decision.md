# Mongo Migration Decision

| Field | Value |
| --- | --- |
| **Status** | Proposed |
| **Date** | May 13, 2026 |
| **Scope** | Backend persistence, domain modeling, migration direction |

## Purpose

This document captures:

1. what to keep from the current rebuild
2. what to adopt from the legacy MongoDB-backed GoSource system
3. what a full MongoDB switch would cost
4. the recommended structure and architecture going forward

It is based on:

- the current rebuild under `apps/api`, `apps/customer-web`, and `packages/*`
- read-only inspection of the legacy MongoDB database used by the older `gosource-api`
- the current roadmap and PRD

---

## Executive Recommendation

**Recommended decision: keep the current rebuilt backend architecture and security model, but adopt the legacy Mongo domain structure selectively where it improves product alignment.**

Short version:

1. **Do not do a blind full switch to Mongo immediately**
2. **Do use the legacy Mongo model as a domain reference**
3. **Preserve the stronger new auth, session, validation, and security work**
4. **Model future Requests, Orders, Wallet, Lists, and Purchase Orders using the useful legacy document shapes**

### Why

The legacy Mongo database contains useful domain knowledge:

- branch-aware procurement requests
- snapshot-style orders
- wallet + ledger separation
- shopping lists
- purchase orders

But it also contains risky or inconsistent implementation details:

- plaintext OTP storage
- at least one plaintext password sample in `customers`
- sparse indexing
- overlapping account collections

So the right approach is:

- **borrow the domain structure**
- **do not copy the weak storage/security patterns**

---

## What We Inspected in Legacy Mongo

Read-only inspection covered:

### Core identity and org model

- `businesscustomers`
- `users`
- `branches`
- `employees`
- `employeeinvites`
- `otps`

### Product and transaction model

- `wallets`
- `wallettransactions`
- `userwalletledgers`
- `transactionledgers`
- `requests`
- `orders`
- `shoppinglists`
- `purchaseorders`
- `products`
- `categories`
- `addresses`

---

## Key Findings

## 1. Legacy owner account model is not centered on `companies`

`companies` was empty in the inspected dataset.

The actual business-owner style account model appears to be:

- `businesscustomers`

Sample shape included:

- `businessName`
- `firstName`
- `lastName`
- `phoneNumbers`
- `email`
- `type: 'BUSINESS'`
- `password`
- `verified`

### Meaning

The old system’s real tenant-owner concept is closer to:

- a business-customer account

than to a clean relational split between:

- business entity
- owner account

---

## 2. Branches are structurally close to our rebuild

Legacy `branches` included:

- `branchName`
- `lga`
- `streetName`
- `branchCode`
- `businessId`
- `isHeadquarter`
- `isDeactivated`
- timestamps

### Meaning

Our current branch model is already reasonably aligned with the legacy domain.

---

## 3. Legacy requests are branch-aware procurement documents

Legacy `requests` included:

- embedded `products`
- `branch`
- `status`
- `reference`
- `initiator`
- embedded `address`
- `paymentMethod`
- `deliveryFee`
- `serviceCharge`
- `rejectedBy`
- `rejectedReasons`
- `paymentStatus`

### Meaning

This is one of the most valuable domain references from the legacy system.

It shows that Requests should be treated as:

- real procurement documents
- not just lightweight cart placeholders

---

## 4. Legacy orders are snapshot-heavy

Legacy `orders` included:

- customer-facing details
- embedded product snapshots
- address snapshot
- payment method
- subtotal
- quantity
- delivery fee
- status

### Meaning

Orders should preserve:

- pricing snapshot
- product snapshot
- address snapshot

instead of only pointing to mutable product rows.

---

## 5. Legacy wallet is ledger-aware

Legacy had separate collections for:

- `wallets`
- `wallettransactions`
- `userwalletledgers`
- `transactionledgers`

### Meaning

The old product treated wallet/accounting as a real financial subdomain.

This is much richer than a single balance table and should influence our future Wallet implementation.

---

## 6. Shopping lists are simple and reusable

Legacy `shoppinglists` included:

- `businessId`
- `branchId`
- `name`
- `description`
- `items`

### Meaning

This maps cleanly to the future `Lists` surface in the rebuild.

---

## 7. Purchase orders are operational and separate from customer orders

Legacy `purchaseorders` included:

- `products[]`
- `quantity`
- `quantityReceived`
- suppliers
- creator
- note
- status
- `expectedDate`

### Meaning

This matches the PRD distinction between:

1. customer procurement requests/orders
2. admin/internal inbound purchase orders

---

## 8. Legacy security/storage quality is inconsistent

Observed examples:

- separate plaintext OTP codes in `otps`
- a sample `customers` record with plaintext `password` and `confirmPassword`

### Meaning

We must not clone the old implementation blindly, even if we borrow its domain modeling.

---

## What To Keep From the Current Rebuild

These parts of the current rebuild are stronger than the legacy implementation and should remain:

## 1. Auth/session hardening

Keep:

- `httpOnly` cookie-based frontend session handling
- hardened session establishment
- route/session proxy approach in customer-web
- stronger employee/customer auth separation
- `user_type` + `role` split

## 2. OTP hashing

Keep:

- hashed OTP storage
- no plaintext OTP persistence

## 3. Validation and guard structure

Keep:

- explicit DTO validation
- typed guards
- role-aware session principal
- customer-vs-employee authorization boundaries

## 4. Security improvements

Keep:

- env-driven CORS
- `helmet`
- throttling
- stricter secret validation
- dev-only OTP visibility

## 5. Current branch/member management structure

Keep:

- current branch CRUD and detail patterns
- member invite/setup flow
- current UI/data layering

---

## What To Adopt From Legacy Mongo

These legacy structures should shape future implementation, whether we stay on Postgres or eventually move to Mongo.

## 1. Business owner domain concept

Adopt conceptually:

- a business-owner account model closer to `businesscustomers`

For the rebuild, this means:

- keep our current `business` + owner account split
- but model the owner-facing fields and onboarding flow with legacy parity in mind

## 2. Request structure

Adopt:

- branch-aware request documents
- embedded product snapshot fields
- payment and rejection metadata
- address snapshot fields

## 3. Order structure

Adopt:

- embedded line-item snapshots
- operational status fields
- delivery/payment snapshot fields

## 4. Wallet and ledger structure

Adopt:

- wallet as a first-class domain
- transaction reference separation
- ledger-inspired financial recording

Recommended subdomains:

1. wallet
2. wallet transactions
3. ledger entries
4. payment references / reconciliation references

## 5. Shopping lists

Adopt:

- business + branch scoped lists
- simple list document/table structure

## 6. Purchase orders

Adopt:

- line-item purchase order model
- receiving quantities
- expected date
- supplier references

## 7. Role and permission direction

Adopt directionally:

- explicit permission bundles for admin/internal roles

Do not overbuild early, but keep room for:

- role definitions
- permission mapping
- active/inactive role management

---

## What Not To Adopt Blindly

Do **not** clone these patterns as-is:

## 1. Plaintext OTP storage

Keep hashed OTPs in the rebuild.

## 2. Plaintext or weak password handling

Keep modern password hashing and never store `confirmPassword`.

## 3. Sparse indexing discipline

Add indexes intentionally for:

- email uniqueness
- references
- branch/business scoping
- request/order lookup paths
- wallet/payment lookup paths

## 4. Overlapping account collections without a clear contract

Legacy has multiple account-like collections:

- `businesscustomers`
- `customers`
- `users`
- `adminusers`
- `admins`

The rebuild should keep cleaner ownership boundaries.

## 5. Implicit domain coupling

Legacy stores some procurement snapshots richly, which is good, but we should still keep:

- explicit service boundaries
- predictable APIs
- typed contracts

---

## Cost of a Full Mongo Switch

If we choose to fully switch this rebuild from Postgres/Drizzle to MongoDB, the cost is significant.

## Scope of change

Would require replacing or rewriting:

1. database module
2. schema layer
3. repository layer
4. migration strategy
5. index bootstrap strategy
6. query logic
7. some domain assumptions about relations and transactions

## Concrete impact

### Backend infrastructure

- remove or bypass Drizzle-driven persistence
- introduce Mongo driver or ODM
- replace SQL migrations with:
  - collection/index bootstrap
  - data migration scripts

### Repositories/services

Rewrite most repository code in:

- auth
- branch
- employee
- future request/order/wallet modules

### Testing and verification

Re-verify:

- auth flows
- branch/member CRUD
- sessions
- invite flows
- request/order/wallet behavior once implemented

## Cost summary

### Engineering cost

- medium to high

### Product disruption risk

- medium

### Long-term team alignment benefit

- potentially high, if the organization is standardizing on legacy Mongo

---

## Recommended Architecture Going Forward

## Recommendation

**Recommended architecture: keep the current rebuilt backend stack, but shape the next product modules using the legacy Mongo domain model as the blueprint.**

### In practice

Keep:

1. NestJS
2. current service/controller/module structure
3. current auth/session/security improvements
4. current shared contracts approach
5. current branch/member domain work

Adopt from legacy:

6. request document structure
7. order snapshot structure
8. wallet + ledger domain separation
9. shopping list model
10. purchase order model

Do not adopt:

11. plaintext OTP/password storage
12. confusing duplicated identity collections
13. under-indexed collections

---

## Recommended Target Domain Structure

Whether stored in Postgres or Mongo, the rebuild should move toward these domain modules:

## Identity and access

1. business owner accounts
2. employee accounts
3. employee invites
4. admin users
5. roles / permissions
6. sessions
7. OTPs / verification tokens

## Business and branch

1. businesses
2. branches
3. member assignment
4. branch access boundaries

## Procurement

1. requests
2. carts
3. shopping lists
4. orders
5. order activity logs

## Catalog and inventory

1. products
2. categories
3. inventory movements
4. stock counts
5. special prices
6. promotions

## Finance

1. wallets
2. wallet transactions
3. ledger entries
4. payment references
5. webhook records

## Admin operations

1. purchase orders
2. supplier references
3. inbound stock receiving

---

## Implementation Recommendation by Phase

## Phase 1 — Stay on current rebuilt stack

Do now:

1. keep current Postgres/Drizzle implementation
2. finish `Members`
3. build `Requests` using the legacy request shape as reference
4. build `Orders` using legacy order snapshots as reference
5. build `Lists` using legacy `shoppinglists` as reference
6. build `Wallet` using the legacy wallet/ledger split as reference

## Phase 2 — Reassess after Requests/Orders/Wallet design

At that point, decide:

1. stay on Postgres permanently
2. or migrate to Mongo if domain fit and org constraints truly demand it

This is the right decision checkpoint because by then we will know whether:

- the legacy Mongo document model is essential
- or whether we can express it cleanly in Postgres without paying migration cost

## Phase 3 — Only switch if it is clearly worth it

Switch to Mongo only if:

1. CTO direction is final
2. team needs shared operational alignment with the old stack
3. the cost of dual-model thinking is higher than the migration cost

---

## Final Recommendation

### Recommended choice

**Do not switch the rebuild to Mongo immediately.**

### Instead

1. keep the current backend architecture
2. use the legacy Mongo inspection as a domain guide
3. preserve the stronger new security and auth model
4. implement future modules with legacy parity where it matters

### Why this is the best balance

It gives us:

1. stronger security and system discipline
2. cleaner implementation momentum
3. product parity with the legacy system where it matters
4. flexibility to migrate later if the business truly needs it

---

## Follow-up Actions

1. keep this document updated as more legacy collections are inspected
2. use it when designing:
   - Requests
   - Orders
   - Wallet
   - Lists
   - Purchase Orders
3. revisit the Mongo/Postgres decision after those domain designs are mapped into the rebuild
