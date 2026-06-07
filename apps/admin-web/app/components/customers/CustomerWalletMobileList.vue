<script setup lang="ts">
import { PaginationBar, StatusTag } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

type WalletRow = {
  id: string;
  description: string;
  reference: string;
  amountLabel: string;
  typeLabel: string;
  statusLabel: string;
  createdAtLabel: string;
};

defineProps<{
  rows: WalletRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pending?: boolean;
  error?: unknown;
}>();

const emit = defineEmits<{
  retry: [];
  page: [page: number];
  pageSize: [size: number];
}>();

function statusVariant(label: string) {
  if (label === 'Successful') return 'success';
  if (label === 'Cancelled') return 'negative';
  return 'warning';
}
</script>

<template>
  <div class="space-y-4">
    <AdminMobileCardsSkeleton v-if="pending" :count="8" />

    <LoadErrorState
      v-else-if="error && rows.length === 0"
      compact
      :error="error"
      load-failed-title="Unable to load wallet activity"
      resource-label="wallet activity"
      @retry="emit('retry')"
    />

    <p
      v-else-if="!rows.length"
      class="rounded-xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500"
    >
      No transactions found
    </p>

    <template v-else>
      <div :class="CREDIT_CARDS_GRID_CLASS">
        <article
          v-for="row in rows"
          :key="row.id"
          :class="[CREDIT_CARD_SHELL_CLASS, 'cursor-default hover:bg-white hover:border-grey-50']"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-grey-900">
                {{ row.description }} - #{{ row.reference }}
              </p>
              <p class="mt-1 text-xs text-grey-500">{{ row.createdAtLabel }}</p>
            </div>
            <StatusTag :variant="statusVariant(row.statusLabel)" size="medium">
              {{ row.statusLabel }}
            </StatusTag>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <AdminMobileCardStat label="Amount">{{ row.amountLabel }}</AdminMobileCardStat>
            <AdminMobileCardStat label="Type">{{ row.typeLabel }}</AdminMobileCardStat>
          </div>
        </article>
      </div>

      <PaginationBar
        v-if="meta.total > 0"
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </template>
  </div>
</template>
