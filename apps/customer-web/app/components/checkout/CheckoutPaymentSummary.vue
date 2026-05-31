<script setup lang="ts">
import { Button } from '@gosource/ui';

defineProps<{
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  total: number;
  formatCurrency: (value: number) => string;
  submitting?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  submit: [];
}>();
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
    <div class="mb-5">
      <h2 class="text-lg font-semibold text-grey-900">Pricing summary</h2>
      <p class="mt-1 text-sm text-grey-text">
        This matches the request pricing that will be sent for checkout approval.
      </p>
    </div>

    <div class="space-y-3 text-sm">
      <div class="flex items-center justify-between gap-3">
        <span class="text-grey-900">Subtotal</span>
        <span class="font-medium text-grey-900">{{ formatCurrency(subtotal) }}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-grey-900">Delivery fee</span>
        <span class="font-medium text-grey-900">{{ formatCurrency(deliveryFee) }}</span>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-grey-900">Service charge</span>
        <span class="font-medium text-grey-900">{{ formatCurrency(serviceCharge) }}</span>
      </div>
      <div v-if="discount > 0" class="flex items-center justify-between gap-3">
        <span class="text-grey-900">Discount</span>
        <span class="font-medium text-success-700">-{{ formatCurrency(discount) }}</span>
      </div>

      <div class="border-t border-grey-50 pt-3">
        <div class="flex items-center justify-between gap-3 rounded-[16px] bg-grey-55 px-4 py-3">
          <span class="font-semibold text-grey-900">Total</span>
          <span class="text-base font-semibold text-grey-900">{{ formatCurrency(total) }}</span>
        </div>
      </div>

      <div class="border-t border-grey-50 pt-4">
        <Button
          variant="primary"
          size="medium"
          :class="[
            'w-full',
            !canSubmit && 'cursor-not-allowed !bg-button-disabled !text-disabled !shadow-none hover:!bg-button-disabled active:!bg-button-disabled active:!translate-y-0',
          ]"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="emit('submit')"
        >
          {{ submitLabel || 'Complete checkout' }}
        </Button>
        <p class="mt-3 text-sm leading-6 text-grey-text">
          This will approve the pending request using the selected payment method.
        </p>
      </div>
    </div>
  </section>
</template>
