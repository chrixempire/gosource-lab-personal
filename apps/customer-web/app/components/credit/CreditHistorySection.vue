<script setup lang="ts">
import {
  PaginationBar,
  SegmentedControl,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { useDebounceFn, useMediaQuery } from '@vueuse/core';
import CreditRepaymentHistoryCards from '~/components/credit/CreditRepaymentHistoryCards.vue';
import CreditRequestActionsMenu from '~/components/credit/CreditRequestActionsMenu.vue';
import CreditRequestHistoryCards from '~/components/credit/CreditRequestHistoryCards.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import {
  creditRequestStatusLabel,
  creditRequestStatusVariant,
  creditRequestTypeLabel,
} from '~/lib/credit-constants';
import { creditRequestPath } from '~/lib/credit-routes';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import {
  CREDIT_REPAYMENT_HISTORY_SKELETON_COLUMNS,
  CREDIT_REPAYMENT_TABLE_GRID,
  CREDIT_REQUEST_HISTORY_SKELETON_COLUMNS,
  CREDIT_REQUEST_TABLE_GRID_TEMPLATE,
} from '~/lib/credit-history-table-layout';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_DATA_ROW_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
  CUSTOMER_TABLE_STRIPED_ROW_CLASS,
} from '~/lib/customer-table-layout';
import type {
  CustomerCreditRepayment,
  CustomerCreditRequest,
  CreditListMeta,
} from '~/types/credit';

const props = defineProps<{
  creditRequests: CustomerCreditRequest[];
  repayments: CustomerCreditRepayment[];
  creditMeta: CreditListMeta;
  repaymentMeta: CreditListMeta;
  creditLoading?: boolean;
  repaymentLoading?: boolean;
}>();

const emit = defineEmits<{
  creditPage: [page: number];
  creditLimit: [limit: number];
  repaymentPage: [page: number];
  repaymentLimit: [limit: number];
  cancelRequest: [request: CustomerCreditRequest];
  reapply: [request: CustomerCreditRequest];
}>();

const isCompactViewport = useMediaQuery('(max-width: 999px)');
const activeTab = ref('credit');
const searchValue = ref('');
const debouncedSearch = ref('');

const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value.trim().toLowerCase();
}, 200);

watch(searchValue, (value) => {
  syncSearch(value);
});

const tabOptions = [
  { label: 'Credit history', value: 'credit' },
  { label: 'Repayment history', value: 'repayment' },
];

const filteredCreditRequests = computed(() => {
  if (!debouncedSearch.value) {
    return props.creditRequests;
  }
  return props.creditRequests.filter((row) => {
    const haystack = `${row.reference} ${creditRequestTypeLabel(row.requestType)} ${row.requestType} ${creditRequestStatusLabel(row.status)} ${row.status}`.toLowerCase();
    return haystack.includes(debouncedSearch.value);
  });
});

const filteredRepayments = computed(() => {
  if (!debouncedSearch.value) {
    return props.repayments;
  }
  return props.repayments.filter((row) => {
    const haystack = `${row.referenceCode} ${row.paymentMethod} ${row.status}`.toLowerCase();
    return haystack.includes(debouncedSearch.value);
  });
});

const creditTotalPages = computed(() =>
  Math.max(1, Math.ceil(props.creditMeta.total / props.creditMeta.limit)),
);

const repaymentTotalPages = computed(() =>
  Math.max(1, Math.ceil(props.repaymentMeta.total / props.repaymentMeta.limit)),
);

const creditSkeletonRowCount = computed(() =>
  Math.max(1, Math.min(props.creditMeta.limit, 10)),
);

