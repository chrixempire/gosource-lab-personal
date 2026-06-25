type UnknownRecord = Record<string, any>;

// v3: Q/U now means base/stock units PER selling unit (e.g. 1 oplo = 8 zebra
// crosses -> Q/U 8), so conversion multiplies. v2 snapshots used the inverted
// ratio and are intentionally treated as stale so they recompute correctly.
export const ORDER_FINANCIAL_SNAPSHOT_VERSION = 3;

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

export type OrderFinancialSummary = {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  verified: boolean;
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

  // The recorded payable total is authoritative for historical revenue. Fees are
  // removed because the dashboard reports merchandise revenue only.
  const payableTotal = finiteNumber(order.totalPrice);
  const additionalTotal = finiteNumber(order.additionalTotalPrice) ?? 0;
  const deliveryFee = finiteNumber(order.deliveryFee) ?? 0;
  const serviceCharge = finiteNumber(order.serviceCharge) ?? 0;
  const revenue =
    payableTotal === null
      ? 0
      : Math.max(
          0,
          payableTotal + additionalTotal - deliveryFee - serviceCharge,
        );

  let costOfGoodsSold = 0;
  let verified = payableTotal !== null && lines.length > 0;

  for (const source of lines) {
    const line = plainLine(source);
    const snapshottedCost = hasCurrentFinancialSnapshot(line)
      ? finiteNumber(line.totalCost)
      : null;
    if (snapshottedCost !== null && snapshottedCost >= 0) {
      costOfGoodsSold += snapshottedCost;
      continue;
    }

    const product = lineProduct(line);
    const quantity = finiteNumber(line.quantity);
    const cost = product ? resolveBaseUnitCost(line, product) : null;
    const conversion = product
      ? resolveBaseQuantityPerSellingUnit(line, product)
      : null;

    if (
      quantity === null ||
      quantity < 0 ||
      cost === null ||
      conversion === null
    ) {
      verified = false;
      continue;
    }
    costOfGoodsSold += quantity * conversion * cost;
  }

  return {
    revenue,
    costOfGoodsSold,
    grossProfit: verified ? revenue - costOfGoodsSold : 0,
    verified,
  };
}
