import { parseUnitPriceMap, type UnitPriceEntry } from '~/lib/product-details';
import { asRecord } from '~/lib/order-detail-compat';

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isLikelyUnitPriceMap(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.includes('":');
}

function lookupUnitMapPrice(entries: UnitPriceEntry[] | null, unit: string) {
  if (!entries?.length) {
    return null;
  }

  const normalized = unit.trim().toLowerCase();
  const match = entries.find((entry) => entry.normalizedKey === normalized);
  return match?.price ?? null;
}

function hasLegacyProductPricing(product: Record<string, unknown>) {
  return (
    toNumber(product.discountPrice) > 0 ||
    toNumber(product.marketPrice) > 0 ||
    toNumber(product.actualPrice) > 0 ||
    parseUnitPriceMap(product.discountedUnit) !== null ||
    parseUnitPriceMap(product.unit) !== null
  );
}

export function resolveLegacyOrderLineProduct(line: Record<string, unknown>) {
  const cartProduct = asRecord(line.cartProduct);
  const populatedProduct = asRecord(line.product);
  const candidates = [populatedProduct, cartProduct].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
  );

  return candidates.find(hasLegacyProductPricing) ?? cartProduct ?? populatedProduct;
}

export function resolveOrderLineUnit(line: Record<string, unknown>, product: Record<string, unknown>) {
  const fromLine = toStringValue(line.unit);
  if (fromLine && !isLikelyUnitPriceMap(fromLine)) {
    return fromLine;
  }

  for (const candidate of [product.purchaseUnit, product.newUnit]) {
    const next = toStringValue(candidate);
    if (next && !isLikelyUnitPriceMap(next)) {
      return next;
    }
  }

  const unitMap =
    parseUnitPriceMap(product.discountedUnit) ?? parseUnitPriceMap(product.unit);
  if (unitMap?.length === 1) {
    return unitMap[0]?.key ?? 'Standard pack';
  }

  return fromLine && !isLikelyUnitPriceMap(fromLine) ? fromLine : 'Standard pack';
}

export function calculateLegacyOrderLineTotal(
  line: Record<string, unknown>,
  product: Record<string, unknown>,
  businessId?: string,
) {
  const quantity = Math.max(0, toNumber(line.quantity));
  if (!quantity) {
    return 0;
  }

  const unit = resolveOrderLineUnit(line, product);
  const version = toStringValue(product.version);

  if (version === 'v2') {
    const unitMap =
      parseUnitPriceMap(product.discountedUnit) ?? parseUnitPriceMap(product.unit);
    const unitPrice = lookupUnitMapPrice(unitMap, unit);
    if (typeof unitPrice === 'number' && unitPrice > 0) {
      return unitPrice * quantity;
    }

    return toNumber(product.discountPrice) * quantity;
  }

  const pricingBusinessId = businessId ?? '';
  const specialPrices = Array.isArray(product.specialPrices) ? product.specialPrices : [];
  const specialPrice = specialPrices.find((entry) => {
    const record = asRecord(entry);
    return toStringValue(record?.customerId) === pricingBusinessId;
  });
  const special = asRecord(specialPrice);
  const price =
    special?.price !== undefined ? toNumber(special.price) : toNumber(product.discountPrice);

  return price * quantity;
}

export type ResolvedOrderLinePricing = {
  lineTotal: number;
  unit: string;
};

export function resolveOrderLinePricing(
  line: Record<string, unknown>,
  businessId?: string,
): ResolvedOrderLinePricing {
  const storedTotal = toNumber(line.totalPrice ?? line.lineTotal);
  const product = resolveLegacyOrderLineProduct(line);
  const unit = product ? resolveOrderLineUnit(line, product) : toStringValue(line.unit) || 'unit';

  if (storedTotal > 0) {
    return { lineTotal: storedTotal, unit };
  }

  if (product) {
    const calculated = calculateLegacyOrderLineTotal(line, product, businessId);
    if (calculated > 0) {
      return { lineTotal: calculated, unit };
    }
  }

  const quantity = Math.max(0, toNumber(line.quantity));
  const unitPrice = toNumber(line.unitPrice ?? line.price);
  if (quantity > 0 && unitPrice > 0) {
    return { lineTotal: quantity * unitPrice, unit };
  }

  return { lineTotal: 0, unit };
}

export type OrderLinePricingRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lineTotal: number;
};

export function applySubtotalFallbackToOrderLines(
  lines: OrderLinePricingRow[],
  subtotal: number,
): OrderLinePricingRow[] {
  if (subtotal <= 0 || lines.length === 0) {
    return lines;
  }

  const pricedTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (pricedTotal > 0) {
    return lines;
  }

  const weightTotal =
    lines.reduce((sum, line) => sum + (line.quantity > 0 ? line.quantity : 1), 0) ||
    lines.length;

  return lines.map((line) => {
    const weight = line.quantity > 0 ? line.quantity : 1;
    const lineTotal = Math.round((subtotal * weight) / weightTotal);

    return {
      ...line,
      lineTotal,
    };
  });
}

export function resolveOrderSubtotal(
  order: Record<string, unknown>,
  lineItems: Array<{ lineTotal: number }>,
) {
  const productsSubtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryFee = toNumber(order.deliveryFee);
  const serviceCharge = toNumber(order.serviceCharge);
  const discount = toNumber(order.discount);
  const storedSubtotal = toNumber(order.subtotal);
  const storedTotal = toNumber(order.totalPrice);

  if (productsSubtotal > 0) {
    return productsSubtotal;
  }

  if (storedSubtotal > 0) {
    return storedSubtotal;
  }

  return Math.max(0, storedTotal - deliveryFee - serviceCharge + discount);
}
