<script setup lang="ts">
import { Button, cn } from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  label: string;
  active?: boolean;
}>();
</script>

<template>
  <Button
    type="button"
    size="small"
    variant="secondary"
    :right-icon="ChevronDown"
    :class="
      cn(
        '!inline-flex !h-9 !w-auto shrink-0 rounded-full px-3.5 text-sm font-medium',
        active && '!border-primary-200 !bg-primary-50 !text-primary-600',
      )
    "
  >
    {{ label }}
  </Button>
</template>
