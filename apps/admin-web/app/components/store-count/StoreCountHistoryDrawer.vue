<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import AdminInvoicePreviewShell from '~/components/shared/AdminInvoicePreviewShell.vue';
import type { InventoryTableMeta } from '~/types/inventory';
import type { StoreCountHistoryItem } from '~/types/store-count';

const open = defineModel<boolean>('open', { default: false });

defineProps<{
  history: StoreCountHistoryItem[];
  meta: InventoryTableMeta | null;
  loading?: boolean;
  loadingMore?: boolean;
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  loadMore: [];
}>();

function shortId(id: string) {
  return id.slice(-5);
}

function handleSelect(id: string) {
  open.value = false;
  emit('select', id);
}
</script>

<template>
  <AdminInvoicePreviewShell v-model:open="open" title="Count history">
    <div class="space-y-3 p-4 sm:p-5">
      <p v-if="loading && history.length === 0" class="text-sm text-grey-500">Loading history…</p>

      <button
        v-for="item in history"
        :key="item.id"
        type="button"
        class="w-full cursor-pointer rounded-xl border border-grey-200 bg-white p-4 text-left transition-colors hover:border-grey-300"
        :class="selectedId === item.id ? 'border-primary-300 bg-primary-50' : undefined"
        @click="handleSelect(item.id)"
      >
        <p class="text-sm font-medium text-grey-900">
          <span>{{ item.initiatorName }}</span>
          completed inventory count for
          <span class="text-primary-700 underline">#{{ shortId(item.id) }}</span>
        </p>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-grey-500">
          <span>{{ item.createdAtLabel }}</span>
          <span class="size-1 rounded-full bg-grey-300" />
          <span>{{ item.createdTimeLabel }}</span>
          <span class="size-1 rounded-full bg-grey-300" />
          <StatusTag variant="success" size="medium">{{ item.productCount }} items</StatusTag>
        </div>
      </button>

      <div v-if="meta?.hasNext" class="flex justify-center py-2">
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit"
          :loading="loadingMore"
          @click="emit('loadMore')"
        >
          See more
        </Button>
      </div>
    </div>
  </AdminInvoicePreviewShell>
</template>
