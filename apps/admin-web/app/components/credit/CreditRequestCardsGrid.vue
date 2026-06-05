<script setup lang="ts">
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import CreditRequestCard from '~/components/credit/CreditRequestCard.vue';
import {
  CREDIT_CARD_SKELETON_CLASS,
  CREDIT_CARDS_GRID_CLASS,
} from '~/lib/credit-page-layout';
import type { AdminCreditRequestListItem } from '~/types/credit';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  rows: AdminCreditRequestListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [row: AdminCreditRequestListItem];
  viewCreditHistory: [row: AdminCreditRequestListItem];
}>();

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

function toggleSelect(id: string, selected: boolean) {
  const next = new Set(selectedIds.value);
  if (selected) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading" :class="CREDIT_CARDS_GRID_CLASS">
      <div v-for="index in 6" :key="index" :class="CREDIT_CARD_SKELETON_CLASS" />
    </div>

    <div v-else :class="CREDIT_CARDS_GRID_CLASS">
      <CreditRequestCard
        v-for="row in rows"
        :key="row.id"
        :request="row"
        :selected="selectedSet.has(row.id)"
        @toggle-select="toggleSelect"
        @view="emit('view', row)"
        @view-credit-history="emit('viewCreditHistory', row)"
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
