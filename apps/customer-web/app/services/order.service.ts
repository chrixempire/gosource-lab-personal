import type {
  ListOrdersQuery,
  OrderDetailRecord,
  OrderListResponse,
  OrderTimelineRecord,
} from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { extractApiErrorMessage } from '~/utils/api-error';

export function useCustomerOrderService() {
  const { $orderApi } = useNuxtApp();

  return {
    async listOrders(query?: ListOrdersQuery) {
      try {
        return (await $orderApi.listOrders(query)) as OrderListResponse;
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load orders right now'));
        throw error;
      }
    },
    async getOrder(orderId: string) {
      try {
        return (await $orderApi.getOrder(orderId)) as { data?: OrderDetailRecord };
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load order right now'));
        throw error;
      }
    },
    async getOrderTimeline(orderId: string) {
      try {
        const response = await $orderApi.getOrderTimeline(orderId);
        return (response.data ?? []) as OrderTimelineRecord[];
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to load order timeline right now'));
        throw error;
      }
    },
    getOrderInvoiceUrl(orderId: string) {
      return $orderApi.getOrderInvoiceUrl(orderId);
    },
  };
}
