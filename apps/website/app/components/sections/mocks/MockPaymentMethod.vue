<script setup lang="ts">
import { ref } from 'vue';

const options = [
  { key: 'online', icon: 'lucide:credit-card', label: 'Pay online' },
  { key: 'credit', icon: 'lucide:pie-chart', label: 'Pay with credit (₦ 350,000.00)' },
  { key: 'transfer', icon: 'lucide:landmark', label: 'Pay with transfer' },
];
const selected = ref('credit');
</script>

<template>
  <div class="rounded-2xl bg-white p-5 shadow-medium sm:p-6">
    <p class="text-base font-semibold text-grey-900">Payment method</p>
    <div class="mt-4 space-y-3">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200"
        :class="
          selected === opt.key
            ? 'border-primary-500 bg-primary-50'
            : 'border-grey-200 bg-white hover:border-grey-300'
        "
        @click="selected = opt.key"
      >
        <Icon :name="opt.icon" class="size-5 shrink-0 text-grey-700" />
        <span class="flex-1 text-sm font-medium text-grey-800">{{ opt.label }}</span>
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          :class="selected === opt.key ? 'border-primary-500' : 'border-grey-300'"
        >
          <span v-if="selected === opt.key" class="size-2.5 rounded-full bg-primary-500" />
        </span>
      </button>
    </div>
  </div>
</template>
