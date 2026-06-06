<script setup lang="ts">
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import CreditRepaymentCard from '~/components/credit/CreditRepaymentCard.vue';
import {
  CREDIT_CARD_SKELETON_CLASS,
  CREDIT_CARDS_GRID_CLASS,
} from '~/lib/credit-page-layout';
import type { AdminRepaymentListItem, CreditPaymentStatus } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  rows: AdminRepaymentListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  allowManage?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  updateStatus: [status: CreditPaymentStatus, id: string];
  downloadInvoice: [row: AdminRepaymentListItem];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" :class="CREDIT_CARDS_GRID_CLASS">
      <div v-for="index in 6" :key="index" :class="CREDIT_CARD_SKELETON_CLASS" />
    </div>

    <div v-else :class="CREDIT_CARDS_GRID_CLASS">
      <CreditRepaymentCard
        v-for="row in rows"
        :key="row.id"
        :repayment="row"
        :allow-manage="allowManage"
        @update-status="emit('updateStatus', $event, row.id)"
        @download-invoice="emit('downloadInvoice', row)"
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
