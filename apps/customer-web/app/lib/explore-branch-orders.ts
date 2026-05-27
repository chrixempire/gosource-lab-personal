import type { ListOrdersQuery, OrderListResponse, OrderRecord } from '@gosource/api-client';
import { currentMonthQueryRange } from '~/lib/explore-procurement-insight';

const ORDERS_PAGE_LIMIT = 50;
const MAX_ORDER_PAGES = 20;

export type ExploreMonthRange = {
  startDate: string;
  endDate: string;
};

export async function fetchBranchOrdersInRange(
  listOrders: (query?: ListOrdersQuery) => Promise<OrderListResponse>,
  branchId: string,
  range: ExploreMonthRange = currentMonthQueryRange(),
): Promise<{ orders: OrderRecord[]; ordersTotal: number }> {
  const orders: OrderRecord[] = [];
  let ordersTotal = 0;
  let page = 1;

  while (page <= MAX_ORDER_PAGES) {
    const response = await listOrders({
      branchId,
      page,
      limit: ORDERS_PAGE_LIMIT,
      startDate: range.startDate,
      endDate: range.endDate,
    });

    if (page === 1) {
      ordersTotal = response.meta?.total ?? 0;
    }

    orders.push(...(response.data ?? []));

    if (!response.meta?.hasNextPage) {
      break;
    }

    page += 1;
  }

  if (ordersTotal <= 0 && orders.length > 0) {
    ordersTotal = orders.length;
  }

  return { orders, ordersTotal };
}
