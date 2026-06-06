<script setup lang="ts">
import { Input, toast } from '@gosource/ui';
import CreditApplySelectField from '~/components/credit/CreditApplySelectField.vue';
import CreditFileUploadField from '~/components/credit/CreditFileUploadField.vue';
import {
  CREDIT_APPLY_BVN_HINT,
  CREDIT_APPLY_IDENTITY_OPTIONS,
  getCreditApplyBvnValidationError,
  type CreditApplicationFormValues,
  type CreditApplyFieldErrors,
} from '~/lib/credit-apply';

const props = defineProps<{
  values: CreditApplicationFormValues;
  errors: CreditApplyFieldErrors;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:values': [value: CreditApplicationFormValues];
  'clear-field-error': [field: keyof CreditApplyFieldErrors];
}>();

const bvnBlurred = ref(false);

const showBvnError = computed(() => {
  if (props.errors.bvn) {
    return true;
  }
  if (!bvnBlurred.value) {
    return false;
  }
  return getCreditApplyBvnValidationError(props.values.bvn) !== '';
});

const bvnHelperText = computed(() => props.errors.bvn || CREDIT_APPLY_BVN_HINT);

function update(partial: Partial<CreditApplicationFormValues>) {
  emit('update:values', { ...props.values, ...partial });
}

function onBvnInput(value: string) {
  const bvn = value.replace(/\D/g, '').slice(0, 11);
  update({ bvn });
  if (getCreditApplyBvnValidationError(bvn) === '') {
    emit('clear-field-error', 'bvn');
  }
}

function onBvnBlur() {
  bvnBlurred.value = true;
}
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-grey-900">Confirm your identity to move forward</h2>
      <p class="text-sm text-grey-400">
        We'll need your BVN and a valid form of ID for identity verification.
      </p>
    </div>

    <div class="space-y-5">
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">BVN</span>
        <Input
          :model-value="values.bvn"
          inputmode="numeric"
          maxlength="11"
          placeholder="22234567809"
          :disabled="disabled"
          :invalid="showBvnError"
          @update:model-value="onBvnInput"
          @blur="onBvnBlur"
        />
        <p
          class="text-[12px] font-medium"
          :class="showBvnError ? 'text-negative-500' : 'text-grey-400'"
        >
          {{ bvnHelperText }}
        </p>
      </label>

      <CreditApplySelectField
        :model-value="values.identityType"
        :options="CREDIT_APPLY_IDENTITY_OPTIONS"
        placeholder="Select identity type"
        :disabled="disabled"
        :error="errors.identityType"
        @update:model-value="update({ identityType: $event })"
      >
        Identity type
      </CreditApplySelectField>

      <CreditFileUploadField
        :model-value="values.identity"
        :disabled="disabled"
        :error="errors.identity"
        @update:model-value="update({ identity: $event })"
        @file-error="toast.error($event)"
      >
        Upload your valid ID (driver's license, NIN, or passport)
      </CreditFileUploadField>
    </div>
  </div>
</template>
