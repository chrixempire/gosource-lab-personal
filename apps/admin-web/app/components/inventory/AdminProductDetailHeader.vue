<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft, Pencil } from 'lucide-vue-next';
import ProductDetailMoreActionsMenu from '~/components/inventory/ProductDetailMoreActionsMenu.vue';
import type { AdminProductDetailsView } from '~/lib/product-details';

defineProps<{
  view: AdminProductDetailsView | null;
  loading?: boolean;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  edit: [];
  addStock: [];
  removeStock: [];
  markInStock: [];
  markOutOfStock: [];
  activate: [];
  deactivate: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-4">
    <div class="w-fit self-start">
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="emit('back')"
      >
        Back to items
      </Button>
    </div>

    <div
      v-if="loading || !view"
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      aria-busy="true"
      aria-label="Loading item header"
    >
      <div class="min-w-0">
        <div class="h-3 w-24 animate-pulse rounded bg-grey-55" />
        <div class="mt-2 h-8 w-56 animate-pulse rounded bg-grey-55" />
      </div>
      <div class="flex shrink-0 gap-2">
        <div class="h-8 w-24 animate-pulse rounded-[12px] bg-grey-55" />
        <div class="h-8 w-32 animate-pulse rounded-[12px] bg-grey-55" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-grey-300">
          Item
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <h1 class="text-h5 lg:text-h3">
            {{ view.name }}
          </h1>
          <StatusTag
            :variant="view.statusVariant"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ view.statusLabel }}
          </StatusTag>
        </div>
        <p v-if="view.categoryLabel" class="mt-1 text-sm text-grey-300">
          {{ view.categoryLabel }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit shrink-0"
          :left-icon="Pencil"
          :disabled="actionsDisabled"
          @click="emit('edit')"
        >
          Edit item
        </Button>
        <ProductDetailMoreActionsMenu
          :in-stock="view.inStock"
          :active="view.active"
          :disabled="actionsDisabled"
          @add-stock="emit('addStock')"
          @remove-stock="emit('removeStock')"
          @mark-in-stock="emit('markInStock')"
          @mark-out-of-stock="emit('markOutOfStock')"
          @activate="emit('activate')"
          @deactivate="emit('deactivate')"
        />
      </div>
    </div>
  </header>
</template>
