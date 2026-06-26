import { resolveOrderSubtotal, resolveOrderTotalPrice } from '~/lib/order-line-pricing';
import {
  mapLegacyOrderAdditionalItems,
  mapLegacyOrderLineItems,
  mapLegacyOrderToDetailsView,
} from '~/lib/order-details';
import {
  formatOrderActorName,
  resolveOrderBranchLabel,
  resolveOrderBusiness,
  resolveOrderInitiator,
} from '~/lib/order-detail-compat';
import type { OrderInvoicePreview } from '~/types/order-invoice';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/**
 * Which slice of the order to render on the invoice:
 * - `combined` (default): original + added items, full totals.
 * - `original`: only the originally ordered items + fees.
 * - `added`: only the items added after creation, no delivery/service fees.
 */
export type OrderInvoiceVariant = 'combined' | 'original' | 'added';

export function buildOrderInvoicePreview(
  order: Record<string, unknown>,
  variant: OrderInvoiceVariant = 'combined',
): OrderInvoicePreview {
  const view = mapLegacyOrderToDetailsView(order);
  const business = resolveOrderBusiness(order);
  const initiator = resolveOrderInitiator(order);
  const reference = String(order.reference ?? '—');

  const businessName =
    (business && typeof business.businessName === 'string' && business.businessName) ||
    view.customerFullName ||
    '—';

  const customerName = formatOrderActorName(initiator) ?? view.customerFullName;

  const branchRecord =
    typeof order.branch === 'string' ? null : asRecord(order.branch);
  const branchName =
    (branchRecord &&
      typeof branchRecord.branchName === 'string' &&
      branchRecord.branchName.trim()) ||
    resolveOrderBranchLabel(order);
  const address = asRecord(order.address);
  const deliveryAddress =
    view.addressLine !== '—'
      ? view.addressLine
      : [address?.streetAddress, address?.lga, address?.state].filter(Boolean).join(', ') ||
        branchName;

  const mappedLines = mapLegacyOrderLineItems(order);
  const baseLineItems = mappedLines.map((item) => ({
    name: item.name,
    quantityLabel: `${item.quantity} ${item.unit}`.trim(),
    unitPrice: item.quantity > 0 ? item.lineTotal / item.quantity : item.lineTotal,
    totalPrice: item.lineTotal,
  }));

  // Items added to the order after creation appear on the invoice too.
  const additionalItems = mapLegacyOrderAdditionalItems(order);
  const additionalLineItems = additionalItems.map((item) => ({
    name: `${item.name} (added)`,
    quantityLabel: `${item.quantity} ${item.unit}`.trim(),
    unitPrice: item.unitPrice,
    totalPrice: item.lineTotal,
  }));
  const additionalTotal = additionalItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const orderDeliveryFee = Number(order.deliveryFee ?? 0);
  const orderServiceCharge = Number(order.serviceCharge ?? 0);
  const orderDiscount = Number(order.discount ?? 0);
  const baseSubtotal = resolveOrderSubtotal(order, mappedLines);
  const baseTotal = resolveOrderTotalPrice(order, mappedLines);

  let lineItems: typeof baseLineItems;
  let subtotal: number;
  let total: number;
  let deliveryFee: number;
  let serviceCharge: number;
  let discount: number;

  if (variant === 'added') {
    // Added items only — billed without delivery/service fees.
    lineItems = additionalLineItems;
    subtotal = additionalTotal;
    deliveryFee = 0;
    serviceCharge = 0;
    discount = 0;
    total = additionalTotal;
  } else if (variant === 'original') {
    lineItems = baseLineItems;
    subtotal = baseSubtotal;
    deliveryFee = orderDeliveryFee;
    serviceCharge = orderServiceCharge;
    discount = orderDiscount;
    total = baseTotal;
  } else {
    lineItems = [...baseLineItems, ...additionalLineItems];
    subtotal = baseSubtotal + additionalTotal;
    deliveryFee = orderDeliveryFee;
    serviceCharge = orderServiceCharge;
    discount = orderDiscount;
    total = baseTotal + additionalTotal;
  }

  const itemCount = lineItems.length;

  return {
    referenceLabel: reference ? `#${reference}` : '—',
    orderDateLabel: view.createdLabel,
    businessName,
    branchName: branchName || '—',
    customerName,
    deliveryAddress: deliveryAddress || '—',
    orderIdLabel: reference || '—',
    itemCount,
    itemsOrderedLabel: String(itemCount),
    paymentMethod: view.paymentMethodLabel,
    lineItems,
    subtotal,
    deliveryFee,
    discount,
    serviceCharge,
    total,
  };
}
