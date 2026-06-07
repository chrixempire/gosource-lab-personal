<script setup lang="ts">
import { SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditConfirmPaymentDialog from '~/components/credit/CreditConfirmPaymentDialog.vue';
import CreditRepaymentCardsGrid from '~/components/credit/CreditRepaymentCardsGrid.vue';
import CreditRepaymentFilterBar from '~/components/credit/CreditRepaymentFilterBar.vue';
import CreditRepaymentStatCards from '~/components/credit/CreditRepaymentStatCards.vue';
import CreditRepaymentTable from '~/components/credit/CreditRepaymentTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminCapabilities } from '~/composables/useAdminCapabilities';
import { useCreditMutations } from '~/composables/useCreditMutations';
import { creditRepaymentListFiltersToApiQuery } from '~/lib/credit-filters';
import { parseRepaymentHistoryResponse } from '~/lib/credit-api';
import { parseCustomersListResponse } from '~/lib/customer-api';
import {
  CREDIT_LIST_SEARCH_CLASS,
  CREDIT_LIST_VIEW_TOOLBAR_CLASS,
} from '~/lib/credit-page-layout';
import type {
  AdminRepaymentListItem,
  CreditPaymentStatus,
  CreditRepaymentListFilters,
} from '~/types/credit';

const { updateHeader } = useAdminHeader();
const { canManage } = useAdminCapabilities();
const { busyId, confirmBankTransfer, rejectBankTransfer, downloadRepaymentInvoice } =
  useCreditMutations();
const { routeView, effectiveView, isCompactViewport, setView } = useCollectionRouteState('table');

const filters = ref<CreditRepaymentListFilters>({
  page: 1,
  limit: 10,
  search: '',
  businessIds: [],
  paymentMethod: [],
  startDate: '',
  endDate: '',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const confirmOpen = ref(false);
const selectedPaymentId = ref<string | null>(null);

const apiQuery = computed(() => creditRepaymentListFiltersToApiQuery(filters.value));

const { data: customersData } = useFetch<unknown>('/api/customers', {
  query: { page: 1, limit: 100 },
});

const businessFilterOptions = computed(() =>
  parseCustomersListResponse(customersData.value, 1, 100).rows.map((customer) => ({
    value: customer.id,
    label: customer.displayName,
  })),
);

const { data, pending, error, refresh } = await useFetch<unknown>(
  '/api/credit/repayments/payment-history',
  {
    query: apiQuery,
    watch: [apiQuery],
  },
);

const parsed = computed(() =>
  parseRepaymentHistoryResponse(data.value, filters.value.page, filters.value.limit),
);

const rows = computed(() => parsed.value.rows);

watch(
  () => filters.value.search,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.search) {
    return;
  }
  replaceFilters({ search: trimmed, page: 1 });
});

function replaceFilters(next: Partial<CreditRepaymentListFilters>) {
  filters.value = { ...filters.value, ...next };
}

function resetFilters() {
  filters.value = {
    page: 1,
    limit: filters.value.limit,
    search: '',
    businessIds: [],
    paymentMethod: [],
    startDate: '',
    endDate: '',
  };
  searchQuery.value = '';
}

async function onUpdateStatus(status: CreditPaymentStatus, id: string) {
  if (status === 'COMPLETED') {
    selectedPaymentId.value = id;
    confirmOpen.value = true;
    return;
  }
  try {
    await rejectBankTransfer(id);
    await refresh();
  } catch {
    // toast in composable
  }
}

async function onDownloadInvoice(row: AdminRepaymentListItem) {
  try {
    await downloadRepaymentInvoice(row);
  } catch {
    // toast in composable
  }
}

async function onConfirmPayment(amount: number) {
  if (!selectedPaymentId.value) return;
  try {
    await confirmBankTransfer(selectedPaymentId.value, amount);
    confirmOpen.value = false;
    selectedPaymentId.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

updateHeader({ title: 'Repayments' });
useHead({ title: 'Credit repayments' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <CreditRepaymentStatCards :summary="parsed.summary" />

    <div class="flex flex-col gap-4">
      <div :class="CREDIT_LIST_VIEW_TOOLBAR_CLASS">
        <SearchField
          v-model="searchQuery"
          placeholder="Search branches"
          :class="CREDIT_LIST_SEARCH_CLASS"
          :disabled="pending && rows.length === 0"
        />
        <ViewToggle
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>

      <CreditRepaymentFilterBar
        :filters="filters"
        :business-options="businessFilterOptions"
        @apply="replaceFilters"
        @clear-all="resetFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && rows.length === 0"
      :error="error"
      load-failed-title="Unable to load repayments"
      resource-label="repayment history"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && rows.length === 0"
      title="No repayments found"
      description="Adjust your filters or check back when payments are recorded."
    />

    <template v-else>
      <CreditRepaymentCardsGrid
        v-if="effectiveView === 'cards'"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        :allow-manage="canManage"
        @page="replaceFilters({ page: $event })"
        @page-size="replaceFilters({ limit: $event, page: 1 })"
        @update-status="onUpdateStatus"
        @download-invoice="onDownloadInvoice"
      />
      <CreditRepaymentTable
        v-else
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        :allow-manage="canManage"
        @page="replaceFilters({ page: $event })"
        @page-size="replaceFilters({ limit: $event, page: 1 })"
        @update-status="onUpdateStatus"
        @download-invoice="onDownloadInvoice"
      />
    </template>

    <CreditConfirmPaymentDialog
      v-model:open="confirmOpen"
      :loading="Boolean(selectedPaymentId && busyId === selectedPaymentId)"
      @confirm="onConfirmPayment"
    />
  </div>
</template>
