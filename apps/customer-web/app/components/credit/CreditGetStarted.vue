<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Lock } from 'lucide-vue-next';
import { useCreditApplyAccess } from '~/composables/useCreditApplyAccess';

const { checkingAccess, openCreditApply } = useCreditApplyAccess();
</script>

<template>
  <div class="mx-auto w-full max-w-xl">
    <div
      class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-6 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] md:p-8"
    >
      <div class="flex flex-col items-center text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-grey-400">Credit</p>

        <div class="mt-4 w-full rounded-2xl bg-primary-50 px-6 py-10">
          <div
            class="mx-auto flex size-28 items-center justify-center rounded-full bg-primary-100 text-4xl font-semibold text-primary-700"
          >
            ₦
          </div>
        </div>

        <h3 class="mt-8">
          Access the credit you need, when you need it
        </h3>
        <p class="mt-3 max-w-md text-body-lg text-grey-text">
          Apply in minutes, share your business details, and start shopping with GoSource credit—no
          long queues, no delays.
        </p>

        <Button
          size="medium"
          class="mt-8 w-full"
          :loading="checkingAccess"
          :disabled="checkingAccess"
          @click="openCreditApply()"
        >
          Get started
        </Button>

        <div class="mt-6 flex w-full items-start gap-2 text-left text-xs leading-5 text-grey-400">
          <Lock class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            GoSource uses your business data and KYC details to determine your credit eligibility.
            Applying will not affect your credit score.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
