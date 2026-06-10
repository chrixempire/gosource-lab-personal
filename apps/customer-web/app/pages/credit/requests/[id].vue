<script setup lang="ts">
import {
  Button,
  StatusTag,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
} from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import { useMediaQuery } from '@vueuse/core';
import CreditCancelRequestDialog from '~/components/credit/CreditCancelRequestDialog.vue';
import CreditGetCreditDialog from '~/components/credit/CreditGetCreditDialog.vue';
import CreditRepaymentScheduleCards from '~/components/credit/CreditRepaymentScheduleCards.vue';
import CreditRequestDetailSummary from '~/components/credit/CreditRequestDetailSummary.vue';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import {
  creditRequestDetailPageTitle,
  useCustomerPageHeader,
} from '~/composables/useCustomerPageHeader';
import {
  creditRepaymentScheduleStatusLabel,
  creditRepaymentScheduleStatusVariant,
  creditWorkflowStatusLabel,
  creditWorkflowStatusVariant,
} from '~/lib/credit-constants';
import { CREDIT_PAGE_ROUTES } from '~/lib/credit-routes';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_DATA_ROW_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';
import type {
  CustomerCreditAccount,
  CustomerCreditRequest,
  CustomerCreditRequestDetail,
} from '~/types/credit';
import { useCustomerCreditService } from '~/services/credit.service';

const runWhenSessionReady = useAuthenticatedFetch();
const route = useRoute();
const { setPageTitle, clearPageHeader } = useCustomerPageHeader();
const isCompactViewport = useMediaQuery('(max-width: 999px)');
const { getRequest, getCreditAccount } = useCustomerCreditService();

const creditAccount = ref<CustomerCreditAccount | null>(null);

const requestId = computed(() => String(route.params.id ?? ''));
const loading = ref(true);
const loadError = ref<string | null>(null);
const request = ref<CustomerCreditRequestDetail | null>(null);

const cancelOpen = ref(false);
const reapplyOpen = ref(false);

const showApprovedTerms = computed(
  () => request.value?.status === 'approved' || request.value?.status === 'completed',
);

const cancelTarget = computed((): CustomerCreditRequest | null => {
  if (!request.value) {
    return null;
  }
  return {
    id: request.value.id,
    reference: request.value.reference,
    requestType: request.value.requestType,
    status: request.value.status,
    requestedAmountKobo: request.value.requestedAmountKobo,
    repaidAmountKobo: request.value.repaidAmountKobo,
    createdAt: request.value.createdAt,
    requestedRepaymentFrequency: request.value.requestedRepaymentFrequency,
    requestedRepaymentDuration: request.value.requestedRepaymentDuration,
  };
});

const reapplyTarget = computed(() => cancelTarget.value);

async function loadRequest() {
  if (!requestId.value) {
    loadError.value = 'Credit request not found';
    loading.value = false;
    return;
  }

  loading.value = true;
  loadError.value = null;

  try {
    const [detail, account] = await Promise.all([
      getRequest(requestId.value, { silent: true }),
      getCreditAccount({ silent: true }),
    ]);
    request.value = detail;
    creditAccount.value = account;
    if (!request.value) {
      loadError.value = 'Credit request not found';
    }
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : 'Unable to load credit request right now';
  } finally {
    loading.value = false;
  }
}

function onCancelSuccess() {
  void navigateTo(CREDIT_PAGE_ROUTES.HOME);
}

function onReapplySuccess() {
  reapplyOpen.value = false;
  void navigateTo(CREDIT_PAGE_ROUTES.HOME);
}

