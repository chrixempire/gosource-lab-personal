<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@gosource/ui';
import { Info } from 'lucide-vue-next';

defineProps<{
  description: string;
}>();
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <button
        type="button"
        class="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-grey-55 hover:text-grey-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        :aria-label="description"
      >
        <Info class="size-4" stroke-width="2" aria-hidden="true" />
      </button>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      align="start"
      :side-offset="6"
      class="max-w-[min(18rem,calc(100vw-2rem))] whitespace-normal text-left text-[13px] font-normal leading-snug"
    >
      {{ description }}
    </TooltipContent>
  </Tooltip>
</template>
