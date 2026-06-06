import type {
  CreateCreditRepaymentPayload,
  CreateCreditRequestPayload,
  CreditPaginationQuery,
} from '@gosource/api-client';
import { toast } from '@gosource/ui';
import {
  parseCreditAccount,
  parseCreditApplicationDetail,
  parseCreditApplications,
  parseCreditRepaymentHistory,
  parseCreditRequestDetail,
  parseCreditRequests,
  parseUpcomingCreditPayment,
} from '~/lib/credit-api';
import type {
  CustomerCreditAccount,
  CustomerCreditApplication,
  CustomerCreditApplicationsResult,
  CustomerCreditRepaymentHistoryResult,
  CustomerCreditRequestDetail,
  CustomerCreditRequestsResult,
  CustomerUpcomingCreditPayment,
} from '~/types/credit';
import { extractApiErrorMessage } from '~/utils/api-error';

function isNotFoundError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    Number((error as { status: number }).status) === 404
  );
}

export function useCustomerCreditService() {
  const { $creditApi } = useNuxtApp();

  return {
    async listApplications(
      query?: CreditPaginationQuery,
      options?: { silent?: boolean },
    ): Promise<CustomerCreditApplicationsResult> {
      try {
        const response = await $creditApi.listApplications(query);
        return parseCreditApplications(response, query?.page, query?.limit ?? 200);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load credit applications right now'));
        }
        throw error;
      }
    },

    async getApplication(
      creditId: string,
      options?: { silent?: boolean },
    ): Promise<CustomerCreditApplication | null> {
      try {
        const response = await $creditApi.getApplication(creditId);
        return parseCreditApplicationDetail(response);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load credit application right now'));
        }
        throw error;
      }
    },

    async submitApplication(formData: FormData) {
      try {
        return await $creditApi.submitApplication(formData);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to submit credit application right now'));
        throw error;
      }
    },

    async submitLimitIncrease(formData: FormData) {
      try {
        return await $creditApi.submitLimitIncrease(formData);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to submit limit increase request right now'));
        throw error;
      }
    },

    async listRequests(
      query?: CreditPaginationQuery,
      options?: { silent?: boolean },
    ): Promise<CustomerCreditRequestsResult> {
      try {
        const response = await $creditApi.listRequests(query);
        return parseCreditRequests(response, query?.page, query?.limit);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load credit requests right now'));
        }
        throw error;
      }
    },

    async getRequest(
      requestId: string,
      options?: { silent?: boolean },
    ): Promise<CustomerCreditRequestDetail | null> {
      try {
        const response = await $creditApi.getRequest(requestId);
        return parseCreditRequestDetail(response);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load credit request right now'));
        }
        throw error;
      }
    },

    async createRequest(payload: CreateCreditRequestPayload) {
      try {
        return await $creditApi.createRequest(payload);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to submit credit request right now'));
        throw error;
      }
    },

    async listRepaymentHistory(
      query?: CreditPaginationQuery,
      options?: { silent?: boolean },
    ): Promise<CustomerCreditRepaymentHistoryResult> {
      try {
        const response = await $creditApi.listRepaymentHistory(query);
        return parseCreditRepaymentHistory(response, query?.page, query?.limit);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load repayment history right now'));
        }
        throw error;
      }
    },

    async getCreditAccount(options?: { silent?: boolean }): Promise<CustomerCreditAccount | null> {
      try {
        const response = await $creditApi.getCreditAccount();
        return parseCreditAccount(response);
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load credit account right now'));
        }
        throw error;
      }
    },

    async cancelRequest(requestId: string) {
      try {
        return await $creditApi.cancelRequest(requestId);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to cancel credit request right now'));
        throw error;
      }
    },

    async makePayment(payload: CreateCreditRepaymentPayload) {
      try {
        return await $creditApi.makePayment(payload);
      } catch (error) {
        toast.error(extractApiErrorMessage(error, 'Unable to process credit payment right now'));
        throw error;
      }
    },

    async getUpcomingPayment(options?: { silent?: boolean }): Promise<CustomerUpcomingCreditPayment> {
      try {
        const response = await $creditApi.getUpcomingPayment();
        return parseUpcomingCreditPayment(response);
      } catch (error) {
        if (!options?.silent) {
          toast.error(extractApiErrorMessage(error, 'Unable to load upcoming payment right now'));
        }
        throw error;
      }
    },
  };
}
