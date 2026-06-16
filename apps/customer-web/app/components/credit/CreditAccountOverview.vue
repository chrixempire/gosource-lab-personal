<script setup lang="ts">
import type { CustomerCreditAccount } from '~/types/credit';
import { formatCreditFromKobo } from '~/lib/credit-money';

const props = defineProps<{
  account: CustomerCreditAccount | null;
  amountDueKobo?: number;
}>();

const stats = computed(
  () =>
    props.account ?? {
      id: '',
      limitKobo: 0,
      outstandingKobo: 0,
      spendableAmountKobo: 0,
      availableKobo: 0,
      totalPaymentsKobo: 0,
      totalOverdueKobo: 0,
      creditUtilization: 0,
      status: '',
    },
);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div class="customer-surface-card rounded-lg p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Available credit</p>
      <p class="text-3xl font-semibold tabular-nums text-grey-900">
        {{ formatCreditFromKobo(stats.availableKobo) }}
      </p>
      <p class="mt-1 text-xs text-grey-300">
        Outstanding {{ formatCreditFromKobo(stats.outstandingKobo) }} / Limit
        {{ formatCreditFromKobo(stats.limitKobo) }}
      </p>
    </div>

    <div class="customer-surface-card rounded-lg p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Spendable amount</p>
      <p class="text-3xl font-semibold tabular-nums text-grey-900">
        {{ formatCreditFromKobo(stats.spendableAmountKobo) }}
      </p>
    </div>

    <div class="customer-surface-card rounded-lg p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Amount due</p>
      <p class="text-3xl font-semibold tabular-nums text-grey-900">
        {{ formatCreditFromKobo(props.amountDueKobo ?? stats.outstandingKobo) }}
      </p>
    </div>
  </div>
</template>
