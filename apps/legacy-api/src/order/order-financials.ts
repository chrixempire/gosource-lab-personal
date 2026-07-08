type UnknownRecord = Record<string, any>;

// v3: Q/U now means base/stock units PER selling unit (e.g. 1 oplo = 8 zebra
// crosses -> Q/U 8), so conversion multiplies. v2 snapshots used the inverted
// ratio and are intentionally treated as stale so they recompute correctly.
export const ORDER_FINANCIAL_SNAPSHOT_VERSION = 3;

// A resolvable line cost this many times its own selling revenue is almost
// certainly a data-entry error (e.g. a market price typed in hundreds of
// thousands instead of thousands). Such a line is STILL counted in profit as-is,
// but flagged so the resulting swing has a visible, correctable cause.
export const SUSPECTED_PRICE_MULTIPLE = 10;

export type OrderFinancialSnapshot = {
  financialSnapshotVersion: number;
  unitSellingPrice: number;
  grossLineRevenue: number;
  allocatedDiscount: number;
  netLineRevenue: number;
  baseUnitCost: number;
  baseQuantityPerSellingUnit: number;
  totalBaseQuantity: number;
  totalCost: number;
  grossProfit: number;
};

/**
 * Why a line is surfaced for pricing attention.
 * - `no_market_price`: no resolvable cost, so it is LEFT OUT of profit.
 * - `suspected_price`: cost resolves but is implausibly large vs what it sold for;
 *   it is STILL counted in profit as-is, and flagged only for review.
 */
export type UnresolvedCostReason = 'no_market_price' | 'suspected_price';

/**
 * An order line surfaced on the dashboard for pricing attention. Its revenue
 * always counts toward total revenue; whether its cost feeds profit depends on
 * `reason` (see above). Surfaced so admins can see which item to fix.
 */
export type UnresolvedCostLine = {
  productName: string;
  unit: string | null;
  quantity: number | null;
  marketPrice: number | null;
  sellingPrice: number | null;
  reason: UnresolvedCostReason;
};

export type OrderFinancialSummary = {
  // All merchandise revenue on the order (every line, costed or not).
  revenue: number;
  // Revenue of only the lines that have a usable cost — the denominator that
  // pairs with costOfGoodsSold so the margin stays honest.
  costedRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  // True when every line on the order has a usable, plausible cost.
  verified: boolean;
  unresolvedLines: UnresolvedCostLine[];
};

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function plainLine(line: UnknownRecord): UnknownRecord {
  return typeof line?.toObject === 'function' ? line.toObject() : { ...line };
}

function lineProduct(line: UnknownRecord): UnknownRecord | null {
  return record(line.cartProduct) ?? record(line.product);
}

function lineCostProduct(line: UnknownRecord): UnknownRecord | null {
  const liveProduct = record(line.product);
  return liveProduct && Object.prototype.hasOwnProperty.call(liveProduct, 'marketPrice')
    ? liveProduct
    : lineProduct(line);
}

function normalizedUnit(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function hasCurrentFinancialSnapshot(line: UnknownRecord): boolean {
  return Number(line.financialSnapshotVersion) >= ORDER_FINANCIAL_SNAPSHOT_VERSION;
}

function parseObjectMap(value: unknown): UnknownRecord | null {
  if (record(value)) {
    return record(value);
  }
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  try {
    return record(JSON.parse(value));
  } catch {
    return null;
  }
}

function parseArray(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter((entry) => record(entry)) as UnknownRecord[];
  }
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? (parsed.filter((entry) => record(entry)) as UnknownRecord[])
      : [];
  } catch {
    return [];
  }
}

function mappedUnitPrice(value: unknown, unit: string): number | null {
  const map = parseObjectMap(value);
  if (!map) {
    return null;
  }
  const entry = Object.entries(map).find(
    ([key]) => normalizedUnit(key) === unit,
  );
  return entry ? finiteNumber(entry[1]) : null;
}

