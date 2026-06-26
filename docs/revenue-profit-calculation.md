# Revenue & Profit Calculation — GoSource

> How the admin dashboard computes **Revenue** and **Profit** across every scenario.
> Source of truth: `apps/legacy-api/src/order/order-financials.ts`
> Aggregation: `apps/legacy-api/src/admin/order/order.service.ts` → `getDashboardMetrics` (~line 1750)
> API surface: `apps/admin-web/server/api/dashboard/summary.get.ts`

---

## Overview

The financial calculation happens in **three layers**:

1. **Per-line cost snapshot** — taken at order creation, freezes cost so historical profit is immutable when products are later restocked.
2. **Per-order summary** — combines lines into one order's revenue, COGS, and profit.
3. **Dashboard aggregation** — sums qualifying orders into the dashboard cards.

---

## Core terms

| Term | Meaning | Source field |
|---|---|---|
| `marketPrice` | **COST** per *base/stock unit* (what the business paid). Despite the "Original price in the market" label in the admin form, the backend treats this as cost. | `product.marketPrice` |
| Selling price | What the customer pays per *selling unit* | v2: `discountedUnit` → `unit` map; v1: `specialPrices` / `discountPrice` |
| Q/U (conversion) | How many **base/stock units** are contained in one **selling unit** | `newUnit[].quantity` |
| Snapshot version | Currently **3**. Lines tagged `< 3` are treated as stale and recomputed live. | `ORDER_FINANCIAL_SNAPSHOT_VERSION` |

> **Unit model:** The stock/purchase unit (`marketPrice`, `quantity`) is the **smallest** unit. You sell larger bundles. Example: 1 oplo = 8 zebra crosses → Q/U = 8. Conversion **multiplies** (selling Q/U ÷ purchase Q/U).

---

## Layer 1 — Per-line snapshot at order creation

`snapshotOrderFinancialLines(lines, businessId, orderDiscount)` runs when an order is created/approved. For each line it resolves three primitives, then derives the rest.

### Step A — Resolve the three primitives

```
unitSellingPrice  = line.unitSellingPrice            (if already snapshotted ≥ 0)
                    else v2: discountedUnit[unit] ?? unit[unit] ?? discountPrice
                    else v1: specialPrices[business].price ?? discountPrice

baseUnitCost      = snapshot.baseUnitCost             (if version ≥ 3 and > 0)
                    else product.marketPrice          (if present and > 0)

conversion (Q/U)  = snapshot.baseQuantityPerSellingUnit  (if version ≥ 3 and > 0)
                    else resolvePurchaseUnitConversion(product, unit)
```

### `resolvePurchaseUnitConversion` — base units consumed per selling unit

```
if sellingUnit == purchaseUnit                  → 1
else if newUnit has sellingUnit mapping         → sellingQ/U ÷ purchaseQ/U   (MULTIPLY)
else if product.trackQuantity == false          → 1   (untracked: marketPrice = cost of 1 sold unit)
else if sellingUnit != purchaseUnit (no map)    → null  (FAIL SAFE → line stays unverified)
else                                            → 1
```

> **History:** an earlier version *divided* here, which under-counted COGS and under-deducted stock for "sell-bigger-than-stock" products. Fixed by flipping to multiply and bumping the snapshot version 2 → 3 so old (wrong) snapshots recompute.

### Step B — Discount allocation across lines

The order-level discount is spread across lines proportional to each line's gross revenue. The remainder is forced onto the **last** line so allocations always sum exactly to the discount.

```
grossLineRevenue   = max(0, unitSellingPrice × quantity)
grossRevenue       = Σ grossLineRevenue
safeDiscount       = clamp(orderDiscount, 0, grossRevenue)

allocatedDiscount  = (grossLineRevenue / grossRevenue) × safeDiscount   [non-last lines]
                   = safeDiscount − Σ(already allocated)                 [last line]
```

### Step C — Derive the snapshot

Only computed if **all three primitives resolved**; otherwise the line is left un-snapshotted.

```
totalBaseQuantity = quantity × conversion
totalCost         = baseUnitCost × totalBaseQuantity
netLineRevenue    = grossLineRevenue − allocatedDiscount
grossProfit       = netLineRevenue − totalCost
```

These fields persist onto the cart line, making historical profit **immutable** even after restocking at a new `marketPrice`.

---

## Layer 2 — Per-order summary

`summarizeOrderFinancials(order)` combines `products` + `additionalProducts`.

### Revenue (authoritative, merchandise-only)

```
revenue = max(0, totalPrice + additionalTotalPrice − deliveryFee − serviceCharge)
        = 0  if totalPrice is null
```

Revenue comes from the **recorded payable total**, not from re-summing lines. Delivery fee and service charge are stripped because the dashboard reports merchandise revenue only.

### Cost of goods sold (per line, with fallback)

```
for each line:
  if version ≥ 3 and totalCost ≥ 0      → COGS += totalCost          (use snapshot)
  else recompute cost + conversion from live product:
     if quantity / cost / conversion invalid → order becomes UNVERIFIED
     else                                     → COGS += quantity × conversion × cost
```

