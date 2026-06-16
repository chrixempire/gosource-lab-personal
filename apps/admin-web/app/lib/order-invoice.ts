import { resolveOrderSubtotal, resolveOrderTotalPrice } from '~/lib/order-line-pricing';
import {
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

export function buildOrderInvoicePreview(order: Record<string, unknown>): OrderInvoicePreview {
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

  const lineItems = mapLegacyOrderLineItems(order).map((item) => ({
    name: item.name,
    quantityLabel: `${item.quantity} ${item.unit}`.trim(),
    unitPrice: item.quantity > 0 ? item.lineTotal / item.quantity : item.lineTotal,
    totalPrice: item.lineTotal,
  }));

  const deliveryFee = Number(order.deliveryFee ?? 0);
  const serviceCharge = Number(order.serviceCharge ?? 0);
  const discount = Number(order.discount ?? 0);
  const subtotal = resolveOrderSubtotal(order, lineItems);
  const total = resolveOrderTotalPrice(order, lineItems);

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
