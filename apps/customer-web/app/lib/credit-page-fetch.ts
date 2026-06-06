import {
  parseCreditAccount,
  parseCreditApplications,
  parseCreditRepaymentHistory,
  parseCreditRequests,
  parseUpcomingCreditPayment,
} from '~/lib/credit-api';
import type {
  CreditListMeta,
  CustomerCreditAccount,
  CustomerCreditApplication,
  CustomerCreditRepayment,
  CustomerCreditRequest,
  CustomerUpcomingCreditPayment,
} from '~/types/credit';

export type CreditPagePayload = {
  canBuyOnCredit: boolean | null;
  applications: CustomerCreditApplication[];
  account: CustomerCreditAccount | null;
  creditRequests: CustomerCreditRequest[];
  repayments: CustomerCreditRepayment[];
  upcomingPayment: CustomerUpcomingCreditPayment;
  creditMeta: CreditListMeta;
  repaymentMeta: CreditListMeta;
  loadError: string | null;
};

export function createEmptyCreditPagePayload(): CreditPagePayload {
  return {
    canBuyOnCredit: null,
    applications: [],
    account: null,
    creditRequests: [],
    repayments: [],
    upcomingPayment: null,
    creditMeta: { page: 1, limit: 10, total: 0 },
    repaymentMeta: { page: 1, limit: 10, total: 0 },
    loadError: null,
  };
}

export async function fetchCreditPagePayload(): Promise<CreditPagePayload> {
  const { $creditApi, $apiClient } = useNuxtApp();

  try {
    const [businessResponse, applicationsResponse, accountResponse, requestsResponse, repaymentsResponse, upcomingResponse] =
      await Promise.all([
        $apiClient
          .get<{ data?: Record<string, unknown> }>('/business')
          .catch(() => null),
        $creditApi.listApplications({ page: 1, limit: 200 }).catch(() => null),
        $creditApi.getCreditAccount().catch(() => null),
        $creditApi.listRequests({ page: 1, limit: 10 }).catch(() => null),
        $creditApi.listRepaymentHistory({ page: 1, limit: 10 }).catch(() => null),
        $creditApi.getUpcomingPayment().catch(() => null),
      ]);

    const businessData = businessResponse?.data;
    const canBuyOnCredit =
      businessData && typeof businessData.canBuyOnCredit === 'boolean'
        ? businessData.canBuyOnCredit
        : null;

    const applicationsResult = parseCreditApplications(applicationsResponse, 1, 200);
    const accountResult = parseCreditAccount(accountResponse);
    const requestsResult = parseCreditRequests(requestsResponse, 1, 10);
    const repaymentsResult = parseCreditRepaymentHistory(repaymentsResponse, 1, 10);
    const upcoming = parseUpcomingCreditPayment(upcomingResponse);

    return {
      canBuyOnCredit,
      applications: applicationsResult.items,
      account: accountResult,
      creditRequests: requestsResult.items,
      repayments: repaymentsResult.items,
      upcomingPayment: upcoming,
      creditMeta: requestsResult.meta,
      repaymentMeta: repaymentsResult.meta,
      loadError: null,
    };
  } catch (error) {
    return {
      ...createEmptyCreditPagePayload(),
      loadError:
        error instanceof Error ? error.message : 'Unable to load credit information right now',
    };
  }
}