### Verified flag & profit

```
verified    = (totalPrice not null) AND (lines exist) AND (every line resolved cost)
grossProfit = verified ? (revenue − COGS) : 0
```

---

## Layer 3 — Dashboard aggregation

`getDashboardMetrics` counts only orders that are:

- `paymentStatus = PAID`, **and**
- `status ∉ {cancelled, returned, refunded}`, **and**
- in the date range — matched by `paidAt`, falling back to `createdAt` when `paidAt` is absent.

It cursors over each qualifying order and accumulates:

```
revenue              += calculated.revenue            (ALL qualifying orders)
qualifyingOrderCount += 1

if verified:
    verifiedRevenue          += revenue
    costOfGoodsSold          += COGS
    grossProfit              += grossProfit
    verifiedProfitOrderCount += 1
else:
    unverifiedProfitOrderCount += 1

grossMarginPercent        = grossProfit / verifiedRevenue × 100
historicalCoveragePercent = verifiedProfitOrderCount / qualifyingOrderCount × 100
```

> **Key asymmetry:** revenue includes *every* qualifying order, but profit / COGS / margin include only *verified* orders. `historicalCoveragePercent` reports how much of revenue is backed by a profit calculation — the migration gap where old pre-snapshot orders count in revenue but not profit.

---

## All scenarios

| # | Scenario | Outcome |
|---|---|---|
| 1 | Fresh order, v3 snapshot, selling unit = purchase unit | conversion = 1; COGS = qty × marketPrice; profit = (price − discount) × qty − COGS. **Verified**. |
| 2 | Selling bundle bigger than stock unit (1 oplo = 8 crosses) | conversion = sellingQ/U ÷ purchaseQ/U = 8; COGS scales up 8×. **Verified**. |
| 3 | Old v1/v2 snapshot line (version < 3) | Snapshot ignored; cost recomputed live from current `marketPrice` + `newUnit`. Verified only if recompute succeeds. |
| 4 | Untracked product (`trackQuantity = false`) | conversion forced to 1; marketPrice treated as cost of one sold unit. **Verified**. |
| 5 | Selling unit ≠ purchase unit, no `newUnit` mapping | conversion = `null` → line can't snapshot → order **unverified** → counts in revenue, excluded from profit. |
| 6 | `marketPrice` missing or ≤ 0 | baseUnitCost = `null` → **unverified** → revenue only. |
| 7 | Selling price unresolved (no unit map, no discountPrice) | Line left un-snapshotted; grossLineRevenue treated as 0 for that line. |
| 8 | Order discount present | Allocated across lines proportional to gross revenue, remainder on last line. Profit uses net. Dashboard revenue uses `totalPrice` (already net) so discount is honored once. |
| 9 | `totalPrice` is null | revenue = 0 and order is unverified. |
| 10 | Order not paid, or cancelled / returned / refunded | Excluded entirely from the financial cursor — no revenue, no profit. |
| 11 | Order with zero lines | verified = false → revenue counts (if totalPrice set), profit excluded. |
| 12 | `additionalProducts` (items added post-creation) | Included in both COGS lines and revenue via `additionalTotalPrice`. |
| 13 | Cost product resolution | COGS uses the **live `product`** if it carries `marketPrice`, else falls back to the `cartProduct` snapshot (`lineCostProduct`). |

---

## Worked example (scenario 2 + discount)

**Setup:** 1 oplo = 8 crosses; `marketPrice` = ₦100 / cross (base unit); purchaseUnit = cross. Selling unit = oplo @ ₦1,000. Order: 3 oplo, ₦300 order discount, ₦200 delivery.

```
conversion        = 8 ÷ 1            = 8
grossLineRevenue  = 1000 × 3         = 3,000
allocatedDiscount = 300              (single line)
netLineRevenue    = 3000 − 300       = 2,700
totalBaseQuantity = 3 × 8            = 24 crosses
totalCost (COGS)  = 100 × 24         = 2,400
grossProfit       = 2700 − 2400      = 300

Order summary:
revenue = totalPrice − deliveryFee  = 2,900 − 200 = 2,700
COGS                                = 2,400
profit  = 2,700 − 2,400             = 300   (verified)
margin  = 300 / 2,700               = 11.1%
```

---

## Field reference — `OrderFinancialSnapshot`

| Field | Formula |
|---|---|
| `financialSnapshotVersion` | `3` |
| `unitSellingPrice` | resolved selling price per selling unit |
| `grossLineRevenue` | `unitSellingPrice × quantity` |
| `allocatedDiscount` | proportional share of order discount |
| `netLineRevenue` | `grossLineRevenue − allocatedDiscount` |
| `baseUnitCost` | `marketPrice` (cost per base unit) |
| `baseQuantityPerSellingUnit` | conversion (base units per selling unit) |
| `totalBaseQuantity` | `quantity × conversion` |
| `totalCost` | `baseUnitCost × totalBaseQuantity` |
| `grossProfit` | `netLineRevenue − totalCost` |
