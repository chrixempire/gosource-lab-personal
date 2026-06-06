<script setup lang="ts">
import { Button } from '@gosource/ui';

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  clear: [];
}>();
</script>

<template>
  <Button
    v-if="show"
    type="button"
    variant="link"
    size="small"
    class="!h-auto shrink-0 !w-auto !px-0 !py-1 !text-primary-500"
    @click="emit('clear')"
  >
    Clear all filters
  </Button>
</template>
