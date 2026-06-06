import type { ApiClient } from './client';

export type CreditPaginationQuery = {
  page?: number;
  limit?: number;
};

export type CreateCreditRequestPayload = {
  requestedAmount: number;
  requestType: 'initial' | 'topup';
  requestedRepaymentFrequency?: string;
  requestedRepaymentDuration?: number;
};

export type CreateCreditRepaymentPayload = {
  paymentAmount: number;
  paymentMethod: string;
  transactionReference?: string;
  paymentNote?: string;
};

function buildCreditQuery(query?: CreditPaginationQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query?.page ?? 1));
  params.set('limit', String(query?.limit ?? 10));
  return `?${params.toString()}`;
}

export function createCreditApi(api: ApiClient) {
  return {
    listApplications: (query?: CreditPaginationQuery) =>
      api.get<unknown>(`/credit${buildCreditQuery(query)}`),
    getApplication: (creditId: string) => api.get<unknown>(`/credit/${creditId}`),
    submitApplication: (body: FormData) =>
      api.request<unknown>('/credit', { method: 'POST', body }),
    submitLimitIncrease: (body: FormData) =>
      api.request<unknown>('/credit/limit-increase', { method: 'POST', body }),
    listRequests: (query?: CreditPaginationQuery) =>
      api.get<unknown>(`/credit/requests${buildCreditQuery(query)}`),
    getRequest: (requestId: string) => api.get<unknown>(`/credit/requests/${requestId}`),
    createRequest: (payload: CreateCreditRequestPayload) =>
      api.post<unknown>('/credit/requests', payload),
    listRepaymentHistory: (query?: CreditPaginationQuery) =>
      api.get<unknown>(`/credit/repayment-history${buildCreditQuery(query)}`),
    getCreditAccount: () => api.get<unknown>('/credit/credit-account'),
    cancelRequest: (requestId: string) =>
      api.patch<unknown>(`/credit/cancel-request/${requestId}`),
    makePayment: (payload: CreateCreditRepaymentPayload) =>
      api.post<unknown>('/credit/payment', payload),
    getUpcomingPayment: () => api.get<unknown>('/credit/upcoming-payment'),
  };
}
