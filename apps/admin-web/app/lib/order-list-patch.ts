import {
  getOrderPaymentStatusLabel,
  getOrderStatusLabel,
} from '~/lib/order-constants';
import {
  getOrderPaymentStatusVariant,
  getOrderStatusVariant,
  normalizeOrderPaymentStatus,
  normalizeOrderStatus,
} from '~/lib/order-details';
import type { OrderPaymentStatus, OrderStatus } from '~/types/orders';

export function buildOrderStatusPatch(status: OrderStatus) {
  const normalizedStatus = normalizeOrderStatus(status);

  return {
    status: normalizedStatus,
    statusLabel: getOrderStatusLabel(normalizedStatus),
    statusVariant: getOrderStatusVariant(normalizedStatus),
  };
}

export function buildOrderPaymentStatusPatch(status: OrderPaymentStatus) {
  const normalizedStatus = normalizeOrderPaymentStatus(status);

  return {
    paymentStatus: normalizedStatus,
    paymentStatusLabel: getOrderPaymentStatusLabel(normalizedStatus),
    paymentStatusVariant: getOrderPaymentStatusVariant(normalizedStatus),
  };
}
