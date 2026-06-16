<script setup lang="ts">
import type {
  CustomerMeResponse,
  EmployeeInvitationResponse,
  SetupEmployeeAccountPayload,
} from '@gosource/api-client';
import { BrandLogo, toast } from '@gosource/ui';
import RegisterSetupAccountForm from '~/components/auth/register/RegisterSetupAccountForm.vue';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { useCustomerEmployeeService } from '~/services/employee.service';
import {
  getPasswordRuleStates,
  validatePassword,
  validatePhoneNumber,
  validateRequiredText,
} from '~/utils/auth-validation';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: false,
});

const INVITE_STORAGE_KEY = 'gosource:customer:invite-session';
const INVITE_STORAGE_TTL_MS = 30 * 60 * 1000;

type StoredInviteSession = {
  invitationId: string;
  token: string;
  savedAt: number;
};

const route = useRoute();
const router = useRouter();
const { getInvitationDetails } = useCustomerEmployeeService();

const token = ref('');
const invitationId = ref('');

const loadingInvitation = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const inviteData = ref<EmployeeInvitationResponse['data'] | null>(null);
const { clearSession } = useCustomerSession();

const form = reactive({
  firstName: '',
  lastName: '',
  position: '',
  phoneNumber: '',
  password: '',
});

const fieldErrors = reactive({
  firstName: '',
  lastName: '',
  position: '',
  phoneNumber: '',
  password: '',
});

const passwordRules = computed(() => getPasswordRuleStates(form.password));
const hasInviteParams = computed(() => Boolean(token.value && invitationId.value));
const cardDescription = computed(() => {
  if (!inviteData.value) {
    return 'Use your invitation link to complete your team account setup.';
  }

  return `Complete your account to join ${inviteData.value.businessName ?? 'this business'}${
    inviteData.value.branchName ? ` in ${inviteData.value.branchName}` : ''
  }.`;
});

