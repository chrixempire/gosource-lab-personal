<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue';
import { cn } from '../lib/cn';
import { buttonVariants, type ButtonSize, type ButtonVariant } from './variants';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  class?: HTMLAttributes['class'];
  leftIcon?: Component | null;
  rightIcon?: Component | null;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'large',
  type: 'button',
  disabled: false,
  loading: false,
});
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-disabled="props.disabled || props.loading ? 'true' : 'false'"
    :data-loading="props.loading ? '' : undefined"
    :aria-busy="props.loading ? 'true' : 'false'"
    :class="
      cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.loading && [
          'select-none !bg-button-disabled !text-disabled !shadow-none',
          'hover:!bg-button-disabled hover:!shadow-none',
          'active:!bg-button-disabled active:!shadow-none active:!translate-y-0',
        ],
        props.disabled &&
          !props.loading && [
            'pointer-events-none !cursor-not-allowed select-none',
            '!border-border-default !bg-button-disabled !text-disabled !shadow-none',
            'hover:!border-border-default hover:!bg-button-disabled hover:!text-disabled hover:!shadow-none',
            'active:!translate-y-0 active:!border-border-default active:!bg-button-disabled active:!shadow-none',
          ],
        props.class,
      )
    "
  >
    <span
      v-if="props.loading"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span class="loader h-5 w-5" />
    </span>
    <span :class="cn('inline-flex items-center gap-2', props.loading ? 'opacity-0' : 'opacity-100')">
      <span v-if="props.leftIcon" class="inline-flex shrink-0 items-center justify-center">
        <component :is="props.leftIcon" class="size-4" />
      </span>
      <span>
        <slot />
      </span>
      <span v-if="props.rightIcon" class="inline-flex shrink-0 items-center justify-center">
        <component :is="props.rightIcon" class="size-4" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.loader {
  aspect-ratio: 1;
  display: grid;
  border-radius: 9999px;
  background:
    linear-gradient(0deg, rgb(0 0 0 / 50%) 30%, rgb(0 0 0 / 0) 0 70%, rgb(0 0 0 / 100%) 0)
      50% / 8% 100%,
    linear-gradient(90deg, rgb(0 0 0 / 25%) 30%, rgb(0 0 0 / 0) 0 70%, rgb(0 0 0 / 75%) 0)
      50% / 100% 8%;
  background-repeat: no-repeat;
  animation: button-loader-spin 1s infinite steps(12);
}

.loader::before,
.loader::after {
  content: '';
  grid-area: 1 / 1;
  border-radius: 9999px;
  background: inherit;
}

.loader::before {
  opacity: 0.915;
  transform: rotate(30deg);
}

.loader::after {
  opacity: 0.83;
  transform: rotate(60deg);
}

@keyframes button-loader-spin {
  100% {
    transform: rotate(1turn);
  }
}
</style>
