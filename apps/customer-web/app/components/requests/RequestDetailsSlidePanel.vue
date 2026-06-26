<script setup lang="ts">
import { X } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const panelTitle = computed(() => props.title?.trim() || 'Request details');

function close() {
  emit('update:open', false);
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    close();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onEscape);
});

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) {
      return;
    }

    document.body.style.overflow = isOpen ? 'hidden' : '';
  },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = '';
  }

  window.removeEventListener('keydown', onEscape);
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
        class="fixed inset-0 z-[85] customer-modal-overlay backdrop-blur-[2px]"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-250 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open"
        data-testid="request-details-slide-panel"
        class="fixed right-3 top-[2.5%] z-[90] flex h-[95dvh] w-[calc(100%-1.5rem)] max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-grey-50 bg-background-on-canvas shadow-[var(--customer-panel-shadow)] transition-colors duration-300 sm:right-4 sm:w-[min(calc(100%-2rem),560px)]"
        role="dialog"
        aria-modal="true"
        :aria-label="panelTitle"
        @click.stop
      >
        <header
          class="flex shrink-0 items-center gap-3 border-b border-grey-50 px-4 py-4 sm:px-5"
        >
          <div
            class="flex min-w-0 flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"
          >
            <h2
              class="min-w-0 max-w-full text-xl font-semibold text-grey-900 sm:flex-1 sm:text-2xl"
            >
              {{ panelTitle }}
            </h2>
            <slot name="actions" />
          </div>
          <button
            type="button"
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-background-on-canvas text-grey-900 transition hover:bg-grey-55"
            aria-label="Close request details"
            @click="close"
          >
            <X class="size-5" />
          </button>
        </header>

        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
        >
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="shrink-0 border-t border-grey-50 bg-background-on-canvas px-4 py-4 shadow-[0_-6px_16px_rgba(71,83,103,0.05)] sm:px-5"
        >
          <slot name="footer" />
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
