<script setup lang="ts">
import CreditApplySelectField from '~/components/credit/CreditApplySelectField.vue';
import CreditFileUploadField from '~/components/credit/CreditFileUploadField.vue';
import {
  CREDIT_APPLY_REVENUE_OPTIONS,
  CREDIT_APPLY_YEARS_OPTIONS,
  type CreditApplicationFormValues,
  type CreditApplyFieldErrors,
} from '~/lib/credit-apply';
import { toast } from '@gosource/ui';

const props = defineProps<{
  values: CreditApplicationFormValues;
  errors: CreditApplyFieldErrors;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:values': [value: CreditApplicationFormValues];
}>();

function update(partial: Partial<CreditApplicationFormValues>) {
  emit('update:values', { ...props.values, ...partial });
}
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-grey-900">Help us understand your business finances</h2>
      <p class="text-sm text-grey-400">
        This helps us determine the best credit package for your business.
      </p>
    </div>

    <div class="space-y-5">
      <CreditApplySelectField
        :model-value="values.revenueRange"
        :options="CREDIT_APPLY_REVENUE_OPTIONS"
        placeholder="Select monthly revenue"
        :disabled="disabled"
        :error="errors.revenueRange"
        @update:model-value="update({ revenueRange: $event })"
      >
        Monthly revenue range
      </CreditApplySelectField>

      <CreditApplySelectField
        :model-value="values.yearOfOperations"
        :options="CREDIT_APPLY_YEARS_OPTIONS"
        placeholder="Select years in operation"
        :disabled="disabled"
        :error="errors.yearOfOperations"
        @update:model-value="update({ yearOfOperations: $event })"
      >
        Years in operation
      </CreditApplySelectField>

      <CreditFileUploadField
        :model-value="values.bankStatement"
        :disabled="disabled"
        :error="errors.bankStatement"
        @update:model-value="update({ bankStatement: $event })"
        @file-error="toast.error($event)"
      >
        Upload your bank statement
      </CreditFileUploadField>
    </div>
  </div>
</template>
