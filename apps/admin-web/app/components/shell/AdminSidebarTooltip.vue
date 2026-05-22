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
      class="border-[#345B46] bg-[#1F4031] text-white shadow-lg"
    >
      <span class="whitespace-nowrap">{{ props.label }}</span>
    </TooltipContent>
  </Tooltip>
  <slot v-else />
</template>
