<script setup lang="ts">
import { Button, toast } from '@gosource/ui';
import { CheckCircle2 } from 'lucide-vue-next';
import CreditApplyStepper from '~/components/credit/CreditApplyStepper.vue';
import CreditApplyBusinessStep from '~/components/credit/apply/CreditApplyBusinessStep.vue';
import CreditApplyFinancialStep from '~/components/credit/apply/CreditApplyFinancialStep.vue';
import CreditApplyKycStep from '~/components/credit/apply/CreditApplyKycStep.vue';
import CreditApplySummaryStep from '~/components/credit/apply/CreditApplySummaryStep.vue';
import {
  buildCreditApplicationFormData,
  createEmptyCreditApplicationForm,
  CREDIT_APPLY_STEPS,
  validateCreditApplyStep,
  isCreditApplyStepComplete,
  type CreditApplicationFormValues,
  type CreditApplyFieldErrors,
} from '~/lib/credit-apply';
import { CREDIT_PAGE_ROUTES } from '~/lib/credit-routes';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCustomerCreditService } from '~/services/credit.service';
import { useCustomerProfileService } from '~/services/profile.service';
import { extractApiErrorMessage } from '~/utils/api-error';

const { submitApplication } = useCustomerCreditService();
const { getBusinessAccount } = useCustomerProfileService();

const currentStep = ref(1);
const submitted = ref(false);
const submitting = ref(false);
const returnToSummary = ref(false);
const values = ref<CreditApplicationFormValues>(createEmptyCreditApplicationForm());
const errors = ref<CreditApplyFieldErrors>({});

const { data: applyBusinessContext } = await useAuthenticatedAsyncData(
  'credit-apply-business',
  async () => {
    const account = await getBusinessAccount({ silent: true }).catch(() => null);
    return {
      businessName: account?.businessName?.trim() ?? '',
    };
  },
  {
    default: () => ({ businessName: '' }),
  },
);

const businessName = computed(() => applyBusinessContext.value?.businessName ?? '');

const steps = [...CREDIT_APPLY_STEPS];
const summaryStep = steps.length;

const continueLabel = computed(() =>
  currentStep.value < summaryStep ? 'Save and continue' : 'Submit application',
);

const canContinue = computed(() => {
  if (submitting.value) {
    return false;
  }
  if (currentStep.value === summaryStep) {
    return true;
  }
  return isCreditApplyStepComplete(currentStep.value, values.value);
});

function goToStep(step: number) {
  returnToSummary.value = currentStep.value === summaryStep;
  currentStep.value = step;
  errors.value = {};
}

function clearFieldError(field: keyof CreditApplyFieldErrors) {
  if (!errors.value[field]) {
    return;
  }
  const next = { ...errors.value };
  delete next[field];
  errors.value = next;
}

async function handleContinue() {
  if (currentStep.value < summaryStep) {
    const stepErrors = validateCreditApplyStep(currentStep.value, values.value);
    errors.value = stepErrors;
    if (Object.keys(stepErrors).length > 0) {
      return;
    }
    if (returnToSummary.value) {
      returnToSummary.value = false;
      currentStep.value = summaryStep;
      return;
    }
    currentStep.value += 1;
    return;
  }

  const stepErrors = {
    ...validateCreditApplyStep(1, values.value),
    ...validateCreditApplyStep(2, values.value),
    ...validateCreditApplyStep(3, values.value),
  };
  errors.value = stepErrors;
  if (Object.keys(stepErrors).length > 0) {
    toast.error('Please complete all required fields before submitting');
    return;
  }

  submitting.value = true;
  try {
    await submitApplication(buildCreditApplicationFormData(values.value));
    submitted.value = true;
    toast.success('Credit application submitted successfully');
  } catch (error) {
    toast.error(extractApiErrorMessage(error, 'Failed to submit application. Please try again.'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-[60vh] py-2 sm:py-4">
    <div
      v-if="submitted"
      class="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl border border-grey-50 bg-background-on-canvas p-8 text-center shadow-sm"
    >
      <div class="flex size-20 items-center justify-center rounded-full bg-primary-50">
        <CheckCircle2 class="size-10 text-primary-600" aria-hidden="true" />
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold text-grey-900">Application submitted</h2>
        <p class="max-w-sm text-sm text-grey-400">
          Your credit application has been submitted successfully. We'll review it and notify you
          once a decision has been made.
        </p>
      </div>
      <Button
        size="small"
        class="!w-auto"
        @click="navigateTo(CREDIT_PAGE_ROUTES.HOME)"
      >
        Go to credit dashboard
      </Button>
    </div>

    <div v-else class="mx-auto max-w-2xl space-y-4">
      <CreditApplyStepper :current-step="currentStep" :steps="steps" />

      <div class="rounded-xl border border-grey-50 bg-background-on-canvas p-6 shadow-sm md:p-8">
        <CreditApplyBusinessStep
          v-show="currentStep === 1"
          :values="values"
          :errors="errors"
          :business-name="businessName"
          :disabled="submitting"
          @update:values="values = $event"
        />
        <CreditApplyFinancialStep
          v-show="currentStep === 2"
          :values="values"
          :errors="errors"
          :disabled="submitting"
          @update:values="values = $event"
        />
        <CreditApplyKycStep
          v-show="currentStep === 3"
          :values="values"
          :errors="errors"
          :disabled="submitting"
          @update:values="values = $event"
          @clear-field-error="clearFieldError"
        />
        <CreditApplySummaryStep
          v-show="currentStep === 4"
          :values="values"
          @edit="goToStep"
        />

        <Button
          class="mt-6 h-12 w-full"
          size="lg"
          :loading="submitting"
          :disabled="!canContinue"
          @click="handleContinue"
        >
          {{ continueLabel }}
        </Button>
      </div>
    </div>
  </div>
</template>