function resolveSellingPrice(
  line: UnknownRecord,
  product: UnknownRecord,
  businessId?: unknown,
): number | null {
  const snapshotted = finiteNumber(line.unitSellingPrice);
  if (snapshotted !== null && snapshotted >= 0) {
    return snapshotted;
  }

  const unit = normalizedUnit(line.unit);
  if (product.version === 'v2') {
    const discounted = mappedUnitPrice(product.discountedUnit, unit);
    const standard = mappedUnitPrice(product.unit, unit);
    return discounted ?? standard ?? finiteNumber(product.discountPrice);
  }

  const normalizedBusinessId = String(
    record(businessId)?._id ?? record(businessId)?.id ?? businessId ?? '',
  );
  const specialPrice = Array.isArray(product.specialPrices)
    ? product.specialPrices.find((entry: UnknownRecord) => {
        const customerId = record(entry.customerId)?._id ?? entry.customerId;
        return String(customerId ?? '') === normalizedBusinessId;
      })
    : undefined;

  return (
    finiteNumber(specialPrice?.price) ?? finiteNumber(product.discountPrice)
  );
}

/**
 * How many base/stock units (the unit `marketPrice` and `quantity` are tracked in)
 * are consumed by ONE of the given selling unit.
 *
 * Q/U (`newUnit[].quantity`) is the number of base/stock units contained in one of
 * that pricing unit — e.g. 1 oplo = 8 zebra crosses => Q/U 8. The purchase/stock unit
 * is itself 1 base unit. Returns null when the selling unit differs from the purchase
 * unit and has no mapping, so callers fail safe instead of guessing.
 */
export function resolvePurchaseUnitConversion(
  product: UnknownRecord,
  sellingUnitValue: unknown,
): number | null {
  const sellingUnit = normalizedUnit(sellingUnitValue);
  const purchaseUnit = normalizedUnit(product.purchaseUnit);
  if (sellingUnit && purchaseUnit && sellingUnit === purchaseUnit) {
    return 1;
  }

  const mappings = parseArray(product.newUnit);
  const sellingMapping = mappings.find(
    (entry) => normalizedUnit(entry.unit) === sellingUnit,
  );
  const baseUnitsPerSellingUnit = finiteNumber(sellingMapping?.quantity);
  if (baseUnitsPerSellingUnit !== null && baseUnitsPerSellingUnit > 0) {
    const purchaseMapping = mappings.find(
      (entry) => normalizedUnit(entry.unit) === purchaseUnit,
    );
    const baseUnitsPerPurchaseUnit = finiteNumber(purchaseMapping?.quantity) ?? 1;
    return baseUnitsPerSellingUnit / baseUnitsPerPurchaseUnit;
  }

  // Untracked products have no stock-unit conversion — marketPrice is the cost of
  // one sold unit — so treat each selling unit as 1 cost unit instead of refusing.
  if (product.trackQuantity === false) {
    return 1;
  }

  return sellingUnit && purchaseUnit && sellingUnit !== purchaseUnit ? null : 1;
}

function resolveBaseQuantityPerSellingUnit(
  line: UnknownRecord,
  product: UnknownRecord,
): number | null {
  const snapshotted = hasCurrentFinancialSnapshot(line)
    ? finiteNumber(line.baseQuantityPerSellingUnit)
    : null;
  if (snapshotted !== null && snapshotted > 0) {
    return snapshotted;
  }

  return resolvePurchaseUnitConversion(product, line.unit);
}

function resolveBaseUnitCost(
  line: UnknownRecord,
  product: UnknownRecord,
): number | null {
  const snapshotted = hasCurrentFinancialSnapshot(line)
    ? finiteNumber(line.baseUnitCost)
    : null;
  if (snapshotted !== null && snapshotted > 0) {
    return snapshotted;
  }

  // marketPrice is the inventory acquisition cost for one purchase/base unit.
  if (!Object.prototype.hasOwnProperty.call(product, 'marketPrice')) {
    return null;
  }
  const cost = finiteNumber(product.marketPrice);
  return cost !== null && cost > 0 ? cost : null;
}

