<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
import { Button } from '@gosource/ui';
import CreditDashboard from '~/components/credit/CreditDashboard.vue';
import CreditGetStarted from '~/components/credit/CreditGetStarted.vue';
import CreditNotEligible from '~/components/credit/CreditNotEligible.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCreditPageData } from '~/composables/useCreditPageData';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);

const creditPage = useCreditPageData();

const {
  loadError,
  account,
  creditRequests,
  repayments,
  upcomingPayment,
  creditMeta,
  repaymentMeta,
  lastInitialApplication,
  lastIncreaseApplication,
  showGetStarted,
  showNotEligible,
  showDashboard,
  applyPayload,
  fetchPayload,
  loadPage,
  loadCreditRequests,
  loadRepayments,
  createEmptyCreditPagePayload,
} = creditPage;

const { data: creditPayload, pending: pagePending } = await useAuthenticatedAsyncData(
  'credit-page',
  () => fetchPayload(),
  {
    default: () => createEmptyCreditPagePayload(),
    staleAfterMs: 60_000,
  },
);

watch(
  creditPayload,
  (payload) => {
    if (payload) {
      applyPayload(payload);
    }
  },
  { immediate: true },
);

const isOwner = computed(() => isBusinessOwnerSession(session.value));
const creditHistoryLoading = ref(false);
const repaymentHistoryLoading = ref(false);

async function refreshCreditHistory(page: number, limit = creditMeta.value.limit) {
  creditHistoryLoading.value = true;
  try {
    await loadCreditRequests(page, limit);
  } finally {
    creditHistoryLoading.value = false;
  }
}

async function refreshRepaymentHistory(page: number, limit = repaymentMeta.value.limit) {
  repaymentHistoryLoading.value = true;
  try {
    await loadRepayments(page, limit);
  } finally {
    repaymentHistoryLoading.value = false;
  }
}

async function refreshCreditPage() {
  await loadPage();
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="pagePending" class="space-y-4">
      <div class="h-8 w-48 animate-pulse rounded bg-grey-55" />
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div v-for="index in 3" :key="index" class="h-28 animate-pulse rounded-lg bg-grey-55" />
      </div>
      <div class="h-64 animate-pulse rounded-lg bg-grey-55" />
    </div>

    <div
      v-else-if="loadError"
      class="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center"
    >
      <p class="text-sm text-grey-700">{{ loadError }}</p>
      <Button class="mt-4" variant="outline" @click="refreshCreditPage()">Try again</Button>
    </div>

    <CreditNotEligible v-else-if="showNotEligible" />
    <CreditGetStarted v-else-if="showGetStarted" />
    <CreditDashboard
      v-else-if="showDashboard"
      :account="account"
      :last-initial-application="lastInitialApplication"
      :last-increase-application="lastIncreaseApplication"
      :credit-requests="creditRequests"
      :repayments="repayments"
      :credit-meta="creditMeta"
      :repayment-meta="repaymentMeta"
      :upcoming-payment="upcomingPayment"
      :is-owner="isOwner"
      :credit-loading="creditHistoryLoading"
      :repayment-loading="repaymentHistoryLoading"
      @credit-page="refreshCreditHistory"
      @credit-limit="(limit) => refreshCreditHistory(1, limit)"
      @repayment-page="refreshRepaymentHistory"
      @repayment-limit="(limit) => refreshRepaymentHistory(1, limit)"
      @refresh="refreshCreditPage()"
    />
  </div>
</template>
