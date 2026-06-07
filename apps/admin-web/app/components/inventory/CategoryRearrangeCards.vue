<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import type { AdminCategoryListItem } from '~/types/inventory';

defineProps<{
  loading?: boolean;
}>();

const categories = defineModel<AdminCategoryListItem[]>('categories', { required: true });

function moveItem(fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= categories.value.length || fromIndex === toIndex) {
    return;
  }

  const next = [...categories.value];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return;
  next.splice(toIndex, 0, item);
  categories.value = next;
}
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" :count="8" />

  <p
    v-else-if="!categories.length"
    class="rounded-2xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500"
  >
    No categories to rearrange.
  </p>

  <draggable
    v-else
    v-model="categories"
    item-key="id"
    tag="div"
    handle=".category-rearrange-handle"
    class="grid gap-3"
    :animation="200"
    ghost-class="opacity-60"
    chosen-class="scale-[1.01] shadow-lg"
  >
    <template #item="{ element: category, index }">
      <article
        class="rounded-2xl border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-16px_rgba(16,24,40,0.14)] transition-[box-shadow,transform,border-color] duration-150"
      >
        <div class="flex items-start gap-3">
          <button
            type="button"
            class="category-rearrange-handle flex size-10 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-grey-400 active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical class="size-4" />
          </button>

          <div
            v-if="category.imageUrl"
            class="size-11 shrink-0 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
          >
            <img :src="category.imageUrl" :alt="category.name" class="size-full object-cover" />
          </div>
          <div
            v-else
            class="flex size-11 shrink-0 items-center justify-center rounded-xl border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
          >
            {{ category.name.charAt(0) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex size-6 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700"
              >
                {{ index + 1 }}
              </span>
              <p class="truncate text-sm font-semibold text-grey-900">{{ category.name }}</p>
            </div>
            <p class="mt-1 line-clamp-2 text-xs text-grey-500">{{ category.description }}</p>
            <p class="mt-2 text-xs font-medium text-grey-700">
              {{ category.productCountLabel }} products
            </p>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 border-t border-grey-50 pt-3">
          <Button
            type="button"
            variant="secondary"
            size="medium"
            class="w-full"
            :left-icon="ChevronUp"
            :disabled="index === 0"
            @click="moveItem(index, index - 1)"
          >
            Move up
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="medium"
            class="w-full"
            :left-icon="ChevronDown"
            :disabled="index === categories.length - 1"
            @click="moveItem(index, index + 1)"
          >
            Move down
          </Button>
        </div>
      </article>
    </template>
  </draggable>
</template>
