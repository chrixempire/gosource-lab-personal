<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Tag } from 'lucide-vue-next';
import CheckoutApplyCoupon from '~/components/checkout/CheckoutApplyCoupon.vue';
import { checkoutCouponDisplayLabel } from '~/lib/checkout-coupon';

const props = defineProps<{
  requestId: string;
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  total: number;
  formatCurrency: (value: number) => string;
  couponApplied?: boolean;
  couponLabel?: string | null;
  submitting?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  submit: [];
  'coupon-applied': [];
}>();

const showCouponInput = ref(false);

const couponDisplayLabel = computed(() =>
  checkoutCouponDisplayLabel(props.couponLabel, props.couponApplied),
);

watch(
  () => props.couponApplied,
  (applied) => {
    if (applied) {
      showCouponInput.value = false;
    }
  },
);
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
    <div class="mb-5">
      <h2 class="text-lg font-semibold text-grey-900">Pricing summary</h2>
      <p class="mt-1 text-sm text-grey-text">
        This matches the request pricing that will be sent for checkout approval.
      </p>
    </div>

    <div class="mb-5 rounded-[16px] border border-grey-50 bg-grey-55/60 p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Tag class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
          <p class="truncate text-sm font-medium text-grey-900">
            {{ couponDisplayLabel }}
          </p>
        </div>
        <Button
          v-if="!couponApplied && !showCouponInput"
          type="button"
          variant="secondary"
          size="small"
          class="!w-auto shrink-0"
          @click="showCouponInput = true"
        >
          Add
        </Button>
      </div>

      <div v-if="!couponApplied && showCouponInput" class="mt-3">
        <CheckoutApplyCoupon
          :request-id="requestId"
          @applied="emit('coupon-applied')"
        />
      </div>
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
