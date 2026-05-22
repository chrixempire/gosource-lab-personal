<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import CategoryCard from '~/components/inventory/CategoryCard.vue';
import type { AdminCategoryListItem, InventoryTableMeta } from '~/types/inventory';

defineProps<{
  categories: AdminCategoryListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  busyCategoryId?: string | null;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  view: [category: AdminCategoryListItem];
  edit: [category: AdminCategoryListItem];
  delete: [category: AdminCategoryListItem];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      <div
        v-for="index in 6"
        :key="`category-card-skeleton-${index}`"
        class="h-40 animate-pulse rounded-[24px] border border-grey-50 bg-white"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <CategoryCard
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :busy-category-id="busyCategoryId"
        @view="emit('view', category)"
        @edit="emit('edit', category)"
        @delete="emit('delete', category)"
      />
    </div>

    <PaginationBar
      v-if="meta.total > 0"
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
