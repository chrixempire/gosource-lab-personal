import type { CustomerMeResponse } from '@gosource/api-client';
import {
  createEmptyCreditPagePayload,
  fetchCreditPagePayload,
  type CreditPagePayload,
} from '~/lib/credit-page-fetch';
import {
  findLastIncreaseApplication,
  findLastInitialApplication,
  shouldShowCreditGetStarted,
  shouldShowCreditNotEligible,
} from '~/lib/credit-page-state';
import type {
  CustomerCreditAccount,
  CustomerCreditApplication,
  CustomerCreditRepayment,
  CustomerCreditRequest,
  CustomerUpcomingCreditPayment,
} from '~/types/credit';
import { useCustomerCreditService } from '~/services/credit.service';

export function useCreditPageData() {
  const creditService = useCustomerCreditService();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);

  const loadError = ref<string | null>(null);
  const applications = ref<CustomerCreditApplication[]>([]);
  const account = ref<CustomerCreditAccount | null>(null);
  const creditRequests = ref<CustomerCreditRequest[]>([]);
  const repayments = ref<CustomerCreditRepayment[]>([]);
  const upcomingPayment = ref<CustomerUpcomingCreditPayment>(null);
  const canBuyOnCredit = ref<boolean | null>(null);

  const creditMeta = ref({ page: 1, limit: 10, total: 0 });
  const repaymentMeta = ref({ page: 1, limit: 10, total: 0 });

  const lastInitialApplication = computed(() => findLastInitialApplication(applications.value));
  const lastIncreaseApplication = computed(() => findLastIncreaseApplication(applications.value));

  const showGetStarted = computed(() =>
    shouldShowCreditGetStarted(applications.value, account.value),
  );

  const showNotEligible = computed(() =>
    shouldShowCreditNotEligible(canBuyOnCredit.value, applications.value, account.value),
  );

  const showDashboard = computed(
    () => !loadError.value && !showNotEligible.value && !showGetStarted.value,
  );

  const hasPendingApplication = computed(
    () =>
      lastInitialApplication.value?.status === 'pending' ||
      lastIncreaseApplication.value?.status === 'pending',
  );

  function applyPayload(payload: CreditPagePayload) {
    canBuyOnCredit.value = payload.canBuyOnCredit;
    applications.value = payload.applications;
    account.value = payload.account;
    creditRequests.value = payload.creditRequests;
    repayments.value = payload.repayments;
    upcomingPayment.value = payload.upcomingPayment;
    creditMeta.value = payload.creditMeta;
    repaymentMeta.value = payload.repaymentMeta;
    loadError.value = payload.loadError;
  }

  async function fetchPayload() {
    return fetchCreditPagePayload();
  }

  async function loadPage(options?: { silent?: boolean }) {
    const payload = await fetchPayload();
    applyPayload(payload);
    return payload;
  }

  async function loadCreditRequests(page: number, limit: number) {
    const result = await creditService.listRequests({ page, limit }, { silent: true });
    creditRequests.value = result.items;
    creditMeta.value = result.meta;
  }

  async function loadRepayments(page: number, limit: number) {
    const result = await creditService.listRepaymentHistory({ page, limit }, { silent: true });
    repayments.value = result.items;
    repaymentMeta.value = result.meta;
  }

  return {
    session,
    loadError,
    applications,
    account,
    creditRequests,
    repayments,
    upcomingPayment,
    canBuyOnCredit,
    creditMeta,
    repaymentMeta,
    lastInitialApplication,
    lastIncreaseApplication,
    showGetStarted,
    showNotEligible,
    showDashboard,
    hasPendingApplication,
    applyPayload,
    fetchPayload,
    loadPage,
    loadCreditRequests,
    loadRepayments,
    createEmptyCreditPagePayload,
  };
}
