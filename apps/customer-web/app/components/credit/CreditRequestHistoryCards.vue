<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import CreditRequestActionsMenu from '~/components/credit/CreditRequestActionsMenu.vue';
import {
  creditWorkflowStatusLabel,
  creditWorkflowStatusVariant,
} from '~/lib/credit-constants';
import { creditRequestPath } from '~/lib/credit-routes';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import type { CustomerCreditRequest } from '~/types/credit';

defineProps<{
  items: CustomerCreditRequest[];
  loading?: boolean;
  isOwner?: boolean;
}>();

const emit = defineEmits<{
  cancel: [request: CustomerCreditRequest];
  reapply: [request: CustomerCreditRequest];
}>();

const cardArticleClass =
  'cursor-pointer rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-[background-color,box-shadow,border-color] duration-150 hover:border-primary-100 hover:bg-primary-50/50';
</script>

<template>
  <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
    <div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-[16px] bg-grey-55" />
  </div>

  <div v-else-if="!items.length" class="rounded-[16px] border border-grey-50 bg-background-on-canvas px-6 py-10 text-center">
    <p class="text-sm text-grey-400">No credit requests yet.</p>
  </div>

  <div v-else class="grid gap-4 sm:grid-cols-2">
    <article
      v-for="row in items"
      :key="row.id"
      :class="cardArticleClass"
      @click="navigateTo(creditRequestPath(row.id))"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-semibold text-grey-900">#{{ row.reference }}</p>
          <p class="mt-0.5 text-xs capitalize text-grey-400">{{ row.requestType }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <StatusTag
            :variant="creditWorkflowStatusVariant(row.status)"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ creditWorkflowStatusLabel(row.status) }}
          </StatusTag>
          <CreditRequestActionsMenu
            :can-cancel="isOwner && row.status === 'pending'"
            :can-reapply="isOwner && row.status === 'rejected'"
            @view-details="navigateTo(creditRequestPath(row.id))"
            @cancel="emit('cancel', row)"
            @reapply="emit('reapply', row)"
          />
        </div>
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt class="text-grey-300">Amount</dt>
          <dd class="font-medium text-grey-900">{{ formatCreditFromKobo(row.requestedAmountKobo) }}</dd>
        </div>
        <div>
          <dt class="text-grey-300">Date</dt>
          <dd class="font-medium text-grey-900">{{ formatRequestDate(row.createdAt) }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>
