<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'white' | 'outline' | 'ghost' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    to?: string;
    href?: string;
    block?: boolean;
    type?: 'button' | 'submit';
    /** On hover, sweep a primary-green fill in from the left and turn the label white. */
    fill?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button', block: false, fill: false },
);

const base =
  'group inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 ease-[var(--ease-spring)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 whitespace-nowrap';

const variants: Record<string, string> = {
  primary:
    'bg-primary-500 text-white shadow-[0_8px_20px_-8px_rgba(25,184,32,0.6)] hover:bg-primary-600 hover:shadow-[0_12px_28px_-8px_rgba(25,184,32,0.7)]',
  white:
    'bg-white text-grey-900 border border-grey-200 hover:border-grey-300 hover:bg-grey-50 shadow-xsmall',
  outline:
    'bg-transparent text-primary-700 border border-primary-200 hover:bg-primary-50',
  ghost: 'bg-transparent text-grey-700 hover:bg-grey-100',
  dark: 'bg-supporting-900 text-white hover:bg-supporting-700',
};

const sizes: Record<string, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-12 px-6 text-[0.95rem]',
  lg: 'h-14 px-7 text-base',
};

const classes = computed(() => [
  base,
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
  props.fill ? 'relative overflow-hidden' : '',
]);

const component = computed(() => (props.to ? resolveComponent('NuxtLink') : props.href ? 'a' : 'button'));
</script>

<template>
  <component
    :is="component"
    :to="to"
    :href="href"
    :type="!to && !href ? type : undefined"
    :class="classes"
  >
    <template v-if="fill">
      <!-- Green wipe fills from the left on hover; the label turns white in sync. -->
      <span
        class="pointer-events-none absolute inset-0 z-0 origin-left scale-x-0 bg-primary-500 transition-transform duration-500 ease-out group-hover:scale-x-100"
        aria-hidden="true"
      />
      <span
        class="relative z-10 inline-flex items-center gap-2 transition-colors duration-500 ease-out group-hover:text-white"
      >
        <slot />
      </span>
    </template>
    <slot v-else />
  </component>
</template>
