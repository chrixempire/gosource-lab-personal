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

  return [filter];
}

export function orderStatusFilterForRoute(filter: OrderStatusFilter) {
  return orderStatusesForFilter(filter).join(',');
}

export function orderMatchesFilter(status: OrderStatus, filter: OrderStatusFilter) {
  return orderStatusesForFilter(filter).includes(status);
}
