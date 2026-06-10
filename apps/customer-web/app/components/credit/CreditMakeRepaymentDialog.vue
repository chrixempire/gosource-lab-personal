<script setup lang="ts">
import type { WalletRecord } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { CreditCard, Landmark, Wallet } from 'lucide-vue-next';
import CheckoutTransferDialog from '~/components/checkout/CheckoutTransferDialog.vue';
import { usePaystack } from '~/composables/usePaystack';
import { CREDIT_PAYMENT_METHOD_OPTIONS } from '~/lib/credit-constants';
import { formatCreditFromKobo, koboToNaira } from '~/lib/credit-money';
import { formatRequestDate } from '~/lib/request-details';
import {
  formatNairaAmountInput,
  parseNairaAmountInput,
} from '~/lib/wallet-display';
import type { CreditPaymentMethod, CustomerCreditAccount, CustomerUpcomingCreditPayment } from '~/types/credit';
import { useCustomerCreditService } from '~/services/credit.service';
import { useCustomerWalletService } from '~/services/wallet.service';

const props = defineProps<{
  open: boolean;
  upcoming: CustomerUpcomingCreditPayment;
  account: CustomerCreditAccount | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');
const { makePayment } = useCustomerCreditService();
const { getWallet } = useCustomerWalletService();
const { mutate: payWithPaystack } = usePaystack();

const submitting = ref(false);
const transferOpen = ref(false);
const paymentMethod = ref<CreditPaymentMethod | null>(null);
const useCustomAmount = ref(false);
const customAmount = ref('');
const customAmountError = ref('');
const wallet = ref<WalletRecord | null>(null);

const totalDueNaira = computed(() => koboToNaira(props.upcoming?.totalNextPaymentKobo ?? 0));

const effectiveAmountNaira = computed(() => {
  if (useCustomAmount.value) {
    const parsed = parseNairaAmountInput(customAmount.value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return totalDueNaira.value;
});

const methodIcons = {
  WALLET: Wallet,
  BANK_TRANSFER: Landmark,
  CARD: CreditCard,
} as const;

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    paymentMethod.value = null;
    useCustomAmount.value = false;
    customAmount.value = '';
    customAmountError.value = '';
    void loadWallet();
  },
);

async function loadWallet() {
  wallet.value = await getWallet({ silent: true });
}

function close() {
  emit('update:open', false);
}

function validateCustomAmount() {
  if (!useCustomAmount.value) {
    customAmountError.value = '';
    return true;
  }

  const parsed = parseNairaAmountInput(customAmount.value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    customAmountError.value = 'Enter a valid amount';
    return false;
  }
  if (parsed > totalDueNaira.value) {
    customAmountError.value = 'Amount cannot exceed total due';
    return false;
  }

  customAmountError.value = '';
  return true;
}

function canSubmit() {
  if (!paymentMethod.value || !validateCustomAmount()) {
    return false;
  }
  if (paymentMethod.value === 'WALLET' && (wallet.value?.balance ?? 0) < effectiveAmountNaira.value) {
    return false;
  }
  return effectiveAmountNaira.value > 0;
}

async function submitPayment(transactionReference?: string) {
  if (!paymentMethod.value) {
    return;
  }

  submitting.value = true;
  try {
    await makePayment({
      paymentAmount: effectiveAmountNaira.value,
      paymentMethod: paymentMethod.value,
      ...(transactionReference ? { transactionReference } : {}),
    });
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}

async function handlePay() {
  if (!canSubmit()) {
    if (paymentMethod.value === 'WALLET') {
      toast.error('Insufficient wallet balance');
    }
    return;
  }

  if (paymentMethod.value === 'BANK_TRANSFER') {
    transferOpen.value = true;
    return;
  }

  if (paymentMethod.value === 'CARD') {
    const creditAccountId = props.account?.id;
    if (!creditAccountId) {
      toast.error('Credit account not found');
      return;
    }

    const result = await payWithPaystack({
      amount: effectiveAmountNaira.value,
      metadata: { creditAccountId },
      onSuccess: (event) => {
        const reference =
          event && typeof event === 'object' && 'reference' in event
            ? String((event as { reference?: string }).reference ?? '')
            : '';
        void submitPayment(reference || undefined);
      },
    });

    if (result === 'cancelled') {
      return;
    }
    return;
  }

  await submitPayment();
}

function onCustomAmountInput(value: string) {
  customAmount.value = formatNairaAmountInput(value);
  validateCustomAmount();
}

watch(useCustomAmount, () => {
  customAmount.value = '';
  customAmountError.value = '';
});
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <DrawerTitle>Make repayment</DrawerTitle>
        <DrawerDescription v-if="upcoming?.nextDueDate" class="text-[12px] leading-5 text-grey-text">
          Next due {{ formatRequestDate(upcoming.nextDueDate) }}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody class="space-y-4">
        <div
          v-if="upcoming && upcoming.overdueCount > 0"
          class="rounded-[16px] border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-grey-700"
        >
          {{ upcoming.overdueCount }} overdue payment(s) ·
          {{ formatCreditFromKobo(upcoming.totalOverdueKobo) }}
        </div>

        <div class="rounded-[16px] border border-grey-50 bg-grey-55 px-4 py-3 text-sm">
          <div class="flex justify-between gap-2">
            <span class="text-grey-400">Principal</span>
            <span class="font-medium text-grey-900">
              {{ formatCreditFromKobo(upcoming?.principalAmountKobo ?? 0) }}
            </span>
          </div>
          <div class="mt-2 flex justify-between gap-2">
            <span class="text-grey-400">Interest</span>
            <span class="font-medium text-grey-900">
              {{ formatCreditFromKobo(upcoming?.interestAmountKobo ?? 0) }}
            </span>
          </div>
          <div class="mt-2 flex justify-between gap-2 border-t border-grey-50 pt-2">
            <span class="font-semibold text-grey-900">Total due</span>
            <span class="font-semibold text-grey-900">
              {{ formatCreditFromKobo(upcoming?.totalNextPaymentKobo ?? 0) }}
            </span>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-grey-700">
          <input v-model="useCustomAmount" type="checkbox" class="size-4 rounded border-grey-50" />
          Pay a custom amount
        </label>

        <label v-if="useCustomAmount" class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Custom amount</span>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-grey-400"
              aria-hidden="true"
            >
              ₦
            </span>
            <Input
              :model-value="customAmount"
              class="pl-8"
              inputmode="numeric"
              :invalid="Boolean(customAmountError)"
              @update:model-value="onCustomAmountInput"
            />
          </div>
          <p v-if="customAmountError" class="text-[12px] font-medium text-negative-500">
            {{ customAmountError }}
          </p>
        </label>

        <RadioGroup v-model="paymentMethod" name="credit-repayment-method" class="grid gap-3">
          <label
            v-for="method in CREDIT_PAYMENT_METHOD_OPTIONS"
            :key="method.value"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[18px] border p-3 text-left transition"
            :class="
              paymentMethod === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-grey-50 bg-background-on-canvas hover:border-primary-200'
            "
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full"
              :class="
                paymentMethod === method.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-grey-55 text-grey-300'
              "
            >
              <component :is="methodIcons[method.value]" class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-grey-900">{{ method.label }}</p>
              <p class="text-sm leading-6 text-grey-text">{{ method.description }}</p>
              <p
                v-if="method.value === 'WALLET' && wallet"
                class="mt-1 text-xs text-grey-400"
              >
                Balance: ₦{{ wallet.balance.toLocaleString('en-NG') }}
              </p>
            </div>
            <RadioGroupItem :value="method.value" class="shrink-0" />
          </label>
        </RadioGroup>
      </DrawerBody>
      <DrawerFooter>
        <Button variant="primary" class="w-full" :loading="submitting" :disabled="!canSubmit()" @click="handlePay">
          Make payment
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>Make repayment</DialogTitle>
          <DialogDescription v-if="upcoming?.nextDueDate" class="text-[12px] leading-5 text-grey-text">
            Next due {{ formatRequestDate(upcoming.nextDueDate) }}
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" :disabled="submitting" />
      </DialogHeader>
      <DialogBody class="space-y-4">
        <div
          v-if="upcoming && upcoming.overdueCount > 0"
          class="rounded-[16px] border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-grey-700"
        >
          {{ upcoming.overdueCount }} overdue payment(s) ·
          {{ formatCreditFromKobo(upcoming.totalOverdueKobo) }}
        </div>

        <div class="rounded-[16px] border border-grey-50 bg-grey-55 px-4 py-3 text-sm">
          <div class="flex justify-between gap-2">
            <span class="text-grey-400">Principal</span>
            <span class="font-medium text-grey-900">
              {{ formatCreditFromKobo(upcoming?.principalAmountKobo ?? 0) }}
            </span>
          </div>
          <div class="mt-2 flex justify-between gap-2">
            <span class="text-grey-400">Interest</span>
            <span class="font-medium text-grey-900">
              {{ formatCreditFromKobo(upcoming?.interestAmountKobo ?? 0) }}
            </span>
          </div>
          <div class="mt-2 flex justify-between gap-2 border-t border-grey-50 pt-2">
            <span class="font-semibold text-grey-900">Total due</span>
            <span class="font-semibold text-grey-900">
              {{ formatCreditFromKobo(upcoming?.totalNextPaymentKobo ?? 0) }}
            </span>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-grey-700">
          <input v-model="useCustomAmount" type="checkbox" class="size-4 rounded border-grey-50" />
          Pay a custom amount
        </label>

        <label v-if="useCustomAmount" class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Custom amount</span>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-grey-400"
              aria-hidden="true"
            >
              ₦
            </span>
            <Input
              :model-value="customAmount"
              class="pl-8"
              inputmode="numeric"
              :invalid="Boolean(customAmountError)"
              @update:model-value="onCustomAmountInput"
            />
          </div>
          <p v-if="customAmountError" class="text-[12px] font-medium text-negative-500">
            {{ customAmountError }}
          </p>
        </label>

        <RadioGroup v-model="paymentMethod" name="credit-repayment-method-desktop" class="grid gap-3">
          <label
            v-for="method in CREDIT_PAYMENT_METHOD_OPTIONS"
            :key="method.value"
            class="flex w-full cursor-pointer items-center gap-3 rounded-[18px] border p-3 text-left transition"
            :class="
              paymentMethod === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-grey-50 bg-background-on-canvas hover:border-primary-200'
            "
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full"
              :class="
                paymentMethod === method.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-grey-55 text-grey-300'
              "
            >
              <component :is="methodIcons[method.value]" class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-grey-900">{{ method.label }}</p>
              <p class="text-sm leading-6 text-grey-text">{{ method.description }}</p>
              <p
                v-if="method.value === 'WALLET' && wallet"
                class="mt-1 text-xs text-grey-400"
              >
                Balance: ₦{{ wallet.balance.toLocaleString('en-NG') }}
              </p>
            </div>
            <RadioGroupItem :value="method.value" class="shrink-0" />
          </label>
        </RadioGroup>
      </DialogBody>
      <DialogFooter>
        <Button variant="primary" :loading="submitting" :disabled="!canSubmit()" @click="handlePay">
          Make payment
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <CheckoutTransferDialog
    :open="transferOpen"
    :loading="submitting"
    @update:open="transferOpen = $event"
    @confirm="submitPayment()"
  />
</template>
