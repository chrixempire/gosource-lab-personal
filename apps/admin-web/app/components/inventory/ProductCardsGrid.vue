<script setup lang="ts">
import { PaginationBar } from '@gosource/ui';
import ProductCard from '~/components/inventory/ProductCard.vue';
import type { AdminProductListItem, InventoryTableMeta } from '~/types/inventory';

defineProps<{
  products: AdminProductListItem[];
  meta: InventoryTableMeta;
  loading?: boolean;
  updatingProductId?: string | null;
}>();

const emit = defineEmits<{
  page: [page: number];
  pageSize: [pageSize: number];
  rowClick: [product: AdminProductListItem];
  viewDetails: [product: AdminProductListItem];
  markInStock: [product: AdminProductListItem];
  markOutOfStock: [product: AdminProductListItem];
  edit: [product: AdminProductListItem];
  addStock: [product: AdminProductListItem];
  removeStock: [product: AdminProductListItem];
  activate: [product: AdminProductListItem];
  deactivate: [product: AdminProductListItem];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      <div
        v-for="index in 6"
        :key="`product-card-skeleton-${index}`"
        class="h-[220px] animate-pulse rounded-[24px] border border-grey-50 bg-grey-55"
      />
    </div>

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :updating-product-id="updatingProductId"
        @row-click="emit('rowClick', $event)"
        @view-details="emit('viewDetails', $event)"
        @mark-in-stock="emit('markInStock', $event)"
        @mark-out-of-stock="emit('markOutOfStock', $event)"
        @edit="emit('edit', $event)"
        @add-stock="emit('addStock', $event)"
        @remove-stock="emit('removeStock', $event)"
        @activate="emit('activate', $event)"
        @deactivate="emit('deactivate', $event)"
      />
    </div>

    <div
      v-if="meta.total > 0"
      class="overflow-hidden rounded-xl border border-grey-50 bg-white"
    >
      <PaginationBar
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        inherit-radius
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </div>
  </div>
</template>
