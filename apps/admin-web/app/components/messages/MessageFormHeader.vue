<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';

defineProps<{
  actionLabel: string;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  submit: [];
}>();
</script>

<template>
  <header
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <Button
      type="button"
      variant="ghost"
      size="small"
      class="!w-fit !px-2 text-grey-900 [&>span]:!gap-1"
      :left-icon="ArrowLeft"
      aria-label="Back to messages"
      @click="emit('back')"
    >
      Back
    </Button>

    <Button
      type="button"
      size="small"
      class="!w-fit"
      :disabled="disabled"
      :loading="loading"
      @click="emit('submit')"
    >
      {{ actionLabel }}
    </Button>
  </header>
</template>
