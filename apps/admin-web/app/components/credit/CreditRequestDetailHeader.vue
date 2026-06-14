<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import { creditStatusVariant, creditWorkflowStatusLabel } from '~/lib/credit-constants';
import type { CreditWorkflowStatus } from '~/types/credit';

defineProps<{
  referenceLabel: string;
  status?: CreditWorkflowStatus | string;
  canManage?: boolean;
  isPending?: boolean;
  actionsDisabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  approve: [];
  reject: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-3">
    <template v-if="loading">
      <div class="h-8 w-20 animate-pulse rounded-[12px] bg-grey-55" />
      <div class="flex w-full items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <div class="h-7 w-24 animate-pulse rounded bg-grey-55" />
          <div class="h-6 w-20 animate-pulse rounded-full bg-grey-55" />
        </div>
        <div class="flex items-center gap-2">
          <div class="h-8 w-16 animate-pulse rounded-[12px] bg-grey-55" />
          <div class="h-8 w-20 animate-pulse rounded-[12px] bg-grey-55" />
        </div>
      </div>
    </template>

    <template v-else>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="emit('back')"
      >
        Back
      </Button>

      <div
        v-if="isPending && canManage"
        class="flex w-full min-w-0 flex-wrap items-center justify-between gap-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-h6 lg:text-h4">
            {{ referenceLabel }}
          </h1>
          <StatusTag
            v-if="status"
            :variant="creditStatusVariant(status)"
            size="medium"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ creditWorkflowStatusLabel(status) }}
          </StatusTag>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="small"
            class="!w-fit shrink-0"
            :disabled="actionsDisabled"
            @click="emit('reject')"
          >
            Reject
          </Button>
          <Button
            type="button"
            variant="primary"
            size="small"
            class="!w-fit shrink-0"
            :disabled="actionsDisabled"
            @click="emit('approve')"
          >
            Approve
          </Button>
        </div>
      </div>

      <div v-else class="flex flex-wrap items-center gap-2">
        <h1 class="text-h6 lg:text-h4">
          {{ referenceLabel }}
        </h1>
        <StatusTag
          v-if="status"
          :variant="creditStatusVariant(status)"
          size="medium"
          class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ creditWorkflowStatusLabel(status) }}
        </StatusTag>
      </div>
    </template>
  </header>
</template>
