<script setup lang="ts">
import type {
  BranchRecord,
  BranchListResponse,
  EmployeeInviteResponse,
  EmployeeRole,
} from '@gosource/api-client';
import { BrandLogo, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import InviteEmployeeForm from '~/components/onboarding/team/InviteEmployeeForm.vue';
import InviteEmployeeSuccessState from '~/components/onboarding/team/InviteEmployeeSuccessState.vue';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerEmployeeService } from '~/services/employee.service';
import { validateEmail, validateRequiredText } from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: false,
});

const route = useRoute();
const { listBranches } = useCustomerBranchService();
const { inviteEmployee } = useCustomerEmployeeService();
const session = useState('customer-session', () => null);
const isHydrated = ref(false);
const loading = ref(false);
const loadingBranches = ref(false);
const errorMessage = ref('');
const branches = ref<BranchRecord[]>([]);
const inviteResult = ref<EmployeeInviteResponse['data'] | null>(null);

const form = useState('customer-invite-draft', () => ({
  email: '',
  role: '' as EmployeeRole | '',
  branchId: '',
}));

const errors = reactive({
  email: '',
  role: '',
  branchId: '',
});

const hasSession = computed(() => Boolean((session.value as any)?.data?.businessId));
const routeStep = computed(() => String(route.query.step ?? 'invite-member'));

onMounted(() => {
  isHydrated.value = true;
});

if (routeStep.value !== 'invite-member' && routeStep.value !== 'invited') {
  await navigateTo({
    path: '/onboarding/team',
    query: {
      ...route.query,
      step: inviteResult.value ? 'invited' : 'invite-member',
    },
  }, { replace: true });
}

let hasFetchedBranches = false;

watch(
  hasSession,
  async (active) => {
    if (!active || hasFetchedBranches) {
      return;
    }

    loadingBranches.value = true;
    try {
      const response = (await listBranches()) as BranchListResponse;
      branches.value = response.data ?? [];
      hasFetchedBranches = true;

      if (!form.value.branchId && branches.value.length === 1) {
        form.value.branchId = branches.value[0]?.id ?? '';
      }
    } catch (error) {
      errorMessage.value = extractApiErrorMessage(error, 'Unable to fetch branches right now');
    } finally {
      loadingBranches.value = false;
    }
  },
  { immediate: true },
);

async function submit() {
  errors.email = validateEmail(form.value.email);
  errors.role = form.value.role ? '' : 'Role is required';
  errors.branchId = form.value.branchId ? '' : 'Branch is required';

  if (errors.email || errors.role || errors.branchId) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await inviteEmployee({
      email: form.value.email,
      role: form.value.role as EmployeeRole,
      branchId: form.value.branchId,
      callbackUrl: `${window.location.origin}/auth/invite-user`,
    });

    inviteResult.value = result.data ?? null;
    form.value = {
      email: '',
      role: '',
      branchId: branches.value.length === 1 ? (branches.value[0]?.id ?? '') : '',
    };
    toast.success(extractApiResponseMessage(result, 'Employee invitation sent successfully'));
    await navigateTo({
      path: '/onboarding/team',
      query: {
        ...route.query,
        step: 'invited',
      },
    }, { replace: true });
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to send invite right now');
  } finally {
    loading.value = false;
  }
}

function updateEmail(value: string) {
  form.value.email = value;
  errorMessage.value = '';

  if (errors.email) {
    errors.email = validateEmail(value);
  }
}

function updateRole(value: EmployeeRole) {
  form.value.role = value;
  errorMessage.value = '';

  if (errors.role) {
    errors.role = validateRequiredText(value, 'Role', 1);
  }
}

function updateBranch(value: string) {
  form.value.branchId = value;
  errorMessage.value = '';

  if (errors.branchId) {
    errors.branchId = value ? '' : 'Branch is required';
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
      title="Invite your team"
      description="Next in the GoSource customer flow: invite a team member to the branch you just created so they can set up their account."
    >
      <div
        v-if="!isHydrated"
        class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4 text-[13px] text-grey-text"
      >
        Restoring your onboarding session...
      </div>

      <template v-else-if="hasSession">
        <div
          v-if="loadingBranches"
          class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4 text-[13px] text-grey-text"
        >
          Loading branches...
        </div>

        <div
          v-else-if="!branches.length"
          class="rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-4 py-4 text-[13px] leading-6 text-grey-text"
        >
          <p class="font-semibold text-grey-900">Create a branch first</p>
          <p class="mt-1">
            We need at least one branch before a team member can be invited.
          </p>
        </div>

        <InviteEmployeeForm
          v-else-if="!inviteResult"
          :email="form.email"
          :role="form.role"
          :branch-id="form.branchId"
          :branches="branches"
          :loading="loading"
          :email-error="errors.email"
          :role-error="errors.role"
          :branch-error="errors.branchId"
          @update:email="updateEmail"
          @update:role="updateRole"
          @update:branch-id="updateBranch"
          @submit="submit"
        />

        <InviteEmployeeSuccessState
          v-else-if="inviteResult"
          :email="inviteResult.email"
          :activation-url="inviteResult.activationUrl"
        />
      </template>

      <div
        v-else
        class="rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-4 py-4 text-[13px] leading-6 text-grey-text"
      >
        <p class="font-semibold text-grey-900">Sign in or finish registration first</p>
        <p class="mt-1">
          We need an active customer session before we can send team invitations.
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
          <NuxtLink to="/onboarding/branch?step=create-branch" class="font-semibold text-primary-500 underline-offset-4 hover:underline">
            Return to branch onboarding
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
