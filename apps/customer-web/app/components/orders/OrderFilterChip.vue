<script setup lang="ts">
import { Button, cn } from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  label: string;
  active?: boolean;
  badgeCount?: number;
}>();

const showBadge = computed(
  () => props.badgeCount != null && props.badgeCount > 0,
);
</script>

<template>
  <Button
    type="button"
    size="small"
    variant="outline"
    :class="
      cn(
        '!inline-flex !h-9 !w-auto shrink-0 rounded-full border px-3.5 text-sm font-medium !shadow-none',
        'hover:!translate-y-0 active:!translate-y-0',
        active
          ? 'border-primary-500 !bg-primary-50 !text-primary-600 hover:!border-primary-500 hover:!bg-primary-50 hover:!text-primary-600 [&_svg]:!text-primary-600'
          : 'border-border-input-default !bg-white !text-grey-800 hover:!border-primary-300 hover:!bg-white hover:!text-grey-800 [&_svg]:!text-grey-500',
      )
    "
  >
    <span class="inline-flex items-center gap-2">
      <span>{{ label }}</span>
      <span
        v-if="showBadge"
        class="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-brick text-[11px] font-semibold leading-none text-white"
        aria-hidden="true"
      >
        {{ badgeCount }}
      </span>
      <ChevronDown class="size-4 shrink-0" />
    </span>
  </Button>
</template>
