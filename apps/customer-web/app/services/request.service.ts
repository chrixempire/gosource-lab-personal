import type {
  AddRequestProductPayload,
  ApplyCouponPayload,
  ApplyCouponResponse,
  ApproveRequestPayload,
  ApproveRequestResponse,
  CreateRequestPayload,
  RequestListResponse,
  RequestResponse,
  RejectRequestPayload,
  ListRequestsQuery,
  UpdateRequestPayload,
  UpdateRequestProductQuantityPayload,
} from '@gosource/api-client';
import { reportCustomerApiError } from '~/utils/api-error';

export function useCustomerRequestService() {
  const { $requestApi } = useNuxtApp();

  return {
    async createRequest(payload: CreateRequestPayload) {
      try {
        return (await $requestApi.createRequest(payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to create request right now');
        throw error;
      }
    },
    async createRequestFromShoppingList(listId: string, payload: CreateRequestPayload) {
      try {
        return (await $requestApi.createRequestFromShoppingList(listId, payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to create request from list right now');
        throw error;
      }
    },
    async listRequests(query?: ListRequestsQuery) {
      try {
        return (await $requestApi.listRequests(query)) as RequestListResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load requests right now');
        throw error;
      }
    },
    async getRequest(requestId: string) {
      try {
        return (await $requestApi.getRequest(requestId)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to load request right now');
        throw error;
      }
    },
    async approveRequest(requestId: string, payload?: ApproveRequestPayload) {
      try {
        return (await $requestApi.approveRequest(requestId, payload)) as ApproveRequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to approve request right now');
        throw error;
      }
    },
    async rejectRequest(requestId: string, payload: RejectRequestPayload) {
      try {
        return (await $requestApi.rejectRequest(requestId, payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to reject request right now');
        throw error;
      }
    },
    async cancelRequest(requestId: string) {
      try {
        return (await $requestApi.cancelRequest(requestId)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to cancel request right now');
        throw error;
      }
    },
    async updateRequestProductQuantity(payload: UpdateRequestProductQuantityPayload) {
      try {
        return (await $requestApi.updateRequestProductQuantity(payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to update product quantity');
        throw error;
      }
    },
    async removeRequestProduct(requestId: string, cartLineId: string) {
      try {
        return (await $requestApi.removeRequestProduct(requestId, cartLineId)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to remove product from request');
        throw error;
      }
    },
    async addRequestProduct(requestId: string, payload: AddRequestProductPayload) {
      try {
        return (await $requestApi.addRequestProduct(requestId, payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to add product to request');
        throw error;
      }
    },
    async updateRequest(requestId: string, payload: UpdateRequestPayload) {
      try {
        return (await $requestApi.updateRequest(requestId, payload)) as RequestResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to update request');
        throw error;
      }
    },
    async applyCoupon(requestId: string, payload: ApplyCouponPayload) {
      try {
        return (await $requestApi.applyCoupon(requestId, payload)) as ApplyCouponResponse;
      } catch (error) {
        reportCustomerApiError(error, 'Unable to apply coupon');
        throw error;
      }
    },
    async removeCoupon(requestId: string) {
      try {
        return await $requestApi.removeCoupon(requestId);
      } catch (error) {
        reportCustomerApiError(error, 'Unable to remove coupon');
        throw error;
      }
    },
  };
}