const repaymentSkeletonRowCount = computed(() =>
  Math.max(1, Math.min(props.repaymentMeta.limit, 10)),
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <SegmentedControl v-model="activeTab" :options="tabOptions" />
      <SearchField v-model="searchValue" placeholder="Search history" class="w-full sm:max-w-xs" />
    </div>

    <template v-if="activeTab === 'credit'">
      <CreditRequestHistoryCards
        v-if="isCompactViewport"
        :items="filteredCreditRequests"
        :loading="creditLoading"
        @cancel="emit('cancelRequest', $event)"
        @reapply="emit('reapply', $event)"
      />
      <TableShell v-else :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
        <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
          <TableHeadRow
            :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID_TEMPLATE }"
            :class="creditLoading ? 'pointer-events-none opacity-60' : undefined"
          >
            <TableCell>Reference</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Request type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell class="sr-only">Actions</TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableSkeleton
          v-if="creditLoading"
          :columns="CREDIT_REQUEST_HISTORY_SKELETON_COLUMNS"
          :grid-template-columns="CREDIT_REQUEST_TABLE_GRID_TEMPLATE"
          :row-count="creditSkeletonRowCount"
          :body-class="CUSTOMER_TABLE_BODY_CLASS"
        />

        <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
          <TableRow
            v-for="row in filteredCreditRequests"
            :key="row.id"
            :class="CUSTOMER_TABLE_DATA_ROW_CLASS"
            :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID_TEMPLATE }"
            @click="navigateTo(creditRequestPath(row.id))"
          >
            <TableCell>
              <p class="truncate text-base font-semibold text-grey-900">#{{ row.reference }}</p>
            </TableCell>
            <TableCell>{{ formatCreditFromKobo(row.requestedAmountKobo) }}</TableCell>
            <TableCell>{{ creditRequestTypeLabel(row.requestType) }}</TableCell>
            <TableCell>{{ formatRequestDate(row.createdAt) }}</TableCell>
            <TableCell>
              <StatusTag :variant="creditRequestStatusVariant(row.status)">
                {{ creditRequestStatusLabel(row.status) }}
              </StatusTag>
            </TableCell>
            <TableCell class="flex items-center justify-end">
              <CreditRequestActionsMenu
                :can-cancel="row.status === 'pending'"
                :can-reapply="row.status === 'rejected'"
                @view-details="navigateTo(creditRequestPath(row.id))"
                @cancel="emit('cancelRequest', row)"
                @reapply="emit('reapply', row)"
              />
            </TableCell>
          </TableRow>
          <div
            v-if="filteredCreditRequests.length === 0"
            class="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center text-sm text-grey-300"
          >
            No credit requests yet.
          </div>
        </TableBody>

        <TableFooter>
          <PaginationBar
            :page="creditMeta.page"
            :total-pages="creditTotalPages"
            :total-items="creditMeta.total"
            :page-size="creditMeta.limit"
            :has-next-page="creditMeta.page < creditTotalPages"
            :has-prev-page="creditMeta.page > 1"
            :disabled="creditLoading"
            @change="emit('creditPage', $event)"
            @page-size-change="emit('creditLimit', $event)"
          />
        </TableFooter>
      </TableShell>

      <PaginationBar
        v-if="isCompactViewport"
        class="rounded-[16px] border border-grey-50 bg-background-on-canvas px-3 py-2"
        :page="creditMeta.page"
        :total-pages="creditTotalPages"
        :total-items="creditMeta.total"
        :page-size="creditMeta.limit"
        :has-next-page="creditMeta.page < creditTotalPages"
        :has-prev-page="creditMeta.page > 1"
        :disabled="creditLoading"
        @change="emit('creditPage', $event)"
        @page-size-change="emit('creditLimit', $event)"
      />
    </template>

    <template v-else>
      <CreditRepaymentHistoryCards
        v-if="isCompactViewport"
        :items="filteredRepayments"
        :loading="repaymentLoading"
      />
      <TableShell v-else :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
        <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
          <TableHeadRow
            :style="{ gridTemplateColumns: CREDIT_REPAYMENT_TABLE_GRID }"
            :class="repaymentLoading ? 'pointer-events-none opacity-60' : undefined"
          >
            <TableCell>Reference</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableSkeleton
          v-if="repaymentLoading"
          :columns="CREDIT_REPAYMENT_HISTORY_SKELETON_COLUMNS"
          :grid-template-columns="CREDIT_REPAYMENT_TABLE_GRID"
          :row-count="repaymentSkeletonRowCount"
          :body-class="CUSTOMER_TABLE_BODY_CLASS"
        />

        <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
          <TableRow
            v-for="row in filteredRepayments"
            :key="row.id"
            :class="CUSTOMER_TABLE_STRIPED_ROW_CLASS"
            :style="{ gridTemplateColumns: CREDIT_REPAYMENT_TABLE_GRID }"
          >
            <TableCell>
              <p class="truncate text-base font-semibold text-grey-900">{{ row.referenceCode }}</p>
            </TableCell>
            <TableCell>{{ formatCreditFromKobo(row.paymentAmountKobo) }}</TableCell>
            <TableCell>{{ formatRequestDate(row.createdAt) }}</TableCell>
            <TableCell>
              <StatusTag variant="default">{{ row.status || '—' }}</StatusTag>
            </TableCell>
          </TableRow>
          <div
            v-if="filteredRepayments.length === 0"
            class="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center text-sm text-grey-300"
          >
            No repayments yet.
          </div>
        </TableBody>

        <TableFooter>
          <PaginationBar
            :page="repaymentMeta.page"
            :total-pages="repaymentTotalPages"
            :total-items="repaymentMeta.total"
            :page-size="repaymentMeta.limit"
            :has-next-page="repaymentMeta.page < repaymentTotalPages"
            :has-prev-page="repaymentMeta.page > 1"
            :disabled="repaymentLoading"
            @change="emit('repaymentPage', $event)"
            @page-size-change="emit('repaymentLimit', $event)"
          />
        </TableFooter>
      </TableShell>

      <PaginationBar
        v-if="isCompactViewport"
        class="rounded-[16px] border border-grey-50 bg-background-on-canvas px-3 py-2"
        :page="repaymentMeta.page"
        :total-pages="repaymentTotalPages"
        :total-items="repaymentMeta.total"
        :page-size="repaymentMeta.limit"
        :has-next-page="repaymentMeta.page < repaymentTotalPages"
        :has-prev-page="repaymentMeta.page > 1"
        :disabled="repaymentLoading"
        @change="emit('repaymentPage', $event)"
        @page-size-change="emit('repaymentLimit', $event)"
      />
    </template>
  </div>
</template>
