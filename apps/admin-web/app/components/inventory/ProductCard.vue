<script setup lang="ts">
import { StatusTag, cn } from '@gosource/ui';
import ProductActionsMenu from '~/components/inventory/ProductActionsMenu.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import type { AdminProductListItem } from '~/types/inventory';

const props = defineProps<{
  product: AdminProductListItem;
  updatingProductId?: string | null;
  class?: string;
}>();

const emit = defineEmits<{
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
  <article
    :class="
      cn(
        'box-border flex h-full w-full min-w-0 cursor-pointer flex-col rounded-[24px] border border-grey-50 bg-white p-4 text-left shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] transition-colors duration-150 hover:border-primary-100 hover:bg-primary-50/50 sm:p-5',
        props.class,
      )
    "
    @click="emit('rowClick', product)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <div
          v-if="product.imageUrl"
          class="size-12 shrink-0 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
        >
          <img :src="product.imageUrl" :alt="product.name" class="size-full object-cover">
        </div>
        <div
          v-else
          class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
        >
          {{ product.name.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-grey-900">{{ product.name }}</p>
          <p class="mt-0.5 truncate text-sm text-grey-300">{{ product.description }}</p>
          <p class="mt-0.5 truncate text-xs text-grey-300">{{ product.categoryLabel }}</p>
        </div>
      </div>
      <ProductActionsMenu
        :product="product"
        :disabled="updatingProductId === product.id"
        @view-details="emit('viewDetails', product)"
        @mark-in-stock="emit('markInStock', product)"
        @mark-out-of-stock="emit('markOutOfStock', product)"
        @edit="emit('edit', product)"
        @add-stock="emit('addStock', product)"
        @remove-stock="emit('removeStock', product)"
        @activate="emit('activate', product)"
        @deactivate="emit('deactivate', product)"
      />
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 text-left auto-rows-fr">
      <AdminMobileCardStat label="Price">
        <span class="block font-semibold">{{ product.priceLabel }}</span>
        <span
          v-if="product.compareAtPriceLabel"
          class="mt-0.5 block text-xs font-normal text-grey-300 line-through"
        >
          {{ product.compareAtPriceLabel }}
        </span>
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Quantity">{{ product.quantityLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Purchase unit">{{ product.purchaseUnitLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Units">{{ product.unitCountLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Status">
        <StatusTag :variant="product.statusVariant" size="medium">
          {{ product.statusLabel }}
        </StatusTag>
      </AdminMobileCardStat>
      <AdminMobileCardStat v-if="product.stockAlert" label="Stock">
        <StatusTag :variant="product.stockAlert.variant">
          {{ product.stockAlert.label }}
        </StatusTag>
      </AdminMobileCardStat>
    </div>
  </article>
</template>
