<script setup lang="ts">
import { ref } from 'vue';

const copied = ref(false);
function copy() {
  copied.value = true;
  if (import.meta.client) {
    navigator.clipboard?.writeText('0732934459').catch(() => {});
    setTimeout(() => (copied.value = false), 1600);
  }
}
</script>

<template>
  <div class="relative">
    <!-- Floating notification toast -->
    <div
      class="animate-float absolute -right-1 -top-2 z-20 w-[19rem] max-w-[88%] rounded-2xl bg-white p-4 shadow-large"
      style="--float-dur: 7s"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-1.5">
          <BrandLogo :with-wordmark="false" class="[&_svg]:size-5" />
          <span class="font-display text-sm font-semibold text-supporting-900">GoSource</span>
        </div>
        <span class="rounded-full bg-success-50 px-2 py-0.5 text-[0.625rem] font-semibold text-success-700">
          Successful
        </span>
      </div>
      <p class="mt-2 text-sm font-semibold text-grey-900">Order purchased!</p>
      <p class="mt-1 text-xs leading-relaxed text-grey-500">
        You purchased ₦45,200 worth of food supplies on 10-Feb-2023. Payment was
        made via GoSource Wallet.
      </p>
    </div>

    <!-- Wallet panel -->
    <div class="rounded-2xl bg-white p-1 shadow-medium">
      <div class="rounded-xl bg-success-75 p-5 pt-12">
        <p class="text-sm text-supporting-700/80">Available balance</p>
        <div class="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p class="font-display text-2xl font-medium text-supporting-900">NGN 150,000.00</p>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-600"
          >
            <Icon name="lucide:plus" class="size-4" /> Add money
          </button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 p-5 text-xs">
        <div>
          <p class="text-grey-400">Bank name</p>
          <p class="mt-1 font-medium text-grey-700">Paystack-Titan</p>
        </div>
        <div>
          <p class="text-grey-400">Account number</p>
          <button type="button" class="mt-1 inline-flex items-center gap-1 font-medium text-grey-700" @click="copy">
            0732934459
            <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" :class="copied ? 'text-primary-600' : 'text-grey-400'" />
          </button>
        </div>
        <div>
          <p class="text-grey-400">Account name</p>
          <p class="mt-1 font-medium text-grey-700">GoSource/Abusiness</p>
        </div>
      </div>
    </div>
  </div>
</template>
