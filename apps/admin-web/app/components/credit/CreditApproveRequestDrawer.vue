<script setup lang="ts">
import { Button, StatusTag } from '@gosource/ui';
import AdminResponsiveOverlay from '~/components/shared/AdminResponsiveOverlay.vue';
import CreditFormattedNumberInput from '~/components/credit/CreditFormattedNumberInput.vue';
import CreditRepaymentTermsSummary from '~/components/credit/CreditRepaymentTermsSummary.vue';
import CreditSelectField from '~/components/credit/CreditSelectField.vue';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import {
  computeCreditApproveTotals,
  creditApproveFrequencyOptions,
  type CreditRepaymentFrequencyOption,
} from '~/lib/credit-approve';
import {
  CREDIT_MONTHLY_DURATION_OPTIONS,
  CREDIT_WEEKLY_DURATION_OPTIONS,
  creditStatusVariant,
  creditWorkflowStatusLabel,
} from '~/lib/credit-constants';
import { businessDisplayName } from '~/lib/credit-api';
import { nairaToNumber } from '~/lib/credit-money';
import type { CreditWorkflowStatus, LegacyCreditRequestRow } from '~/types/credit';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  creditRequest: LegacyCreditRequestRow;
  referenceLabel: string;
  status?: CreditWorkflowStatus | string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [body: Record<string, unknown>];
}>();

const repaymentFrequency = ref<CreditRepaymentFrequencyOption | ''>('');
const repaymentDuration = ref('3');
const customFrequencyDays = ref('21');
const interestRate = ref('5');
const gracePeriodDays = ref('0');
const overdueChargeRate = ref('0');

const frequencyOptions = computed(() =>
  creditApproveFrequencyOptions(props.creditRequest.requestType),
);

const durationOptions = computed(() =>
  repaymentFrequency.value === 'WEEKLY'
    ? CREDIT_WEEKLY_DURATION_OPTIONS
    : CREDIT_MONTHLY_DURATION_OPTIONS,
);

const isCustomFrequency = computed(() => repaymentFrequency.value === 'CUSTOM');

const totals = computed(() =>
  computeCreditApproveTotals({
    requestedAmountKobo: props.creditRequest.requestedAmountKobo ?? 0,
    repaymentFrequency: repaymentFrequency.value || 'MONTHLY',
    repaymentDuration: Number(repaymentDuration.value) || 0,
    interestRate: nairaToNumber(interestRate.value),
    customFrequencyDays: nairaToNumber(customFrequencyDays.value),
  }),
);

const businessName = computed(() => businessDisplayName(props.creditRequest.business));

watch(open, (value) => {
  if (!value) return;
  repaymentFrequency.value =
    props.creditRequest.requestType === 'topup' ? 'MONTHLY' : 'MONTHLY';
  repaymentDuration.value = '3';
  customFrequencyDays.value = '21';
  interestRate.value = '5';
  gracePeriodDays.value = '0';
  overdueChargeRate.value = '0';
});

function onSubmit() {
  if (!repaymentFrequency.value) return;
  if (isCustomFrequency.value && nairaToNumber(customFrequencyDays.value) < 1) return;

  emit('confirm', {
    approvedAmount: totals.value.principalAmount,
    repaymentFrequency: repaymentFrequency.value,
    repaymentDuration: Number(repaymentDuration.value),
    interestRate: nairaToNumber(interestRate.value),
    gracePeriodDays: nairaToNumber(gracePeriodDays.value),
    overdueChargeRate: nairaToNumber(overdueChargeRate.value),
    customFrequencyDays: isCustomFrequency.value ? nairaToNumber(customFrequencyDays.value) : 0,
  });
}
</script>

<template>
  <AdminResponsiveOverlay
    v-model:open="open"
    dialog-class="w-[min(92vw,520px)]"
  >
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-lg font-semibold text-grey-900">
          {{ referenceLabel }}
        </h2>
        <StatusTag
          v-if="status"
          :variant="creditStatusVariant(status)"
          size="medium"
          class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ creditWorkflowStatusLabel(status) }}
        </StatusTag>
      </div>
    </template>

    <div class="space-y-6">
      <div class="space-y-1">
        <h3 :class="ADMIN_MODAL_TITLE_CLASS">Set repayment terms</h3>
        <p class="text-sm text-grey-600">
          Define how the business will repay this credit. Set the repayment frequency, duration,
          and interest rate.
        </p>
      </div>

      <fieldset class="space-y-3">
        <legend class="text-sm font-medium text-grey-800">Repayment frequency</legend>
        <label
          v-for="option in frequencyOptions"
          :key="option.value"
          class="flex cursor-pointer gap-3 rounded-lg border border-grey-50 p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/40"
        >
          <input
            v-model="repaymentFrequency"
            type="radio"
            class="mt-1"
            :value="option.value"
          />
          <span>
            <span class="block text-sm font-medium text-grey-900">{{ option.label }}</span>
            <span class="mt-0.5 block text-xs text-grey-500">{{ option.snippet }}</span>
          </span>
        </label>
      </fieldset>

      <div class="grid gap-4 sm:grid-cols-2">
        <template v-if="isCustomFrequency">
          <label class="grid gap-1.5 text-sm">
            <span class="font-medium text-grey-800">Custom frequency (days)</span>
            <CreditFormattedNumberInput v-model="customFrequencyDays" placeholder="21" />
          </label>
          <label class="grid gap-1.5 text-sm">
            <span class="font-medium text-grey-800">Number of installments</span>
            <CreditFormattedNumberInput v-model="repaymentDuration" placeholder="5" />
          </label>
        </template>
        <div v-else class="sm:col-span-2">
          <CreditSelectField
            v-model="repaymentDuration"
            :options="durationOptions"
            placeholder="Select duration"
          >
            Repayment duration
          </CreditSelectField>
        </div>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Interest rate (%)</span>
          <CreditFormattedNumberInput
            v-model="interestRate"
            allow-decimal
            inputmode="decimal"
          />
        </label>
        <label class="grid gap-1.5 text-sm">
          <span class="font-medium text-grey-800">Grace period days (optional)</span>
          <CreditFormattedNumberInput v-model="gracePeriodDays" placeholder="0" />
        </label>
        <label class="grid gap-1.5 text-sm sm:col-span-2">
          <span class="font-medium text-grey-800">Overdue charges (%)</span>
          <CreditFormattedNumberInput
            v-model="overdueChargeRate"
            allow-decimal
            inputmode="decimal"
            placeholder="0"
          />
        </label>
      </div>

      <CreditRepaymentTermsSummary
        v-if="repaymentFrequency && Number(repaymentDuration) > 0"
        :principal-amount="totals.principalAmount"
        :total-interest-amount="totals.totalInterestAmount"
        :total-repayment="totals.totalRepayment"
        :installment-amount="totals.installmentAmount"
        :business-name="businessName"
        :repayment-frequency="repaymentFrequency"
        :repayment-duration="Number(repaymentDuration)"
        :interest-rate="nairaToNumber(interestRate)"
        :grace-period-days="nairaToNumber(gracePeriodDays)"
        :overdue-charge-rate="nairaToNumber(overdueChargeRate)"
      />
    </div>

    <template #footer>
      <Button type="button" variant="outline" size="small" class="!w-auto" @click="open = false">
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        size="small"
        class="!w-auto"
        :loading="loading"
        :disabled="!repaymentFrequency"
        @click="onSubmit"
      >
        Approve
      </Button>
    </template>
  </AdminResponsiveOverlay>
</template>
