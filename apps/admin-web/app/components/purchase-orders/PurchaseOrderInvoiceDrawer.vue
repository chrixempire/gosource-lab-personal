<script setup lang="ts">
import {
  Button,
} from '@gosource/ui';
import { onUnmounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import PurchaseOrderInvoicePreview from '~/components/purchase-orders/PurchaseOrderInvoicePreview.vue';
import type { PurchaseOrderInvoicePreview as PurchaseOrderInvoicePreviewData } from '~/types/purchase-orders';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  preview: PurchaseOrderInvoicePreviewData | null;
}>();

watch(
  () => open.value,
  (value) => {
    if (!import.meta.client) return;
    document.documentElement.style.overflow = value ? 'hidden' : '';
  },
  { immediate: true },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-250 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[120] bg-[rgba(16,24,40,0.56)]"
        @click="open = false"
      />
    </Transition>

    <Transition
      enter-active-class="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      enter-from-class="translate-x-[calc(100%+1rem)] opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-400 ease-[cubic-bezier(0.4,0,1,1)]"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-[calc(100%+1rem)] opacity-0"
    >
      <aside
        v-if="open"
        class="fixed right-4 top-[2.5vh] z-[121] flex h-[95vh] max-h-[95vh] w-[min(92vw,600px)] flex-col overflow-hidden rounded-[28px] border border-grey-50 bg-white shadow-[-24px_0_64px_-24px_rgba(16,24,40,0.42)]"
        role="dialog"
        aria-modal="true"
        aria-label="Preview invoice"
      >
        <div class="flex items-center justify-between border-b border-grey-50 px-5 py-4">
          <p class="text-base font-semibold text-grey-900">Preview invoice</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="!size-9 shrink-0"
            @click="open = false"
          >
            <X class="size-4" />
          </Button>
        </div>
        <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-0">
          <PurchaseOrderInvoicePreview v-if="props.preview" :preview="props.preview" />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
