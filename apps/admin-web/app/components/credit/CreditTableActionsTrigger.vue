<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Ellipsis } from 'lucide-vue-next';
import { CREDIT_TABLE_ACTIONS_TRIGGER_CLASS } from '~/lib/credit-constants';

defineProps<{
  ariaLabel?: string;
}>();
</script>

<template>
  <Button
    size="icon"
    variant="ghost"
    :class="CREDIT_TABLE_ACTIONS_TRIGGER_CLASS"
    :aria-label="ariaLabel ?? 'Actions'"
  >
    <Ellipsis class="size-4" />
  </Button>
</template>
