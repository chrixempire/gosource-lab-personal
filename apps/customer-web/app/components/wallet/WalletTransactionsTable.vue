<script setup lang="ts">
import type { WalletTransactionRecord } from '@gosource/api-client';
import {
  Checkbox,
  PaginationBar,
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
import { formatRequestCurrency, formatRequestDate } from '~/lib/request-details';
import {
  WALLET_TRANSACTIONS_SKELETON_COLUMNS,
  WALLET_TRANSACTIONS_TABLE_GRID,
} from '~/lib/wallet-transactions-table-layout';
import {
  walletTransactionStatusVariant,
  walletTransactionTypeIndicatorClass,
} from '~/lib/wallet-transaction-display';

const props = defineProps<{
  transactions: WalletTransactionRecord[];
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  selectionChange: [ids: string[]];
  rowClick: [transaction: WalletTransactionRecord];
}>();

const selectedIds = ref<string[]>([]);

const skeletonRowCount = computed(() => Math.max(1, Math.min(props.pageSize, 15)));

const allSelected = computed(
  () =>
    props.transactions.length > 0 &&
    props.transactions.every((row) => selectedIds.value.includes(row.id)),
);

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedIds.value.length === 0) {
    return false;
  }

  if (allSelected.value) {
    return true;
  }

  return 'indeterminate';
});

function toggleAllRows(value: boolean | 'indeterminate') {
  if (value === true) {
    selectedIds.value = props.transactions.map((row) => row.id);
  } else {
    selectedIds.value = [];
  }
  emit('selectionChange', [...selectedIds.value]);
}

function toggleRowSelection(id: string, value: boolean | 'indeterminate') {
  if (value === true) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
  } else {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
  }
  emit('selectionChange', [...selectedIds.value]);
}

watch(
  () => props.transactions,
  () => {
    selectedIds.value = selectedIds.value.filter((id) =>
      props.transactions.some((row) => row.id === id),
    );
    emit('selectionChange', [...selectedIds.value]);
  },
);
</script>

<template>
  <TableShell class="flex w-full flex-col">
    <TableHeader>
      <TableHeadRow
        :style="{ gridTemplateColumns: WALLET_TRANSACTIONS_TABLE_GRID }"
        :class="loading ? 'pointer-events-none opacity-60' : undefined"
      >
        <TableCell class="flex items-center justify-center">
          <Checkbox
            :model-value="selectionState"
            :disabled="loading"
            aria-label="Select all transactions"
            @update:model-value="toggleAllRows"
          />
        </TableCell>
        <TableCell>Title</TableCell>
        <TableCell>Amount</TableCell>
        <TableCell>Reference</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Date</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="WALLET_TRANSACTIONS_SKELETON_COLUMNS"
      :grid-template-columns="WALLET_TRANSACTIONS_TABLE_GRID"
      :row-count="skeletonRowCount"
    />

    <TableBody v-else>
      <TableRow
        v-for="row in transactions"
        :key="row.id"
        class="cursor-pointer transition-colors duration-150 hover:bg-primary-50/45 even:bg-[#FAFBFC] even:hover:bg-primary-50/45"
        :style="{ gridTemplateColumns: WALLET_TRANSACTIONS_TABLE_GRID }"
        @click="emit('rowClick', row)"
      >
        <TableCell class="flex items-center justify-center">
          <Checkbox
            :model-value="selectedIds.includes(row.id)"
            :aria-label="`Select ${row.reference}`"
            @update:model-value="toggleRowSelection(row.id, $event)"
            @click.stop
          />
        </TableCell>
        <TableCell>{{ row.description }}</TableCell>
        <TableCell>
          {{ row.type === 'credit' ? '+' : '-' }}{{ formatRequestCurrency(row.amount) }}
        </TableCell>
        <TableCell>{{ row.reference }}</TableCell>
        <TableCell>
          <div class="flex items-center gap-2 capitalize">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="walletTransactionTypeIndicatorClass(row.type)"
              aria-hidden="true"
            />
            <span class="text-sm text-grey-900">{{ row.type }}</span>
          </div>
        </TableCell>
        <TableCell>
          <StatusTag
            :variant="walletTransactionStatusVariant(row.status)"
            size="medium"
            class="capitalize"
          >
            {{ row.status }}
          </StatusTag>
        </TableCell>
        <TableCell>{{ formatRequestDate(row.createdAt) }}</TableCell>
      </TableRow>
    </TableBody>

    <div
      v-if="!loading && !transactions.length"
      class="py-10 text-center text-sm text-grey-300"
    >
      No transactions found for the current filter.
    </div>

    <TableFooter v-if="totalItems > 0">
      <PaginationBar
        :page="page"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :has-next-page="hasNextPage"
        :has-prev-page="hasPrevPage"
        :disabled="loading"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </TableFooter>
  </TableShell>
</template>
