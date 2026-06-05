<script setup lang="ts">
import type { CustomerCreditAccount } from '~/types/credit';
import { formatCreditFromKobo } from '~/lib/credit-money';

const props = defineProps<{
  account: CustomerCreditAccount | null;
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
    <div class="rounded-lg border border-grey-50 bg-white p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Available credit</p>
      <h3 class="text-2xl font-semibold text-grey-900">{{ formatCreditFromKobo(stats.availableKobo) }}</h3>
      <p class="mt-1 text-xs text-grey-300">
        Outstanding {{ formatCreditFromKobo(stats.outstandingKobo) }} / Limit
        {{ formatCreditFromKobo(stats.limitKobo) }}
      </p>
    </div>

    <div class="rounded-lg border border-grey-50 bg-white p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Spendable amount</p>
      <h3 class="text-2xl font-semibold text-grey-900">
        {{ formatCreditFromKobo(stats.spendableAmountKobo) }}
      </h3>
    </div>

    <div class="rounded-lg border border-grey-50 bg-white p-5">
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-grey-400">Amount due</p>
      <h3 class="text-2xl font-semibold text-grey-900">
        {{ formatCreditFromKobo(stats.outstandingKobo) }}
      </h3>
    </div>
  </div>
</template>
