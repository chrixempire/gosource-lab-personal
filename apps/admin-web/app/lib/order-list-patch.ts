import { ORDER_PAYMENT_STATUS_OPTIONS, ORDER_STATUS_OPTIONS } from '~/lib/order-constants';
import {
  getOrderPaymentStatusVariant,
  getOrderStatusVariant,
  normalizeOrderPaymentStatus,
  normalizeOrderStatus,
} from '~/lib/order-details';
import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

export function buildOrderStatusPatch(status: OrderStatus) {
  const normalizedStatus = normalizeOrderStatus(status);
  const option = ORDER_STATUS_OPTIONS.find((entry) => entry.value === normalizedStatus);

  return {
    status: normalizedStatus,
    statusLabel: option?.label ?? String(normalizedStatus),
    statusVariant: getOrderStatusVariant(normalizedStatus),
  };
}

export function buildOrderPaymentStatusPatch(status: OrderPaymentStatus) {
  const normalizedStatus = normalizeOrderPaymentStatus(status);
  const option = ORDER_PAYMENT_STATUS_OPTIONS.find((entry) => entry.value === normalizedStatus);

  return {
    paymentStatus: normalizedStatus,
    paymentStatusLabel: option?.label ?? String(normalizedStatus),
    paymentStatusVariant: getOrderPaymentStatusVariant(normalizedStatus),
  };
}