function readStoredInviteSession(): StoredInviteSession | null {
  if (!import.meta.client) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(INVITE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredInviteSession;
    if (!parsed?.token || !parsed?.invitationId || typeof parsed.savedAt !== 'number') {
      sessionStorage.removeItem(INVITE_STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.savedAt > INVITE_STORAGE_TTL_MS) {
      sessionStorage.removeItem(INVITE_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(INVITE_STORAGE_KEY);
    return null;
  }
}

function persistInviteSession(nextToken: string, nextInvitationId: string) {
  if (!import.meta.client) {
    return;
  }

  sessionStorage.setItem(
    INVITE_STORAGE_KEY,
    JSON.stringify({
      token: nextToken,
      invitationId: nextInvitationId,
      savedAt: Date.now(),
    } satisfies StoredInviteSession),
  );
}

function clearStoredInviteSession() {
  if (import.meta.client) {
    sessionStorage.removeItem(INVITE_STORAGE_KEY);
  }
}

async function initializeInviteSession() {
  const queryToken = String(route.query.token ?? '').trim();
  const queryInvitationId = String(route.query.invitationId ?? '').trim();

  if (queryToken && queryInvitationId) {
    token.value = queryToken;
    invitationId.value = queryInvitationId;
    persistInviteSession(queryToken, queryInvitationId);

    const nextQuery = { ...route.query };
    delete nextQuery.token;
    delete nextQuery.invitationId;

    await router.replace({
      path: route.path,
      query: nextQuery,
    });
    return;
  }

  const stored = readStoredInviteSession();
  if (stored) {
    token.value = stored.token;
    invitationId.value = stored.invitationId;
  }
}

onMounted(async () => {
  await initializeInviteSession();

  if (!hasInviteParams.value) {
    clearStoredInviteSession();
    loadingInvitation.value = false;
    errorMessage.value = 'This invitation link is incomplete or invalid.';
    return;
  }

  try {
    const result = await getInvitationDetails(invitationId.value, token.value);
    inviteData.value = result.data ?? null;
  } catch (error) {
    clearStoredInviteSession();
    errorMessage.value = extractApiErrorMessage(error, 'Unable to load invitation details right now');
  } finally {
    loadingInvitation.value = false;
  }
});

async function submit() {
  fieldErrors.firstName = validateRequiredText(form.firstName, 'First name');
  fieldErrors.lastName = validateRequiredText(form.lastName, 'Last name');
  fieldErrors.position = form.position.trim()
    ? validateRequiredText(form.position, 'Position')
    : '';
  fieldErrors.phoneNumber = validatePhoneNumber(form.phoneNumber);
  fieldErrors.password = validatePassword(form.password);

  if (
    fieldErrors.firstName ||
    fieldErrors.lastName ||
    fieldErrors.position ||
    fieldErrors.phoneNumber ||
    fieldErrors.password
  ) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await $fetch<CustomerMeResponse>('/api/auth/session/employee-setup', {
      method: 'POST',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position,
        phoneNumber: form.phoneNumber,
        password: form.password,
      } satisfies SetupEmployeeAccountPayload,
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      credentials: 'same-origin',
    });

    toast.success(extractApiResponseMessage(result, 'Employee account set up successfully'));
    clearStoredInviteSession();
    clearSession();
    const nextEmail = inviteData.value?.email ?? '';
    await navigateTo({
      path: '/auth/sign-in',
      query: nextEmail ? { email: nextEmail } : undefined,
    });
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Unable to complete account setup right now');
    errorMessage.value = message;
    toast.error(message);
  } finally {
    loading.value = false;
  }
}

function updateField(
  field: 'firstName' | 'lastName' | 'position' | 'phoneNumber' | 'password',
  value: string,
) {
  form[field] = value;
  errorMessage.value = '';

  if (field === 'firstName' && fieldErrors.firstName) {
    fieldErrors.firstName = validateRequiredText(value, 'First name');
  }

  if (field === 'lastName' && fieldErrors.lastName) {
    fieldErrors.lastName = validateRequiredText(value, 'Last name');
  }

  if (field === 'position' && fieldErrors.position) {
    fieldErrors.position = value.trim()
      ? validateRequiredText(value, 'Position')
      : '';
  }

  if (field === 'phoneNumber' && fieldErrors.phoneNumber) {
    fieldErrors.phoneNumber = validatePhoneNumber(value);
  }

  if (field === 'password' && fieldErrors.password) {
    fieldErrors.password = validatePassword(value);
  }
}
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="w-36" />
    </template>

    <AuthCardShell
      badge="Team Invitation"
      title="Join your GoSource team"
      :description="cardDescription"
    >
      <div
        v-if="loadingInvitation"
        class="rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4 text-[13px] text-grey-text"
      >
        Loading your invitation...
      </div>

      <template v-else-if="inviteData">
        <div class="mb-4 rounded-[18px] border border-grey-50 bg-grey-55 px-4 py-4 text-[13px] leading-6 text-grey-text">
          <p class="font-semibold text-grey-900">{{ inviteData.email }}</p>
          <p class="mt-1">
            Invited as
            <span class="font-semibold capitalize text-grey-900">{{ inviteData.role }}</span>
            <template v-if="inviteData.branchName">
              for {{ inviteData.branchName }}
            </template>
          </p>
        </div>

        <RegisterSetupAccountForm
          :first-name="form.firstName"
          :last-name="form.lastName"
          :role="form.position"
          :show-role-field="true"
          role-label="What’s your position?"
          role-placeholder="Chef"
          :phone-number="form.phoneNumber"
          :password="form.password"
          :loading="loading"
          :first-name-error="fieldErrors.firstName"
          :last-name-error="fieldErrors.lastName"
          :role-error="fieldErrors.position"
          :phone-number-error="fieldErrors.phoneNumber"
          :password-error="fieldErrors.password"
          :password-rules="passwordRules"
          @update:first-name="updateField('firstName', $event)"
          @update:last-name="updateField('lastName', $event)"
          @update:role="updateField('position', $event)"
          @update:phone-number="updateField('phoneNumber', $event)"
          @update:password="updateField('password', $event)"
          @submit="submit"
        />
      </template>

      <div
        v-else
        class="rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-4 py-4 text-[13px] leading-6 text-grey-text"
      >
        <p class="font-semibold text-grey-900">This invite is unavailable</p>
        <p class="mt-1">
          The invitation may have expired, been used already, or the link is incomplete.
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
          Need help with this invite?
          <NuxtLink to="/auth/sign-in" class="font-semibold text-primary-500 underline-offset-4 hover:underline">
            Return to sign in
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
