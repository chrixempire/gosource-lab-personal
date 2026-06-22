<script setup lang="ts">
import { StatCard } from '@gosource/ui';

defineProps<{
  label: string;
  value: string;
  hint?: string;
  inlineHint?: string;
  indicatorColor?: string;
  class?: string;
}>();
</script>

<template>
  <StatCard :label="label" :value="value" :hint="hint" :inline-hint="inlineHint" :class="class">
    <template #label>
      <span class="flex items-center gap-2">
        <span
          v-if="indicatorColor"
          :class="['size-2 rounded-full shrink-0', indicatorColor]"
        />
        <span>{{ label }}</span>
      </span>
    </template>
  </StatCard>
</template>
