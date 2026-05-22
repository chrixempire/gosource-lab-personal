<script setup lang="ts">
import { cn } from '@gosource/ui';
import CategoryActionsMenu from '~/components/inventory/CategoryActionsMenu.vue';
import type { AdminCategoryListItem } from '~/types/inventory';

const props = defineProps<{
  category: AdminCategoryListItem;
  busyCategoryId?: string | null;
  class?: string;
}>();

const emit = defineEmits<{
  view: [];
  edit: [];
  delete: [];
}>();
</script>

<template>
  <article
    :class="
      cn(
        'flex min-w-0 flex-col rounded-[24px] border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] sm:p-5',
        props.class,
      )
    "
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <div
          v-if="category.imageUrl"
          class="size-12 shrink-0 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
        >
          <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover">
        </div>
        <div
          v-else
          class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
        >
          {{ category.name.charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-grey-900">{{ category.name }}</p>
          <p class="mt-1 line-clamp-2 text-sm text-grey-600">{{ category.description }}</p>
        </div>
      </div>
      <CategoryActionsMenu
        :category="category"
        :disabled="busyCategoryId === category.id"
        @view="emit('view')"
        @edit="emit('edit')"
        @delete="emit('delete')"
      />
    </div>
    <p class="mt-4 text-sm font-medium text-grey-800">
      {{ category.productCountLabel }} products
    </p>
  </article>
</template>
