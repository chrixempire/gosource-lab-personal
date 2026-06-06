<script setup lang="ts">
import { Input } from '@gosource/ui';
import type { CreditApplicationFormValues, CreditApplyFieldErrors } from '~/lib/credit-apply';

const props = defineProps<{
  values: CreditApplicationFormValues;
  errors: CreditApplyFieldErrors;
  businessName: string;
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
      <h2 class="text-xl font-semibold text-grey-900">Let's verify your business</h2>
      <p class="text-sm text-grey-400">
        Enter your information so we can verify your business registration.
      </p>
    </div>

    <div class="space-y-5">
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">Business name</span>
        <Input
          :model-value="businessName"
          placeholder="Your registered business name"
          disabled
          class="disabled:text-grey-900"
        />
      </label>

      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">CAC registration number</span>
        <Input
          :model-value="values.cacRegistrationNumber"
          placeholder="RC-123456"
          :disabled="disabled"
          :invalid="Boolean(errors.cacRegistrationNumber)"
          @update:model-value="update({ cacRegistrationNumber: $event })"
        />
        <p v-if="errors.cacRegistrationNumber" class="text-[12px] font-medium text-negative-500">
          {{ errors.cacRegistrationNumber }}
        </p>
      </label>

      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">TIN (optional)</span>
        <Input
          :model-value="values.tin"
          placeholder="12345678-0001"
          :disabled="disabled"
          @update:model-value="update({ tin: $event })"
        />
      </label>
    </div>
  </div>
</template>