export function snapshotOrderFinancialLines(
  lines: UnknownRecord[] = [],
  businessId?: unknown,
  orderDiscount = 0,
): UnknownRecord[] {
  const prepared = lines.map((source) => {
    const line = plainLine(source);
    const product = lineProduct(line);
    const costProduct = lineCostProduct(line);
    const quantity = Math.max(0, finiteNumber(line.quantity) ?? 0);
    const unitSellingPrice = product
      ? resolveSellingPrice(line, product, businessId)
      : null;
    const baseUnitCost = costProduct
      ? resolveBaseUnitCost(line, costProduct)
      : null;
    const conversion = costProduct
      ? resolveBaseQuantityPerSellingUnit(line, costProduct)
      : null;
    const grossLineRevenue = Math.max(0, (unitSellingPrice ?? 0) * quantity);

    return {
      line,
      quantity,
      unitSellingPrice,
      baseUnitCost,
      conversion,
      grossLineRevenue,
    };
  });

  const grossRevenue = prepared.reduce(
    (sum, entry) => sum + entry.grossLineRevenue,
    0,
  );
  const safeDiscount = Math.min(
    Math.max(0, Number(orderDiscount) || 0),
    grossRevenue,
  );
  let allocatedSoFar = 0;

  return prepared.map((entry, index) => {
    const isLast = index === prepared.length - 1;
    const allocatedDiscount = isLast
      ? safeDiscount - allocatedSoFar
      : grossRevenue > 0
        ? (entry.grossLineRevenue / grossRevenue) * safeDiscount
        : 0;
    allocatedSoFar += allocatedDiscount;

    if (
      entry.unitSellingPrice === null ||
      entry.baseUnitCost === null ||
      entry.conversion === null
    ) {
      return entry.line;
    }

    const totalBaseQuantity = entry.quantity * entry.conversion;
    const totalCost = entry.baseUnitCost * totalBaseQuantity;
    const netLineRevenue = entry.grossLineRevenue - allocatedDiscount;

    const snapshot: OrderFinancialSnapshot = {
      financialSnapshotVersion: ORDER_FINANCIAL_SNAPSHOT_VERSION,
      unitSellingPrice: entry.unitSellingPrice,
      grossLineRevenue: entry.grossLineRevenue,
      allocatedDiscount,
      netLineRevenue,
      baseUnitCost: entry.baseUnitCost,
      baseQuantityPerSellingUnit: entry.conversion,
      totalBaseQuantity,
      totalCost,
      grossProfit: netLineRevenue - totalCost,
    };

    return { ...entry.line, ...snapshot };
  });
}

