<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';
import { ArrowDown, ArrowUp } from 'lucide-vue-next';
import { parseCategoriesResponse } from '~/lib/category-api';
import type { AdminCategoryListItem } from '~/types/inventory';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  save: [items: Array<{ id: string; position: number }>];
}>();

const localItems = ref<AdminCategoryListItem[]>([]);
const fetchPending = ref(false);

watch(open, async (value) => {
  if (!value) {
    localItems.value = [];
    return;
  }

  fetchPending.value = true;
  try {
    const payload = await $fetch<unknown>('/api/categories', {
      query: { page: 1, limit: 200 },
    });
    const parsed = parseCategoriesResponse(payload, 1, 200);
    localItems.value = [...parsed.rows].sort((a, b) => b.position - a.position);
  } catch {
    localItems.value = [];
  } finally {
    fetchPending.value = false;
  }
});

function moveItem(index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= localItems.value.length) {
    return;
  }

  const items = [...localItems.value];
  const [item] = items.splice(index, 1);
  if (!item) {
    return;
  }
  items.splice(nextIndex, 0, item);
  localItems.value = items;
}

function onSave() {
  const count = localItems.value.length;
  const payload = localItems.value.map((item, index) => ({
    id: item.id,
    position: count - 1 - index,
  }));
  emit('save', payload);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>Rearrange categories</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p class="mb-4 text-sm text-grey-600">
          Use the arrows to change display order. The first category appears at the top of the catalogue.
        </p>

        <div
          v-if="fetchPending"
          class="py-8 text-center text-sm text-grey-500"
        >
          Loading categories…
        </div>

        <ul v-else-if="localItems.length > 0" class="max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto">
          <li
            v-for="(item, index) in localItems"
            :key="item.id"
            class="flex items-center gap-3 rounded-xl border border-grey-50 bg-white px-3 py-2.5"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-grey-55 text-xs font-semibold text-grey-500">
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-grey-900">{{ item.name }}</p>
              <p class="truncate text-xs text-grey-500">{{ item.productCountLabel }} products</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                class="!size-8"
                :disabled="index === 0"
                aria-label="Move up"
                @click="moveItem(index, -1)"
              >
                <ArrowUp class="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                class="!size-8"
                :disabled="index === localItems.length - 1"
                aria-label="Move down"
                @click="moveItem(index, 1)"
              >
                <ArrowDown class="size-4" />
              </Button>
            </div>
          </li>
        </ul>

        <p v-else class="py-8 text-center text-sm text-grey-500">
          No categories to rearrange.
        </p>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="medium"
          :loading="loading"
          :disabled="fetchPending || localItems.length === 0"
          @click="onSave"
        >
          Save order
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
