import type { ApiClient } from './client';
import type {
  ListOrdersQuery,
  OrderListResponse,
  OrderResponse,
  OrderTimelineResponse,
} from './types';

export function createOrderApi(api: ApiClient) {
  return {
    listOrders(query?: ListOrdersQuery) {
      const params = new URLSearchParams();
      params.set('page', String(query?.page ?? 1));
      params.set('limit', String(query?.limit ?? 10));

      if (query?.filterBy) {
        params.set('filterBy', query.filterBy);
      }
      if (query?.filterValue) {
        params.set('filterValue', query.filterValue);
      }
      if (query?.startDate) {
        params.set('startDate', query.startDate);
      }
      if (query?.endDate) {
        params.set('endDate', query.endDate);
      }
      if (query?.status) {
        params.set('status', query.status);
      }

      const search = query?.search?.trim();
      if (search) {
        params.set('search', search);
      }

      return api.get<OrderListResponse>(`/order?${params.toString()}`);
    },
    getOrder(orderId: string) {
      return api.get<OrderResponse>(`/order/${orderId}`);
    },
    getOrderTimeline(orderId: string) {
      return api.get<OrderTimelineResponse>(`/order/${orderId}/timeline`);
    },
    getOrderInvoiceUrl(orderId: string) {
      return `/api/proxy/order/${orderId}/invoice`;
    },
  };
}
