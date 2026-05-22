<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import { promotionStatusLabel, promotionStatusVariant } from '~/lib/promotion-constants';
import type { PromotionStatus } from '~/types/promotions';

defineProps<{
  title?: string | null;
  status?: PromotionStatus | null;
  loading?: boolean;
  saveLabel?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  save: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-4">
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="w-fit self-start">
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit shrink-0"
          :left-icon="ChevronLeft"
          @click="emit('back')"
        >
          Back to promotions
        </Button>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          size="small"
          class="!w-fit shrink-0"
          :loading="saveLoading"
          :disabled="saveDisabled"
          @click="emit('save')"
        >
          {{ saveLabel ?? 'Save changes' }}
        </Button>
      </div>
    </div>

    <div
      v-if="loading"
      class="flex flex-wrap items-center gap-2"
      aria-busy="true"
      aria-label="Loading promotion header"
    >
      <div class="h-8 w-64 animate-pulse rounded bg-grey-55" />
      <div class="h-7 w-24 animate-pulse rounded-full bg-grey-55" />
    </div>

    <div v-else-if="title" class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-lg font-semibold text-grey-900 sm:text-2xl">
          {{ title }}
        </h1>
        <StatusTag
          v-if="status"
          :variant="promotionStatusVariant(status)"
          size="medium"
          class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ promotionStatusLabel(status) }}
        </StatusTag>
      </div>
    </div>
  </header>
</template>
