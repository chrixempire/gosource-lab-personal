<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@gosource/ui';
import { waitForWalletFundingConfirmation } from '~/composables/useWalletFundingConfirmation';
import { usePaystack } from '~/composables/usePaystack';
import {
  formatNairaAmountInWords,
  formatNairaAmountInput,
  parseNairaAmountInput,
} from '~/lib/wallet-display';
import { extractPaystackPaymentReference } from '~/lib/wallet-paystack';
import { useCustomerWalletService } from '~/services/wallet.service';

const props = defineProps<{
  open: boolean;
  businessId: string;
}>();

const emit = defineEmits<{
  funded: [paymentReference?: string];
  refresh: [];
  'update:open': [value: boolean];
}>();

const { fundWallet, listTransactions, devConfirmFunding } = useCustomerWalletService();
const { mutate: paystackMutate } = usePaystack();

const amount = ref('');
const amountError = ref('');
const funding = ref(false);
const confirming = ref(false);

const isBusy = computed(() => funding.value || confirming.value);

const parsedAmount = computed(() => parseNairaAmountInput(amount.value));

const amountInWords = computed(() => formatNairaAmountInWords(parsedAmount.value));

function onAmountInput(value: string) {
  amountError.value = '';
  amount.value = formatNairaAmountInput(value);
}

function close() {
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

async function confirmFunding(paymentReference: string, numericAmount: number) {
  confirming.value = true;
  toast.message('Payment received. Confirming your wallet balance…');

  if (import.meta.dev) {
    void devConfirmFunding({
      paymentReference,
      amount: numericAmount,
    });
  }

  try {
    const outcome = await waitForWalletFundingConfirmation({
      paymentReference,
      listTransactions: (query) => listTransactions(query, { silent: true }),
      onPoll: () => {
        emit('refresh');
      },
    });

    emit('refresh');

    if (outcome === 'successful') {
      toast.success('Wallet funded successfully');
      amount.value = '';
      emit('funded', paymentReference);
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
    emit('funded', paymentReference);
    emit('update:open', false);
  } finally {
    confirming.value = false;
  }
}

async function onSubmit() {
  if (isBusy.value || !validateAmount()) {
    return;
  }

  const numericAmount = parsedAmount.value;
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

        emit('refresh');

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
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Fund wallet</DialogTitle>
        <DialogClose :disabled="isBusy" />
      </DialogHeader>
      <DialogBody>
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
        <p v-if="confirming" class="mt-3 text-sm text-grey-300">
          Confirming payment with your bank. This usually takes a few seconds.
        </p>
      </DialogBody>
      <DialogFooter class="gap-2">
        <Button variant="neutral" size="small" class="!w-auto" :disabled="isBusy" @click="close">
          Cancel
        </Button>
        <Button size="small" class="!w-auto" :loading="isBusy" @click="onSubmit">
          {{ confirming ? 'Confirming…' : 'Continue to Paystack' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
