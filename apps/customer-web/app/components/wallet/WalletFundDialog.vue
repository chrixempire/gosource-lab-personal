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
  Input,
  RadioGroup,
  RadioGroupItem,
  toast,
} from '@gosource/ui';
import { CreditCard, Landmark } from 'lucide-vue-next';
import WalletFundTransferDialog from '~/components/wallet/WalletFundTransferDialog.vue';
import { waitForWalletFundingConfirmation } from '~/composables/useWalletFundingConfirmation';
import { usePaystack } from '~/composables/usePaystack';
import {
  formatNairaAmountInWords,
  formatNairaAmountInput,
  isWalletVirtualAccountPending,
  parseNairaAmountInput,
} from '~/lib/wallet-display';
import { extractPaystackPaymentReference } from '~/lib/wallet-paystack';
import { useCustomerWalletService } from '~/services/wallet.service';

type FundMethod = 'paystack' | 'transfer';

const props = defineProps<{
  open: boolean;
  businessId: string;
  wallet: WalletRecord | null;
}>();

const emit = defineEmits<{
  funded: [];
  'funding-initiated': [];
  'update:open': [value: boolean];
}>();

const { fundWallet, listTransactions, devConfirmFunding } = useCustomerWalletService();
const { mutate: paystackMutate } = usePaystack();

const step = ref<'amount' | 'method'>('amount');
const selectedMethod = ref<FundMethod | null>(null);
const transferDialogOpen = ref(false);
const amount = ref('');
const amountError = ref('');
const funding = ref(false);
const confirming = ref(false);

const isBusy = computed(() => funding.value || confirming.value);
const transferAvailable = computed(() => !isWalletVirtualAccountPending(props.wallet));

const parsedAmount = computed(() => parseNairaAmountInput(amount.value));
const amountInWords = computed(() => formatNairaAmountInWords(parsedAmount.value));

const amountDialogOpen = computed(
  () => props.open && !transferDialogOpen.value && !funding.value && !confirming.value,
);

function onAmountInput(value: string) {
  amountError.value = '';
  amount.value = formatNairaAmountInput(value);
}

function resetForm() {
  step.value = 'amount';
  selectedMethod.value = null;
  amount.value = '';
  amountError.value = '';
}

function closeAmountDialog() {
  if (isBusy.value) {
    return;
  }
  emit('update:open', false);
}

function validateAmount() {
  const value = parsedAmount.value;
  if (!amount.value.trim() || !Number.isFinite(value)) {
    amountError.value = 'Amount is required';
    return false;
  }
  if (value < 1000) {
    amountError.value = 'Minimum funding amount is ₦1,000';
    return false;
  }
  amountError.value = '';
  return true;
}

function continueToMethodStep() {
  if (!validateAmount()) {
    return;
  }
  step.value = 'method';
  if (!transferAvailable.value) {
    selectedMethod.value = 'paystack';
    return;
  }
  if (!selectedMethod.value) {
    selectedMethod.value = 'paystack';
  }
}

function backToAmountStep() {
  if (isBusy.value) {
    return;
  }
  step.value = 'amount';
}

async function confirmFunding(paymentReference: string, numericAmount: number) {
  confirming.value = true;
  const processingToast = toast.loading('Confirming your wallet balance…');

  try {
    if (import.meta.dev) {
      await devConfirmFunding({
        paymentReference,
        amount: numericAmount,
      });
    }

    const outcome = await waitForWalletFundingConfirmation({
      paymentReference,
      listTransactions: (query) => listTransactions(query, { silent: true }),
      intervalMs: 800,
      maxAttempts: 20,
    });

    if (outcome === 'successful') {
      toast.success('Wallet funded successfully');
      resetForm();
      emit('funded');
      emit('update:open', false);
      return;
    }

    if (outcome === 'failed') {
      toast.error('Wallet funding failed. Please try again or contact support.');
      return;
    }

    toast.warning(
      import.meta.dev
        ? 'Payment recorded. If your balance is still ₦0, restart legacy-api and try again, or configure Paystack webhooks to your local server.'
        : 'Payment received but confirmation is taking longer than expected. Your balance will update shortly — refresh this page in a moment.',
    );
    emit('funded');
    emit('update:open', false);
    resetForm();
  } finally {
    toast.dismiss(processingToast);
    confirming.value = false;
  }
}

async function continueWithPaystack() {
  if (!validateAmount()) {
    return;
  }

  const numericAmount = parsedAmount.value;
  emit('update:open', false);
  await nextTick();

  funding.value = true;

  try {
    const outcome = await paystackMutate({
      amount: numericAmount,
      metadata: {
        businessId: props.businessId,
      },
      onSuccess: async (event: unknown) => {
        const reference = extractPaystackPaymentReference(event);

        if (!reference) {
          toast.error('Paystack did not return a payment reference.');
          throw new Error('missing-reference');
        }

        await fundWallet({
          amount: numericAmount,
          transactionReference: reference,
        });

        emit('funding-initiated');
        await confirmFunding(reference, numericAmount);
      },
    });

    if (outcome === 'cancelled') {
      toast.message('Payment cancelled.');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'missing-reference') {
      return;
    }
    toast.error('Something went wrong while opening Paystack. Please try again.');
  } finally {
    funding.value = false;
  }
}