export function summarizeOrderFinancials(
  order: UnknownRecord,
): OrderFinancialSummary {
  const lines = [
    ...(Array.isArray(order.products) ? order.products : []),
    ...(Array.isArray(order.additionalProducts)
      ? order.additionalProducts
      : []),
  ];

  // Profit is attributed line by line, NOT all-or-nothing per order. Each line's
  // revenue always counts toward total revenue; a line only feeds gross profit
  // when it has a resolvable cost. When one line can't be costed we drop just that
  // line from profit — keeping the rest of the order's real margin instead of
  // discarding the whole order.
  //
  // Revenue is summed from the (frozen) per-line snapshots, NOT order.totalPrice,
  // which can drift when items are added/edited after checkout. netLineRevenue is
  // already net of the allocated discount; a line missing it falls back to
  // grossLineRevenue, then to a live price off the frozen cart line. Fees are
  // never line items, so revenue excludes delivery/service.
  let lineRevenueTotal = 0;
  let costedLineRevenue = 0;
  let costOfGoodsSold = 0;
  let anyPriceableLine = false;
  let verified = lines.length > 0;
  const unresolvedLines: UnresolvedCostLine[] = [];

  for (const source of lines) {
    const line = plainLine(source);
    const product = lineProduct(line);
    const quantity = finiteNumber(line.quantity);

    // --- per-line revenue ---
    let lineRevenue = 0;
    const netLineRevenue = finiteNumber(line.netLineRevenue);
    const grossLineRevenue = finiteNumber(line.grossLineRevenue);
    if (netLineRevenue !== null) {
      lineRevenue = netLineRevenue;
      anyPriceableLine = true;
    } else if (grossLineRevenue !== null && grossLineRevenue >= 0) {
      lineRevenue = grossLineRevenue;
      anyPriceableLine = true;
    } else {
      const unitSellingPrice =
        product && quantity !== null && quantity > 0
          ? resolveSellingPrice(line, product, order.business)
          : null;
      if (unitSellingPrice !== null && quantity !== null) {
        lineRevenue = Math.max(0, unitSellingPrice * quantity);
        anyPriceableLine = true;
      }
    }
    lineRevenueTotal += lineRevenue;

    // --- per-line cost ---
    let lineCost: number | null = null;
    const snapshottedCost = hasCurrentFinancialSnapshot(line)
      ? finiteNumber(line.totalCost)
      : null;
    if (snapshottedCost !== null && snapshottedCost >= 0) {
      lineCost = snapshottedCost;
    } else {
      const cost = product ? resolveBaseUnitCost(line, product) : null;
      const conversion = product
        ? resolveBaseQuantityPerSellingUnit(line, product)
        : null;
      if (
        quantity !== null &&
        quantity >= 0 &&
        cost !== null &&
        conversion !== null
      ) {
        lineCost = quantity * conversion * cost;
      }
    }

    const flag = (reason: UnresolvedCostReason) => {
      unresolvedLines.push({
        productName: String(
          record(product)?.name ?? line.name ?? 'Unknown product',
        ),
        unit: line.unit != null ? String(line.unit) : null,
        quantity,
        marketPrice: product ? finiteNumber(record(product)?.marketPrice) : null,
        sellingPrice: product
          ? resolveSellingPrice(line, product, order.business)
          : null,
        reason,
      });
    };

    // --- attribute to profit, or set aside ---
    if (lineCost === null) {
      // No resolvable cost: revenue still counted above, but this line does not
      // feed profit.
      verified = false;
      flag('no_market_price');
      continue;
    }
    // Cost resolved → counted in profit as-is. A wrong-but-present price (a typo)
    // is deliberately NOT excluded — it counts until corrected — but if it is an
    // obvious outlier we flag it so the profit swing has a visible cause.
    costedLineRevenue += lineRevenue;
    costOfGoodsSold += lineCost;
    if (lineRevenue > 0 && lineCost > SUSPECTED_PRICE_MULTIPLE * lineRevenue) {
      flag('suspected_price');
    }
  }

  // Two regimes:
  // (a) Line-priceable orders (modern snapshots): revenue and profit are
  //     attributed per line, so a single uncosted/outlier line is dropped while
  //     the rest of the order's margin still counts.
  // (b) Legacy orders whose lines carry no per-line revenue: revenue falls back to
  //     the recorded payable total minus fees (the original definition). We can't
  //     split that across lines, so profit reverts to all-or-nothing — counted
  //     only when every line is costed, excluded (0) otherwise.
  let revenue: number;
  let costedRevenue: number;
  if (anyPriceableLine) {
    revenue = lineRevenueTotal;
    costedRevenue = costedLineRevenue;
  } else {
    const payableTotal = finiteNumber(order.totalPrice);
    const additionalTotal = finiteNumber(order.additionalTotalPrice) ?? 0;
    const deliveryFee = finiteNumber(order.deliveryFee) ?? 0;
    const serviceCharge = finiteNumber(order.serviceCharge) ?? 0;
    revenue =
      payableTotal === null
        ? 0
        : Math.max(
            0,
            payableTotal + additionalTotal - deliveryFee - serviceCharge,
          );
    if (verified) {
      costedRevenue = revenue;
    } else {
      // Can't attribute the payable total to specific lines, so don't count a
      // partial cost against unattributed revenue — exclude this order's profit.
      costedRevenue = 0;
      costOfGoodsSold = 0;
    }
  }

  return {
    revenue: Math.max(0, revenue),
    costedRevenue: Math.max(0, costedRevenue),
    costOfGoodsSold,
    grossProfit: Math.max(0, costedRevenue) - costOfGoodsSold,
    verified,
    unresolvedLines,
  };
}
