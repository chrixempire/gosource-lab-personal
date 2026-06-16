import type { OrderStatus } from '@gosource/api-client';

export type OrderStatusFilter =
  | 'ongoing'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export const ORDER_ONGOING_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'accepted',
  'ready',
  'partially_delivered',
];

/** Terminal order statuses grouped under "Completed" in gosource-web-app track orders. */
export const ORDER_COMPLETED_STATUSES: OrderStatus[] = [
  'delivered',
  'cancelled',
  'completed',
  'refunded',
  'returned',
];

export const ORDER_STATUS_FILTERS = new Set<OrderStatusFilter>([
  'ongoing',
  'delivered',
  'completed',
  'cancelled',
  'returned',
  'refunded',
]);

export function orderStatusesForFilter(filter: OrderStatusFilter): OrderStatus[] {
  if (filter === 'ongoing') {
    return ORDER_ONGOING_STATUSES;
  }

  if (filter === 'completed') {
    return ORDER_COMPLETED_STATUSES;
  }

  return [filter];
}

export function orderStatusFilterForRoute(filter: OrderStatusFilter) {
  return orderStatusesForFilter(filter).join(',');
}

export function orderMatchesFilter(status: OrderStatus, filter: OrderStatusFilter) {
  return orderStatusesForFilter(filter).includes(status);
}
