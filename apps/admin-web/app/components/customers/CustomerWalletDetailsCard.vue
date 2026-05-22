<script setup lang="ts">
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import type { CustomerDetailView } from '~/types/customers';

defineProps<{
  customer: CustomerDetailView;
}>();
</script>

<template>
  <section
    class="space-y-5 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
  >
    <div class="space-y-3">
      <h2 class="text-base font-semibold text-grey-900">Wallet details</h2>
      <div class="h-px w-full bg-grey-50" />
    </div>

    <dl class="space-y-4">
      <div class="space-y-1">
        <dt class="text-sm font-semibold text-grey-700">Bank name</dt>
        <dd class="text-sm text-grey-900">{{ customer.wallet?.bankName || 'Loading...' }}</dd>
      </div>
      <div class="space-y-1">
        <dt class="text-sm font-semibold text-grey-700">Account number</dt>
        <dd class="text-sm text-grey-900">{{ customer.wallet?.accountNumber || '0' }}</dd>
      </div>
      <div class="space-y-1">
        <dt class="text-sm font-semibold text-grey-700">Account name</dt>
        <dd class="text-sm text-grey-900">{{ customer.wallet?.accountName || 'Loading...' }}</dd>
      </div>
    </dl>

    <div class="rounded-xl border border-primary-100 bg-primary-50/45 px-4 py-3.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Wallet balance</p>
      <p class="mt-1 text-2xl font-semibold text-grey-900">
        {{ formatDashboardCurrency(customer.walletBalance ?? 0) }}
      </p>
    </div>
  </section>
</template>
