<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import { CREDIT_LIST_PAGINATION_PANEL_CLASS } from '~/lib/credit-page-layout';
import type { InventoryTableMeta } from '~/types/inventory';

defineProps<{
  meta: InventoryTableMeta;
  /** Wrap in a bordered panel (card grid view). */
  standalone?: boolean;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
}>();
</script>

<template>
  <div v-if="standalone" :class="CREDIT_LIST_PAGINATION_PANEL_CLASS">
    <PaginationBar
      :page="meta.page"
      :page-size="meta.limit"
      :total-pages="meta.totalPages"
      :total-items="meta.total"
      :has-next-page="meta.hasNext"
      :has-prev-page="meta.hasPrev"
      inherit-radius
      @change="emit('page', $event)"
      @page-size-change="emit('pageSize', $event)"
    />
  </div>
  <PaginationBar
    v-else
    :page="meta.page"
    :page-size="meta.limit"
    :total-pages="meta.totalPages"
    :total-items="meta.total"
    :has-next-page="meta.hasNext"
    :has-prev-page="meta.hasPrev"
    inherit-radius
    @change="emit('page', $event)"
    @page-size-change="emit('pageSize', $event)"
  />
</template>
