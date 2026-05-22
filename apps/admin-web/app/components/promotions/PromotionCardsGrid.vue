<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import PromotionCard from '~/components/promotions/PromotionCard.vue';
import type { AdminPromotionListItem } from '~/types/promotions';
import type { InventoryTableMeta } from '~/types/inventory';

const props = defineProps<{
  promotions: AdminPromotionListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyPromotionId?: string | null;
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  edit: [promotion: AdminPromotionListItem];
  duplicate: [promotion: AdminPromotionListItem];
  activate: [promotion: AdminPromotionListItem];
  deactivate: [promotion: AdminPromotionListItem];
  delete: [promotion: AdminPromotionListItem];
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
    <div v-if="loading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-52 animate-pulse rounded-[24px] bg-grey-55" />
    </div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <PromotionCard
        v-for="promotion in promotions"
        :key="promotion.id"
        :promotion="promotion"
        :selected="selectedSet.has(promotion.id)"
        :busy="busyPromotionId === promotion.id"
        @toggle-select="toggleSelect"
        @edit="emit('edit', promotion)"
        @duplicate="emit('duplicate', promotion)"
        @activate="emit('activate', promotion)"
        @deactivate="emit('deactivate', promotion)"
        @delete="emit('delete', promotion)"
      />
    </div>

    <PaginationBar
      v-if="!loading && promotions.length > 0"
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
