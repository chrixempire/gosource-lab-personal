<script setup lang="ts">
import type { BranchResponse, CustomerMeResponse } from '@gosource/api-client';
import { BrandLogo, toast } from '@gosource/ui';
import BranchCreateForm from '~/components/onboarding/branch/BranchCreateForm.vue';
import BranchSuccessState from '~/components/onboarding/branch/BranchSuccessState.vue';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { useCustomerBranchService } from '~/services/branch.service';
import {
  validateBranchName,
  validateLga,
  validateRequiredText,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: false,
});

const { createBranch } = useCustomerBranchService();
const route = useRoute();
const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isHydrated = ref(false);
const form = useState('customer-branch-draft', () => ({
  branchName: '',
  streetName: '',
  lga: '',
}));
const loading = ref(false);
const errorMessage = ref('');
const createdBranch = ref<BranchResponse['data'] | null>(null);

const errors = reactive({
  branchName: '',
  streetName: '',
  lga: '',
});

const hasSession = computed(() => Boolean(session.value?.data?.businessId));
const routeStep = computed(() => String(route.query.step ?? 'create-branch'));

onMounted(() => {
  isHydrated.value = true;
});

if (routeStep.value !== 'create-branch' && routeStep.value !== 'created') {
  await navigateTo({
    path: '/onboarding/branch',
    query: {
      ...route.query,
      step: createdBranch.value ? 'created' : 'create-branch',
    },
  }, { replace: true });
}

async function submit() {
  errors.branchName = validateBranchName(form.value.branchName);
  errors.streetName = validateRequiredText(form.value.streetName, 'Street name');
  errors.lga = validateLga(form.value.lga);

  if (errors.branchName || errors.streetName || errors.lga) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await createBranch({
      branchName: form.value.branchName,
      streetName: form.value.streetName,
      lga: form.value.lga,
    });

    createdBranch.value = result.data ?? null;
    form.value = {
      branchName: '',
      streetName: '',
      lga: '',
    };
    toast.success(extractApiResponseMessage(result, 'Branch created successfully'));
    await navigateTo({
      path: '/onboarding/branch',
      query: {
        ...route.query,
        step: 'created',
      },
    }, { replace: true });
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to create branch right now');
  } finally {
    loading.value = false;
  }
}

function updateField(field: 'branchName' | 'streetName' | 'lga', value: string) {
  form.value[field] = value;
  errorMessage.value = '';

  if (field === 'branchName' && errors.branchName) {
    errors.branchName = validateBranchName(value);
  }

  if (field === 'streetName' && errors.streetName) {
    errors.streetName = validateRequiredText(value, 'Street name');
  }

  if (field === 'lga' && errors.lga) {
    errors.lga = validateLga(value);
  }
}
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="w-36" />
    </template>

    <AuthCardShell
      badge="Customer Onboarding"
      title="Create your first branch"
      description="This matches the next customer setup step in GoSource: define the first operating branch before inviting your team."
    >
      <div
        v-if="!isHydrated"
        class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4 text-[13px] text-grey-text"
      >
        Restoring your onboarding session...
      </div>

      <template v-else-if="hasSession">
        <BranchCreateForm
          v-if="!createdBranch"
          :branch-name="form.branchName"
          :street-name="form.streetName"
          :lga="form.lga"
          :loading="loading"
          :branch-name-error="errors.branchName"
          :street-name-error="errors.streetName"
          :lga-error="errors.lga"
          @update:branch-name="updateField('branchName', $event)"
          @update:street-name="updateField('streetName', $event)"
          @update:lga="updateField('lga', $event)"
          @submit="submit"
        />

        <BranchSuccessState
          v-else-if="createdBranch"
          :branch-name="createdBranch.branchName"
          :branch-code="createdBranch.branchCode"
          :is-headquarter="createdBranch.isHeadquarter"
        />
      </template>

      <div
        v-else
        class="rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-4 py-4 text-[13px] leading-6 text-grey-text"
      >
        <p class="font-semibold text-grey-900">Sign in or finish registration first</p>
        <p class="mt-1">
          We need an active customer session before we can attach a branch to your business.
        </p>
      </div>

      <template #footer>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>

        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          Need to go back?
          <NuxtLink to="/auth/sign-in" class="font-semibold text-primary-500 underline-offset-4 hover:underline">
            Return to sign in
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
