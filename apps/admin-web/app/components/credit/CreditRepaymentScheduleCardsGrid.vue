<script setup lang="ts">
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import CreditRepaymentScheduleCard from '~/components/credit/CreditRepaymentScheduleCard.vue';
import {
  CREDIT_CARD_SKELETON_CLASS,
  CREDIT_CARDS_GRID_CLASS,
} from '~/lib/credit-page-layout';
import type { AdminRepaymentScheduleListItem } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  rows: AdminRepaymentScheduleListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  showDaysOverdue?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [row: AdminRepaymentScheduleListItem];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" :class="CREDIT_CARDS_GRID_CLASS">
      <div v-for="index in 6" :key="index" :class="CREDIT_CARD_SKELETON_CLASS" />
    </div>

    <div v-else :class="CREDIT_CARDS_GRID_CLASS">
      <CreditRepaymentScheduleCard
        v-for="row in rows"
        :key="row.id"
        :schedule="row"
        :show-days-overdue="showDaysOverdue"
        @view="emit('view', row)"
      />
    </div>

    <CreditTablePagination
      v-if="!loading && meta.total > 0"
      standalone
      :meta="meta"
      @page="emit('page', $event)"
      @page-size="emit('pageSize', $event)"
    />
  </div>
</template>
