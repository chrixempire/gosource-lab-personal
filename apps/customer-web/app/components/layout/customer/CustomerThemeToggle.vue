<script setup lang="ts">
import { cn } from '@gosource/ui';
import { Moon, Sun } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    class?: string;
  }>(),
  {
    class: undefined,
  },
);

const { isDark, toggleTheme, ready } = useCustomerTheme();
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-grey-50 bg-background-on-canvas text-grey-900 transition-colors duration-300 hover:bg-grey-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
        props.class,
      )
    "
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <span class="relative flex size-5 items-center justify-center" aria-hidden="true">
      <Sun
        :class="
          cn(
            'absolute size-5 text-orange-brick transition-all duration-300 ease-out',
            ready && isDark
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100',
          )
        "
      />
      <Moon
        :class="
          cn(
            'absolute size-5 text-primary-500 transition-all duration-300 ease-out',
            ready && isDark
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0',
          )
        "
      />
    </span>
  </button>
</template>
