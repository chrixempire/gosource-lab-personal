<script setup lang="ts">
import { RadioGroup, RadioGroupItem } from '@gosource/ui';
import { CreditCard, Landmark, Wallet } from 'lucide-vue-next';

export type CheckoutPaymentMethodValue = 'Paystack' | 'Credit' | 'Transfer' | 'Wallet';

const props = defineProps<{
  modelValue: CheckoutPaymentMethodValue | null;
  walletBalance?: number | null;
  orderTotal: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: CheckoutPaymentMethodValue];
}>();

const methods: Array<{
  value: CheckoutPaymentMethodValue;
  label: string;
  description: string;
  icon: typeof CreditCard;
  disabled?: (walletBalance: number, orderTotal: number) => boolean;
}> = [
  {
    value: 'Paystack',
    label: 'Pay online',
    description: 'Use Paystack as the payment method for this order.',
    icon: CreditCard,
  },
  {
    value: 'Credit',
    label: 'Pay with credit',
    description: 'Credit checkout is coming soon and is currently unavailable.',
    icon: CreditCard,
    disabled: () => true,
  },
  {
    value: 'Transfer',
    label: 'Pay with transfer',
    description: 'Confirm this request with bank transfer as the payment method.',
    icon: Landmark,
  },
  {
    value: 'Wallet',
    label: 'Pay with wallet',
    description: 'Use your wallet balance if it covers the order total.',
    icon: Wallet,
    disabled: (walletBalance, orderTotal) => orderTotal > walletBalance,
  },
];

function isDisabled(method: (typeof methods)[number]) {
  return method.disabled?.(Number(props.walletBalance ?? 0), props.orderTotal) ?? false;
}
</script>

<template>
  <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
    <div class="mb-5">
      <h2 class="text-lg font-semibold text-grey-900">Payment method</h2>
      <p class="mt-1 text-sm text-grey-text">
        Choose how this pending request should be checked out.
      </p>
    </div>

    <RadioGroup
      :model-value="modelValue ?? undefined"
      name="checkout-payment-method"
      class="grid gap-3"
      @update:model-value="emit('update:modelValue', $event as CheckoutPaymentMethodValue)"
    >
      <label
        v-for="method in methods"
        :key="method.value"
        class="flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition"
        :class="[
          modelValue === method.value
            ? 'border-primary-500 bg-primary-50'
            : 'border-grey-50 bg-background-on-canvas hover:border-primary-200 hover:bg-primary-50/40',
          isDisabled(method) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ]"
      >
        <div
          class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full"
          :class="modelValue === method.value ? 'bg-primary-100 text-primary-700' : 'bg-grey-55 text-grey-300'"
        >
          <component :is="method.icon" class="size-5" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <p class="text-sm font-semibold text-grey-900">
              {{ method.label }}
            </p>
          </div>
          <p class="text-sm leading-6 text-grey-text">
            {{ method.description }}
          </p>
          <p
            v-if="method.value === 'Wallet' && walletBalance !== null && walletBalance !== undefined"
            class="mt-2 text-xs font-medium text-grey-300"
          >
            Wallet balance: {{ new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(walletBalance) }}
          </p>
        </div>

        <RadioGroupItem
          :value="method.value"
          :disabled="isDisabled(method)"
          class="shrink-0 self-center"
        />
      </label>
    </RadioGroup>
  </section>
</template>
