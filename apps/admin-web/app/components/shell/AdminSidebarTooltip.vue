<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@gosource/ui';

const props = defineProps<{
  label: string;
  enabled?: boolean;
}>();
</script>

<template>
  <Tooltip v-if="props.enabled">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent
      side="right"
      :side-offset="12"
      class="border-admin-nav-active bg-admin-nav-bg text-white shadow-lg"
    >
      <span class="whitespace-nowrap">{{ props.label }}</span>
    </TooltipContent>
  </Tooltip>
  <slot v-else />
</template>