watch(
  request,
  (value) => {
    if (value) {
      setPageTitle(creditRequestDetailPageTitle(value.requestType));
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  clearPageHeader();
});

onMounted(() => {
  void runWhenSessionReady(() => loadRequest());
});
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <div class="w-fit self-start">
      <Button
        type="button"
        variant="neutral"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="navigateTo(CREDIT_PAGE_ROUTES.HOME)"
      >
        Back to credit
      </Button>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-64 animate-pulse rounded bg-grey-55" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div v-for="index in 3" :key="index" class="h-24 animate-pulse rounded-lg bg-grey-55" />
      </div>
    </div>

    <div
      v-else-if="loadError || !request"
      class="rounded-lg border border-danger-100 bg-danger-50 p-6 text-center"
    >
      <p class="text-sm text-grey-700">{{ loadError ?? 'Credit request not found' }}</p>
      <Button class="mt-4" variant="outline" @click="loadRequest">Try again</Button>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-lg font-semibold text-grey-900">#{{ request.reference }}</p>
          <StatusTag
            :variant="creditWorkflowStatusVariant(request.status)"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ creditWorkflowStatusLabel(request.status) }}
          </StatusTag>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            v-if="request.status === 'pending'"
            variant="destructive"
            @click="cancelOpen = true"
          >
            Cancel request
          </Button>
          <Button
            v-else-if="request.status === 'rejected'"
            @click="reapplyOpen = true"
          >
            Reapply
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="customer-surface-card rounded-lg p-5">
          <p class="text-xs font-semibold uppercase text-grey-400">Requested</p>
          <p class="mt-2 text-xl font-semibold text-grey-900">
            {{ formatCreditFromKobo(request.requestedAmountKobo) }}
          </p>
        </div>
        <div class="customer-surface-card rounded-lg p-5">
          <p class="text-xs font-semibold uppercase text-grey-400">Repaid</p>
          <p class="mt-2 text-xl font-semibold text-grey-900">
            {{ formatCreditFromKobo(request.repaidAmountKobo) }}
          </p>
        </div>
        <div class="customer-surface-card rounded-lg p-5">
          <p class="text-xs font-semibold uppercase text-grey-400">Submitted</p>
          <p class="mt-2 text-xl font-semibold text-grey-900">
            {{ formatRequestDate(request.createdAt) }}
          </p>
        </div>
      </div>

      <div
        v-if="request.status === 'pending'"
        class="rounded-xl border border-grey-50 bg-background-on-canvas px-6 py-5 text-center text-sm text-grey-600"
      >
        <p class="font-medium text-grey-900">Credit request in review</p>
        <p class="mt-1">
          Your credit request is in review. You'll be notified once it has been approved.
        </p>
      </div>

      <div
        v-if="request.status === 'rejected' || request.status === 'cancelled'"
        class="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm"
      >
        <p class="font-medium text-grey-900">
          {{ request.status === 'cancelled' ? 'Request cancelled' : 'Request rejected' }}
        </p>
        <p v-if="request.rejectionReason" class="mt-1 text-grey-600">
          {{ request.rejectionReason }}
        </p>
      </div>

      <CreditRequestDetailSummary
        v-if="showApprovedTerms || request.status === 'pending'"
        :request="request"
        :show-approved-terms="showApprovedTerms"
      />

      <div v-if="request.schedules.length > 0" class="space-y-3">
        <h2 class="text-base font-semibold text-grey-900">Repayment schedule</h2>

        <CreditRepaymentScheduleCards
          v-if="isCompactViewport"
          :items="request.schedules"
        />

        <TableShell v-else :class="CUSTOMER_TABLE_PANEL_CLASS">
          <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
            <TableHeadRow
              class="grid grid-cols-[0.6fr_1fr_1fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-xs font-semibold uppercase text-grey-400"
            >
              <span>#</span>
              <span>Due date</span>
              <span>Principal</span>
              <span>Interest</span>
              <span>Amount due</span>
              <span>Status</span>
            </TableHeadRow>
          </TableHeader>
          <TableBody :class="CUSTOMER_TABLE_BODY_CLASS">
            <TableRow
              v-for="schedule in request.schedules"
              :key="schedule.id"
              :class="`${CUSTOMER_TABLE_DATA_ROW_CLASS} grid grid-cols-[0.6fr_1fr_1fr_1fr_1fr_0.8fr] gap-3 px-4 py-3`"
            >
              <TableCell>{{ schedule.installmentNumber || '—' }}</TableCell>
              <TableCell>{{ formatRequestDate(schedule.dueDate) }}</TableCell>
              <TableCell>{{ formatCreditFromKobo(schedule.principalAmountKobo) }}</TableCell>
              <TableCell>{{ formatCreditFromKobo(schedule.interestAmountKobo) }}</TableCell>
              <TableCell>{{ formatCreditFromKobo(schedule.remainingAmountKobo) }}</TableCell>
              <TableCell>
                <StatusTag :variant="creditRepaymentScheduleStatusVariant(schedule.status)">
                  {{ creditRepaymentScheduleStatusLabel(schedule.status) }}
                </StatusTag>
              </TableCell>
            </TableRow>
          </TableBody>
        </TableShell>
      </div>

      <CreditCancelRequestDialog
        v-model:open="cancelOpen"
        :request="cancelTarget"
        @success="onCancelSuccess"
      />
      <CreditGetCreditDialog
        v-model:open="reapplyOpen"
        request-type="initial"
        :account="creditAccount"
        :reapply-request="reapplyTarget"
        @success="onReapplySuccess"
      />
    </template>
  </div>
</template>
