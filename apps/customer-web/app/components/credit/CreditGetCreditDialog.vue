<script setup lang="ts">
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
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import CreditApplySelectField from '~/components/credit/CreditApplySelectField.vue';
import {
  CREDIT_REPAYMENT_FREQUENCY_OPTIONS,
  CREDIT_REPAYMENT_MONTHLY_DURATION_OPTIONS,
  CREDIT_REPAYMENT_WEEKLY_DURATION_OPTIONS,
} from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import {
  buildCreateCreditRequestPayload,
  createEmptyCreditGetCreditForm,
  validateCreditGetCreditForm,
  type CreditGetCreditFormValues,
} from '~/lib/credit-request-form';
import { formatNairaAmountInput } from '~/lib/wallet-display';
import type { CustomerCreditAccount, CustomerCreditRequest, CreditRequestType } from '~/types/credit';
import { useCustomerCreditService } from '~/services/credit.service';

const props = defineProps<{
  open: boolean;
  requestType: CreditRequestType;
  account: CustomerCreditAccount | null;
  reapplyRequest?: CustomerCreditRequest | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  success: [];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');
const { createRequest } = useCustomerCreditService();
const submitting = ref(false);
const form = ref<CreditGetCreditFormValues>(createEmptyCreditGetCreditForm());
const errors = ref<Partial<Record<keyof CreditGetCreditFormValues, string>>>({});

const title = computed(() =>
  props.requestType === 'topup' ? 'Top up credit' : 'Get credit',
);

const durationOptions = computed(() =>
  form.value.repaymentFrequency === 'WEEKLY'
    ? CREDIT_REPAYMENT_WEEKLY_DURATION_OPTIONS
    : CREDIT_REPAYMENT_MONTHLY_DURATION_OPTIONS,
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }

    errors.value = {};
    if (props.reapplyRequest) {
      form.value = {
        requestedAmount: String(Math.round(props.reapplyRequest.requestedAmountKobo / 100)),
        repaymentFrequency: props.reapplyRequest.requestedRepaymentFrequency ?? '',
        repaymentDuration: props.reapplyRequest.requestedRepaymentDuration
          ? String(props.reapplyRequest.requestedRepaymentDuration)
          : '',
      };
      return;
    }

    form.value = createEmptyCreditGetCreditForm();
  },
);

watch(
  () => form.value.repaymentFrequency,
  () => {
    form.value.repaymentDuration = '';
    errors.value.repaymentDuration = '';
  },
);

function close() {
  emit('update:open', false);
}

function onAmountInput(value: string) {
  form.value.requestedAmount = formatNairaAmountInput(value);
}

async function submit() {
  const availableKobo = props.account?.availableKobo ?? 0;
  const nextErrors = validateCreditGetCreditForm(form.value, {
    availableKobo,
    requestType: props.requestType,
  });
  errors.value = nextErrors;
  if (Object.keys(nextErrors).length > 0) {
    return;
  }

  submitting.value = true;
  try {
    await createRequest(buildCreateCreditRequestPayload(form.value, props.requestType));
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}

const formBody = computed(() => ({
  intro: `You can access up to ${formatCreditFromKobo(props.account?.availableKobo ?? 0)} credit on GoSource. Enter the amount you'd like to get.`,
}));
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <DrawerTitle class="text-[24px] font-semibold text-grey-900">{{ title }}</DrawerTitle>
        <DrawerDescription class="text-[12px] leading-5 text-grey-text">
          {{ formBody.intro }}
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody class="space-y-4">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Credit amount</span>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-grey-400"
              aria-hidden="true"
            >
              ₦
            </span>
            <Input
              :model-value="form.requestedAmount"
              class="pl-8"
              inputmode="numeric"
              :disabled="submitting"
              :invalid="Boolean(errors.requestedAmount)"
              @update:model-value="onAmountInput"
            />
          </div>
          <p v-if="errors.requestedAmount" class="text-[12px] font-medium text-negative-500">
            {{ errors.requestedAmount }}
          </p>
        </label>

        <CreditApplySelectField
          v-model="form.repaymentFrequency"
          :options="[...CREDIT_REPAYMENT_FREQUENCY_OPTIONS]"
          placeholder="Select frequency"
          :disabled="submitting"
          :error="errors.repaymentFrequency"
        >
          Repayment frequency
        </CreditApplySelectField>

        <CreditApplySelectField
          v-if="form.repaymentFrequency"
          v-model="form.repaymentDuration"
          :options="durationOptions"
          placeholder="Select duration"
          :disabled="submitting"
          :error="errors.repaymentDuration"
        >
          Repayment duration
        </CreditApplySelectField>
      </DrawerBody>
      <DrawerFooter class="gap-3">
        <Button variant="neutral" class="w-full" :disabled="submitting" @click="close">Cancel</Button>
        <Button variant="primary" class="w-full" :loading="submitting" @click="submit">{{ title }}</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle class="text-[24px] font-semibold text-grey-900">{{ title }}</DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            {{ formBody.intro }}
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" :disabled="submitting" />
      </DialogHeader>
      <DialogBody class="space-y-4">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Credit amount</span>
          <div class="relative">
            <span
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-grey-400"
              aria-hidden="true"
            >
              ₦
            </span>
            <Input
              :model-value="form.requestedAmount"
              class="pl-8"
              inputmode="numeric"
              :disabled="submitting"
              :invalid="Boolean(errors.requestedAmount)"
              @update:model-value="onAmountInput"
            />
          </div>
          <p v-if="errors.requestedAmount" class="text-[12px] font-medium text-negative-500">
            {{ errors.requestedAmount }}
          </p>
        </label>

        <CreditApplySelectField
          v-model="form.repaymentFrequency"
          :options="[...CREDIT_REPAYMENT_FREQUENCY_OPTIONS]"
          placeholder="Select frequency"
          :disabled="submitting"
          :error="errors.repaymentFrequency"
        >
          Repayment frequency
        </CreditApplySelectField>

        <CreditApplySelectField
          v-if="form.repaymentFrequency"
          v-model="form.repaymentDuration"
          :options="durationOptions"
          placeholder="Select duration"
          :disabled="submitting"
          :error="errors.repaymentDuration"
        >
          Repayment duration
        </CreditApplySelectField>
      </DialogBody>
      <DialogFooter class="gap-3">
        <Button variant="neutral" :disabled="submitting" @click="close">Cancel</Button>
        <Button variant="primary" :loading="submitting" @click="submit">{{ title }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
