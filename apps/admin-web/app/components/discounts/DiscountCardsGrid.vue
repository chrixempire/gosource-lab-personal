<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import DiscountCard from '~/components/discounts/DiscountCard.vue';
import type { AdminDiscountListItem } from '~/types/discounts';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  discounts: AdminDiscountListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyDiscountId?: string | null;
  copiedDiscountId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });
const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  copy: [discount: AdminDiscountListItem];
  edit: [discount: AdminDiscountListItem];
  activate: [discount: AdminDiscountListItem];
  deactivate: [discount: AdminDiscountListItem];
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
    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="i in 6" :key="i" class="h-52 animate-pulse rounded-[24px] bg-grey-55" />
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DiscountCard
        v-for="discount in discounts"
        :key="discount.id"
        :discount="discount"
        :selected="selectedSet.has(discount.id)"
        :busy="busyDiscountId === discount.id"
        :copied="copiedDiscountId === discount.id"
        @toggle-select="toggleSelect"
        @copy="emit('copy', discount)"
        @edit="emit('edit', discount)"
        @activate="emit('activate', discount)"
        @deactivate="emit('deactivate', discount)"
      />
    </div>
    <PaginationBar
      v-if="!loading && discounts.length > 0"
      :page="meta.page"
      :total-pages="meta.totalPages"
      :total-items="meta.total"
      :page-size="meta.limit"
      :has-next-page="meta.hasNext"
      :has-prev-page="meta.hasPrev"
      @change="emit('page', $event)"
      @page-size-change="emit('pageSize', $event)"
    />
  </div>
</template>
