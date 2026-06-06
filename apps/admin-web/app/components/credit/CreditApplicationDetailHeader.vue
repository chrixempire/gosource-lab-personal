<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CreditApplicationMoreActionsMenu from '~/components/credit/CreditApplicationMoreActionsMenu.vue';
import { creditStatusVariant, creditWorkflowStatusLabel } from '~/lib/credit-constants';
import type { CreditWorkflowStatus } from '~/types/credit';

defineProps<{
  referenceLabel: string;
  status?: CreditWorkflowStatus | string;
  loading?: boolean;
  canManage?: boolean;
  isPending?: boolean;
  isRejected?: boolean;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  back: [];
  approve: [];
  reject: [];
  requestMoreInfo: [];
  reopen: [];
}>();
</script>

<template>
  <header class="flex w-full flex-col gap-3">
    <div
      v-if="loading"
      class="flex flex-wrap items-center justify-between gap-3"
      aria-busy="true"
      aria-label="Loading application header"
    >
      <div class="h-8 w-20 animate-pulse rounded-[12px] bg-grey-55" />
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div class="h-8 w-32 animate-pulse rounded-[12px] bg-grey-55" />
        <div class="h-8 w-40 animate-pulse rounded-[12px] bg-grey-55" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-wrap items-center justify-between gap-3"
    >
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

      <div v-if="canManage" class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <CreditApplicationMoreActionsMenu
          v-if="isPending || isRejected"
          :is-pending="isPending"
          :is-rejected="isRejected"
          :disabled="actionsDisabled"
          @reject="emit('reject')"
          @request-more-info="emit('requestMoreInfo')"
          @reopen="emit('reopen')"
        />
        <Button
          v-if="isPending"
          type="button"
          variant="primary"
          size="small"
          class="!w-fit shrink-0"
          :disabled="actionsDisabled"
          @click="emit('approve')"
        >
          Approve &amp; set limit
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center gap-2">
      <div class="h-7 w-28 animate-pulse rounded bg-grey-55" />
      <div class="h-6 w-20 animate-pulse rounded-full bg-grey-55" />
    </div>

    <div v-else class="flex flex-wrap items-center gap-2">
      <h1 class="text-lg font-semibold text-grey-900 sm:text-2xl">
        {{ referenceLabel }}
      </h1>
      <StatusTag
        v-if="status"
        :variant="creditStatusVariant(status)"
        size="medium"
        class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
      >
        {{ creditWorkflowStatusLabel(status) }}
      </StatusTag>
    </div>
  </header>
</template>
