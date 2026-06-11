<script setup lang="ts">
import { Button } from '@gosource/ui';
import CreditDashboard from '~/components/credit/CreditDashboard.vue';
import CreditPageSkeleton from '~/components/credit/CreditPageSkeleton.vue';
import CreditGetStarted from '~/components/credit/CreditGetStarted.vue';
import CreditNotEligible from '~/components/credit/CreditNotEligible.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCreditPageData } from '~/composables/useCreditPageData';

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
    fastNav: true,
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
    <CreditPageSkeleton v-if="pagePending" />

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
