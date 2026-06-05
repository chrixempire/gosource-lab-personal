<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Lock, ShoppingBag } from 'lucide-vue-next';
</script>

<template>
  <div class="mx-auto w-full max-w-xl">
    <div class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] md:p-8">
      <div class="flex flex-col items-center text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-grey-400">Credit</p>

        <div class="mt-4 w-full rounded-2xl bg-primary-50 px-6 py-10">
          <div
            class="mx-auto flex size-28 items-center justify-center rounded-full bg-primary-100 text-primary-700"
          >
            <Lock class="size-12" stroke-width="1.5" aria-hidden="true" />
          </div>
        </div>

        <h2 class="mt-8 text-2xl font-semibold leading-tight text-grey-900">
          Credit isn't available for your business yet
        </h2>
        <p class="mt-3 max-w-md text-base leading-6 text-grey-text">
          Keep placing orders on GoSource and we'll let you know when you're eligible to apply for
          business credit.
        </p>

        <Button
          size="small"
          class="mt-8 !w-auto"
          :left-icon="ShoppingBag"
          @click="navigateTo('/market')"
        >
          Browse market
        </Button>

        <p class="mt-6 max-w-sm text-xs leading-5 text-grey-400">
          Eligibility is based on your order history and business profile. No action is required
          right now.
        </p>
      </div>
    </div>
  </div>
</template>
