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
} from '@gosource/ui';
import { useDebounceFn, useMediaQuery } from '@vueuse/core';
import CreditRepaymentHistoryCards from '~/components/credit/CreditRepaymentHistoryCards.vue';
import CreditRequestActionsMenu from '~/components/credit/CreditRequestActionsMenu.vue';
import CreditRequestHistoryCards from '~/components/credit/CreditRequestHistoryCards.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import {
  creditWorkflowStatusLabel,
  creditWorkflowStatusVariant,
} from '~/lib/credit-constants';
import { creditRequestPath } from '~/lib/credit-routes';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_DATA_ROW_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
  CREDIT_REQUEST_TABLE_GRID_TEMPLATE,
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
  isOwner?: boolean;
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
    const haystack = `${row.reference} ${row.requestType} ${row.status}`.toLowerCase();
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
        :is-owner="isOwner"
        @cancel="emit('cancelRequest', $event)"
        @reapply="emit('reapply', $event)"
      />
      <TableShell v-else :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']">
        <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
          <TableHeadRow
            :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID_TEMPLATE }"
            class="gap-3 px-4 py-3 text-xs font-semibold uppercase text-grey-400"
          >
            <span>Reference</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Status</span>
            <span class="sr-only">Actions</span>
          </TableHeadRow>
        </TableHeader>
        <TableBody :class="CUSTOMER_TABLE_BODY_CLASS">
          <TableRow
            v-for="row in filteredCreditRequests"
            :key="row.id"
            :class="[CUSTOMER_TABLE_DATA_ROW_CLASS, 'grid gap-3 px-4 py-3']"
            :style="{ gridTemplateColumns: CREDIT_REQUEST_TABLE_GRID_TEMPLATE }"
            @click="navigateTo(creditRequestPath(row.id))"
          >
            <TableCell class="font-medium text-grey-900">#{{ row.reference }}</TableCell>
            <TableCell>{{ formatCreditFromKobo(row.requestedAmountKobo) }}</TableCell>
            <TableCell>{{ formatRequestDate(row.createdAt) }}</TableCell>
            <TableCell>
              <StatusTag
                :variant="creditWorkflowStatusVariant(row.status)"
                size="medium"
                class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
              >
                {{ creditWorkflowStatusLabel(row.status) }}
              </StatusTag>
            </TableCell>
            <TableCell class="flex items-center justify-end">
              <CreditRequestActionsMenu
                :can-cancel="isOwner && row.status === 'pending'"
                :can-reapply="isOwner && row.status === 'rejected'"
                @view-details="navigateTo(creditRequestPath(row.id))"
                @cancel="emit('cancelRequest', row)"
                @reapply="emit('reapply', row)"
              />
            </TableCell>
          </TableRow>
          <p
            v-if="!creditLoading && filteredCreditRequests.length === 0"
            class="px-4 py-8 text-center text-sm text-grey-400"
          >
            No credit requests yet.
          </p>
        </TableBody>
        <TableFooter>
          <PaginationBar
            :page="creditMeta.page"
            :total-pages="creditTotalPages"
            :total-items="creditMeta.total"
            :page-size="creditMeta.limit"
            :has-next-page="creditMeta.page < creditTotalPages"
            :has-prev-page="creditMeta.page > 1"
            @update:page="emit('creditPage', $event)"
            @update:page-size="emit('creditLimit', $event)"
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
        @update:page="emit('creditPage', $event)"
        @update:page-size="emit('creditLimit', $event)"
      />
    </template>

    <template v-else>
      <CreditRepaymentHistoryCards
        v-if="isCompactViewport"
        :items="filteredRepayments"
        :loading="repaymentLoading"
      />
      <TableShell v-else :class="CUSTOMER_TABLE_PANEL_CLASS">
        <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
          <TableHeadRow
            class="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-xs font-semibold uppercase text-grey-400"
          >
            <span>Reference</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Status</span>
          </TableHeadRow>
        </TableHeader>
        <TableBody :class="CUSTOMER_TABLE_BODY_CLASS">
          <TableRow
            v-for="row in filteredRepayments"
            :key="row.id"
            :class="`${CUSTOMER_TABLE_DATA_ROW_CLASS} grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-3 px-4 py-3`"
          >
            <TableCell class="font-medium text-grey-900">{{ row.referenceCode }}</TableCell>
            <TableCell>{{ formatCreditFromKobo(row.paymentAmountKobo) }}</TableCell>
            <TableCell>{{ formatRequestDate(row.createdAt) }}</TableCell>
            <TableCell>
              <StatusTag variant="default">{{ row.status || '—' }}</StatusTag>
            </TableCell>
          </TableRow>
          <p
            v-if="!repaymentLoading && filteredRepayments.length === 0"
            class="px-4 py-8 text-center text-sm text-grey-400"
          >
            No repayments yet.
          </p>
        </TableBody>
        <TableFooter>
          <PaginationBar
            :page="repaymentMeta.page"
            :total-pages="repaymentTotalPages"
            :total-items="repaymentMeta.total"
            :page-size="repaymentMeta.limit"
            :has-next-page="repaymentMeta.page < repaymentTotalPages"
            :has-prev-page="repaymentMeta.page > 1"
            @update:page="emit('repaymentPage', $event)"
            @update:page-size="emit('repaymentLimit', $event)"
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
        @update:page="emit('repaymentPage', $event)"
        @update:page-size="emit('repaymentLimit', $event)"
      />
    </template>
  </div>
</template>
