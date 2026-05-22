# GoSource Migration Strategy

This document explains how we move from `gosource-api` to the new GoSource backend without making the new system too clever.

## Main Idea

We are **not** copying the old backend as-is.
We are also **not** pretending the old data does not matter.

The right approach is:

- build a clean new backend
- keep the legacy schema and business meaning in mind
- migrate data in a controlled order
- preserve traceability from old records to new records

The goal is a smooth transition, not a perfect translation of the old system.

## What We Learn From `gosource-api`

The legacy API already tells us the important business shapes:

- business/customer accounts
- branches
- staff/employees
- products and categories
- carts and shopping lists
- requests and orders
- wallets and wallet transactions
- credit applications and repayments
- accounting ledgers
- invoices and activity logs

These are the real migration anchors.

## What We Should Preserve

When useful, preserve:

- legacy IDs
- legacy status meanings
- audit history
- branch ownership
- business ownership
- payment references
- order references
- credit application history

If something matters to the current business, we should keep its meaning visible in the new system.

## What We Should Not Preserve

Do not preserve:

- old schema mistakes just because they exist
- tangled module boundaries
- accidental duplication
- legacy coupling through shared Mongo collections
- implementation details that only made sense in the old codebase

The migration should carry the business forward, not the technical debt.

## Legacy Entity Map

### Core identity and business data

| `gosource-api` legacy | GoSource target | Notes |
|---|---|---|
| `BusinessCustomer` | `Business` / tenant account | The top-level business record that owns branches and operations |
| `Employee` | `User` / staff member | Staff identity and role context |
| `Branch` | `Branch` | Preserve ownership and branch-specific data |
| `RequestLog` | `AuditLog` or `activity_log` | Keep only if useful for operational tracing |

### Commerce data

| `gosource-api` legacy | GoSource target | Notes |
|---|---|---|
| `Product` | `Product` | Likely needs normalization and cleaner relations |
| `Category` | `Category` | Preserve taxonomy where it still makes sense |
| `Cart` / `ShoppingList` | `Cart` / `SavedList` | Keep the user-facing behavior, simplify the model |
| `Request` | `Request` or `OrderRequest` | This is a key workflow object and should be reviewed carefully |
| `Order` | `Order` | Preserve status flow and references |

### Financial data

| `gosource-api` legacy | GoSource target | Notes |
|---|---|---|
| `Wallet` | `Wallet` | Needs careful balance mapping |
| `WalletTransaction` | `WalletTransaction` | Keep as a ledger-style record |
| `Credit` | `CreditApplication` / `CreditAccount` | Split application vs account clearly in the new model |
| `Accounting` ledgers | `LedgerEntry` / accounting tables | Do not copy the old ledger sprawl one-for-one |
| `Invoice` | `Invoice` | Preserve references and payment links |

### Support data

| `gosource-api` legacy | GoSource target | Notes |
|---|---|---|
| `Promotion` | `Promotion` | Only migrate fields that still matter |
| `InventoryMovement` | `InventoryMovement` | Useful for stock traceability |
| `Activity` / `Timeline` | `ActivityLog` / `TimelineEvent` | Preserve if it helps audit and customer support |

## Migration Rules

1. Migrate one domain at a time.
2. Do not start with historical data if the current data model is not stable.
3. Keep the new schema boring and explicit.
4. Prefer one-way imports over live dual-write systems.
5. Keep a legacy reference ID on migrated rows when useful.
6. Validate counts and key totals after each import.
7. Keep the migration scripts repeatable.
8. Do not invent new business rules during migration.

## Recommended Migration Order

### Step 1: Inventory the legacy data

- list legacy collections and important fields
- document status enums
- identify foreign-key-like relationships
- identify required vs optional data
- note anything that is clearly dead or redundant

### Step 2: Lock the GoSource target model

- define the new canonical entities
- define the field names and relationships
- decide what will be normalized
- decide what will be flattened into JSON only if needed

### Step 3: Build import scripts for core identity data

Start with the records everything else depends on:

- businesses
- branches
- users or staff
- roles and permissions

This gives the new system a base to attach more data to.

### Step 4: Migrate catalog data

Move:

- categories
- products
- inventory-related fields
- images or asset references if needed

This should happen after the ownership model is stable.

### Step 5: Migrate active operational data

Move:

- carts and lists if still needed
- requests
- orders
- order statuses

This is where the live product behavior starts to matter.

### Step 6: Migrate financial data carefully

Move:

- wallet balances
- wallet transactions
- credit applications
- credit accounts
- invoices
- ledger history

This part must be verified with totals, not just row counts.

### Step 7: Migrate historical and support data

Move:

- activity logs
- timelines
- notifications
- request logs
- old reports if they are still useful

This can happen later because it is usually less critical for launch.

## Migration Implementation Style

Keep the implementation boring:

- script-based imports
- explicit mapping functions
- validation before and after import
- clear logging
- idempotent re-runs

Avoid:

- hidden background sync
- dual writes unless absolutely required
- complicated event replay during initial migration
- magic “one-click” migration logic that nobody can reason about

## Safety Checks

After each migration batch, verify:

- record counts
- branch ownership
- total balances
- order totals
- credit totals
- orphaned references
- duplicate rows

If a batch is wrong, stop and fix the mapping before continuing.

## Practical Rule

If a legacy field does not help GoSource operate, migrate it only if there is a clear reason.

If a legacy field causes confusion, leave it behind unless it is needed for audit or support.

## Bottom Line

The migration should be:

- one-way
- incremental
- traceable
- boring
- reversible at the script level

That is the safest path from `gosource-api` to the new GoSource backend.