async function continueWithTransfer() {
  if (!validateAmount() || !transferAvailable.value) {
    return;
  }

  emit('update:open', false);
  await nextTick();
  transferDialogOpen.value = true;
}

function onContinueWithSelectedMethod() {
  if (!selectedMethod.value) {
    return;
  }

  if (selectedMethod.value === 'paystack') {
    void continueWithPaystack();
    return;
  }

  void continueWithTransfer();
}

function onTransferDone() {
  transferDialogOpen.value = false;
  resetForm();
  toast.message('When your transfer is confirmed, your wallet balance will update automatically.');
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm();
      return;
    }

    if (!transferDialogOpen.value && !funding.value && !confirming.value) {
      resetForm();
    }
  },
);

watch(transferDialogOpen, (isOpen) => {
  if (!isOpen && !props.open) {
    resetForm();
  }
});
</script>

<template>
  <Dialog :open="amountDialogOpen" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            {{ step === 'amount' ? 'Add money' : 'How would you like to pay?' }}
          </DialogTitle>
          <DialogDescription v-if="step === 'method'" class="text-[12px] leading-5 text-grey-text">
            Choose card payment or a bank transfer to your wallet account.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0 cursor-pointer" :disabled="isBusy" />
      </DialogHeader>

      <DialogBody>
        <template v-if="step === 'amount'">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Amount</span>
            <div class="relative">
              <span
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-grey-400"
                aria-hidden="true"
              >
                ₦
              </span>
              <Input
                :model-value="amount"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                placeholder="1,000"
                class="pl-8"
                :disabled="isBusy"
                :invalid="Boolean(amountError)"
                @update:model-value="onAmountInput"
              />
            </div>
            <p v-if="amountInWords && !amountError" class="text-[12px] leading-5 text-grey-300">
              {{ amountInWords }}
            </p>
            <p v-if="amountError" class="text-[12px] font-medium text-negative-500">
              {{ amountError }}
            </p>
          </label>
        </template>

        <template v-else>
          <RadioGroup
            v-model="selectedMethod"
            name="wallet-fund-method"
            class="grid gap-3"
          >
            <label
              class="flex w-full cursor-pointer items-center gap-3 rounded-[18px] border p-3 text-left transition"
              :class="
                selectedMethod === 'paystack'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-grey-50 bg-background-on-canvas hover:border-primary-200 hover:bg-primary-50/40'
              "
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full"
                :class="
                  selectedMethod === 'paystack'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-grey-55 text-grey-300'
                "
              >
                <CreditCard class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-grey-900">Pay with card (Paystack)</p>
                <p class="text-sm leading-6 text-grey-text">
                  Pay online with debit card, bank, or other Paystack options.
                </p>
              </div>
              <RadioGroupItem value="paystack" class="shrink-0 self-center" />
            </label>

            <label
              class="flex w-full items-center gap-3 rounded-[18px] border p-3 text-left transition"
              :class="[
                selectedMethod === 'transfer'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-grey-50 bg-background-on-canvas hover:border-primary-200 hover:bg-primary-50/40',
                transferAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
              ]"
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full"
                :class="
                  selectedMethod === 'transfer'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-grey-55 text-grey-300'
                "
              >
                <Landmark class="size-5" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-grey-900">Bank transfer</p>
                <p class="text-sm leading-6 text-grey-text">
                  Transfer from your bank to your dedicated wallet account number.
                </p>
                <p v-if="!transferAvailable" class="mt-2 text-xs font-medium text-amber-700">
                  Your account number is still being assigned. Use card payment for now.
                </p>
              </div>
              <RadioGroupItem
                value="transfer"
                :disabled="!transferAvailable"
                class="shrink-0 self-center"
              />
            </label>
          </RadioGroup>
        </template>
      </DialogBody>

      <DialogFooter class="gap-2">
        <template v-if="step === 'amount'">
          <Button variant="neutral" size="medium" class="!w-auto" :disabled="isBusy" @click="closeAmountDialog">
            Cancel
          </Button>
          <Button size="medium" class="!w-auto" :disabled="isBusy" @click="continueToMethodStep">
            Continue
          </Button>
        </template>
        <template v-else>
          <Button variant="neutral" size="medium" class="!w-auto" :disabled="isBusy" @click="backToAmountStep">
            Back
          </Button>
          <Button
            size="medium"
            class="!w-auto"
            :disabled="isBusy || !selectedMethod || (selectedMethod === 'transfer' && !transferAvailable)"
            @click="onContinueWithSelectedMethod"
          >
            {{
              selectedMethod === 'transfer'
                ? 'Continue with transfer'
                : 'Continue with Paystack'
            }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <WalletFundTransferDialog
    :open="transferDialogOpen"
    :wallet="wallet"
    :amount="parsedAmount"
    @update:open="transferDialogOpen = $event"
    @done="onTransferDone"
  />
</template>
