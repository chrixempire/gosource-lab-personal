<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import type { CustomerCreditRepayment } from '~/types/credit';

defineProps<{
  items: CustomerCreditRepayment[];
  loading?: boolean;
}>();

const cardArticleClass =
  'rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]';
</script>

<template>
  <div v-if="loading" class="grid gap-4 sm:grid-cols-2">
    <div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-[16px] bg-grey-55" />
  </div>

  <div v-else-if="!items.length" class="rounded-[16px] border border-grey-50 bg-background-on-canvas px-6 py-10 text-center">
    <p class="text-sm text-grey-400">No repayments yet.</p>
  </div>

  <div v-else class="grid gap-4 sm:grid-cols-2">
    <article v-for="row in items" :key="row.id" :class="cardArticleClass">
      <div class="flex items-start justify-between gap-2">
        <p class="font-semibold text-grey-900">{{ row.referenceCode }}</p>
        <StatusTag variant="default">{{ row.status || '—' }}</StatusTag>
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt class="text-grey-300">Amount</dt>
          <dd class="font-medium text-grey-900">{{ formatCreditFromKobo(row.paymentAmountKobo) }}</dd>
        </div>
        <div>
          <dt class="text-grey-300">Date</dt>
          <dd class="font-medium text-grey-900">{{ formatRequestDate(row.createdAt) }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>
