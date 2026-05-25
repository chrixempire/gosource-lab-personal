<script setup lang="ts">
import { Button } from '@gosource/ui';
import { AlertCircle, RefreshCw } from 'lucide-vue-next';
import {
  getAdminLoadErrorPresentation,
  type AdminLoadErrorPresentationOptions,
} from '~/utils/load-error-message';

const props = withDefaults(
  defineProps<
    AdminLoadErrorPresentationOptions & {
      error?: unknown;
      /** Override computed title. */
      title?: string;
      /** Override computed description. */
      description?: string;
      /** Tighter layout for table cells and tabs. */
      compact?: boolean;
      retryLabel?: string;
      showRetry?: boolean;
    }
  >(),
  {
    notFoundTitle: 'Not found',
    loadFailedTitle: 'Unable to load',
    retryLabel: 'Retry',
    showRetry: true,
    compact: false,
  },
);

const emit = defineEmits<{
  retry: [];
}>();

const presentation = computed(() =>
  getAdminLoadErrorPresentation(props.error, {
    notFoundTitle: props.notFoundTitle,
    loadFailedTitle: props.loadFailedTitle,
    resourceLabel: props.resourceLabel,
    fallbackMessage: props.fallbackMessage,
  }),
);

const displayTitle = computed(() => props.title ?? presentation.value.title);
const displayMessage = computed(() => props.description ?? presentation.value.message);

const shellClass = computed(() =>
  props.compact
    ? 'px-4 py-8'
    : 'rounded-2xl border border-dashed border-negative-100 bg-negative-50/50 px-6 py-12',
);

const destructiveGhostButtonClass =
  '!w-auto !text-button-negative hover:!bg-negative-50 active:!bg-negative-50';
</script>

<template>
  <div :class="[shellClass, 'text-center']">
    <div
      :class="[
        'mx-auto flex items-center justify-center rounded-full bg-negative-50 text-button-negative',
        compact ? 'mb-3 size-10' : 'mb-4 size-12',
      ]"
    >
      <AlertCircle :class="compact ? 'size-5' : 'size-6'" aria-hidden="true" />
    </div>

    <p
      :class="[
        'font-semibold text-grey-900',
        compact ? 'text-sm' : 'text-base',
      ]"
    >
      {{ displayTitle }}
    </p>

    <p
      :class="[
        'mx-auto mt-2 max-w-md text-grey-600',
        compact ? 'text-xs leading-5' : 'text-sm leading-6',
      ]"
    >
      {{ displayMessage }}
    </p>

    <div v-if="showRetry" :class="compact ? 'mt-3' : 'mt-5'">
      <Button
        type="button"
        variant="ghost"
        size="small"
        :class="destructiveGhostButtonClass"
        :left-icon="RefreshCw"
        @click="emit('retry')"
      >
        {{ retryLabel }}
      </Button>
    </div>
  </div>
</template>
