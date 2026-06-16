<script setup lang="ts">
import { Button } from '@gosource/ui';
import {
  CREDIT_APPLY_IDENTITY_OPTIONS,
  CREDIT_APPLY_REVENUE_OPTIONS,
  CREDIT_APPLY_YEARS_OPTIONS,
  creditApplyOptionLabel,
  type CreditApplicationFormValues,
} from '~/lib/credit-apply';

defineProps<{
  values: CreditApplicationFormValues;
}>();

const emit = defineEmits<{
  edit: [step: number];
}>();

const cardClass =
  'rounded-[16px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]';
</script>

<template>
  <div class="space-y-6">
    <h3>Summary and finish up</h3>

    <article :class="cardClass">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-grey-400">Business information</h3>
        <Button
          type="button"
          variant="outline"
          size="small"
          class="!w-fit shrink-0"
          @click="emit('edit', 1)"
        >
          Edit
        </Button>
      </div>
      <dl class="mt-4 space-y-3 text-sm">
        <div>
          <dt class="font-medium text-grey-900">CAC registration number</dt>
          <dd class="text-grey-400">{{ values.cacRegistrationNumber || '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-grey-900">TIN</dt>
          <dd class="text-grey-400">{{ values.tin || '—' }}</dd>
        </div>
      </dl>
    </article>

    <article :class="cardClass">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-grey-400">Financial snapshot</h3>
        <Button
          type="button"
          variant="outline"
          size="small"
          class="!w-fit shrink-0"
          @click="emit('edit', 2)"
        >
          Edit
        </Button>
      </div>
      <dl class="mt-4 space-y-3 text-sm">
        <div>
          <dt class="font-medium text-grey-900">Monthly revenue range</dt>
          <dd class="text-grey-400">
            {{ creditApplyOptionLabel(CREDIT_APPLY_REVENUE_OPTIONS, values.revenueRange) || '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-grey-900">Years in operation</dt>
          <dd class="text-grey-400">
            {{ creditApplyOptionLabel(CREDIT_APPLY_YEARS_OPTIONS, values.yearOfOperations) || '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-grey-900">Bank statement</dt>
          <dd class="text-grey-400">{{ values.bankStatement?.name ?? '—' }}</dd>
        </div>
      </dl>
    </article>

    <article :class="cardClass">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-grey-400">KYC & consent</h3>
        <Button
          type="button"
          variant="outline"
          size="small"
          class="!w-fit shrink-0"
          @click="emit('edit', 3)"
        >
          Edit
        </Button>
      </div>
      <dl class="mt-4 space-y-3 text-sm">
        <div>
          <dt class="font-medium text-grey-900">BVN</dt>
          <dd class="text-grey-400">{{ values.bvn || '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-grey-900">Identity type</dt>
          <dd class="text-grey-400">
            {{ creditApplyOptionLabel(CREDIT_APPLY_IDENTITY_OPTIONS, values.identityType) || '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-grey-900">Valid ID</dt>
          <dd class="text-grey-400">{{ values.identity?.name ?? '—' }}</dd>
        </div>
      </dl>
    </article>
  </div>
</template>
