<script setup lang="ts">
import { Switch, cn } from '@gosource/ui';
import { Moon, Sun } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    class?: string;
  }>(),
  {
    compact: false,
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
        'group relative inline-flex shrink-0 cursor-pointer items-center gap-2.5 overflow-visible rounded-[14px] border border-border-default bg-background-on-canvas text-sm font-medium text-text-default transition-[background-color,border-color,color,box-shadow] duration-300 ease-out hover:bg-background-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
        compact ? 'size-10 justify-center p-0' : 'w-full px-3 py-2.5',
        props.class,
      )
    "
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-pressed="isDark"
    @click="toggleTheme"
  >
    <span
      class="relative flex size-5 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
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
    <span v-if="!compact" class="min-w-0 flex-1 text-left">
      {{ isDark ? 'Dark mode' : 'Light mode' }}
    </span>
    <Switch
      v-if="!compact"
      :model-value="isDark"
      tabindex="-1"
      class="pointer-events-none shrink-0 data-[state=checked]:!bg-primary-500 data-[state=unchecked]:!bg-grey-300"
      thumb-class="!bg-background-on-canvas"
      aria-hidden="true"
    />
  </button>
</template>
