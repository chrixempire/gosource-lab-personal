import type { OrderListFilters } from '~/types/orders';

export const ORDER_INFINITE_PAGE_SIZE = 25;

export const ORDER_TABLE_ROW_HEIGHT = 72;

/** Fixed card height (matches OrderCard). */
export const ORDER_CARD_HEIGHT = 346;

/** Gap between cards (columns and virtual rows). */
export const ORDER_CARD_ROW_GAP = 20;

export const ORDER_CARD_ROW_HEIGHT = ORDER_CARD_HEIGHT + ORDER_CARD_ROW_GAP;

export function orderListFilterKey(filters: OrderListFilters) {
  return JSON.stringify({
    amountMin: filters.amountMin,
    amountMax: filters.amountMax,
    business: filters.business,
    paymentMethod: filters.paymentMethod,
    paymentStatus: filters.paymentStatus,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
    reference: filters.reference.trim(),
  });
}
