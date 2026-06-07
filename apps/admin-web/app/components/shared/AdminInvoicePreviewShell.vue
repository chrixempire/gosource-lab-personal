<script setup lang="ts">
import { Button } from '@gosource/ui';
import { computed, onUnmounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useAdminCompactViewport } from '~/composables/useAdminCompactViewport';

const open = defineModel<boolean>('open', { default: false });

withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: 'Preview invoice' },
);

const isCompactViewport = useAdminCompactViewport();

const panelEnterFrom = computed(() =>
  isCompactViewport.value ? 'translate-y-full' : 'translate-x-[calc(100%+1rem)]',
);
const panelEnterTo = computed(() =>
  isCompactViewport.value ? 'translate-y-0' : 'translate-x-0',
);

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
      enter-active-class="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :enter-from-class="panelEnterFrom"
      :enter-to-class="panelEnterTo"
      leave-active-class="transition-transform duration-400 ease-[cubic-bezier(0.4,0,1,1)]"
      :leave-from-class="panelEnterTo"
      :leave-to-class="panelEnterFrom"
    >
      <aside
        v-if="open"
        class="fixed z-[121] flex flex-col overflow-hidden border-grey-50 bg-white max-[999px]:inset-x-0 max-[999px]:bottom-0 max-[999px]:top-auto max-[999px]:h-[92dvh] max-[999px]:max-h-[92dvh] max-[999px]:w-full max-[999px]:rounded-t-[28px] max-[999px]:border-t max-[999px]:shadow-[0_-16px_48px_-12px_rgba(16,24,40,0.28)] min-[1000px]:right-4 min-[1000px]:top-[2.5vh] min-[1000px]:h-[95vh] min-[1000px]:max-h-[95vh] min-[1000px]:w-[min(92vw,600px)] min-[1000px]:rounded-[28px] min-[1000px]:border min-[1000px]:shadow-[-24px_0_64px_-24px_rgba(16,24,40,0.42)]"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="flex shrink-0 items-center justify-between border-b border-grey-50 px-4 py-3.5 sm:px-5 sm:py-4">
          <p class="text-base font-semibold text-grey-900">{{ title }}</p>
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
        <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          <slot />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
