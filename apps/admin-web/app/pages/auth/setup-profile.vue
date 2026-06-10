<script setup lang="ts">
import { BrandLogo, Button, PasswordInput, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import PasswordRulesChecklist from '~/components/auth/shared/PasswordRulesChecklist.vue';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { useAdminAuthService } from '~/services/auth.service';
import {
  getPasswordRuleStates,
  validateConfirmPassword,
  validatePassword,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: 'auth',
});

const INVITE_STORAGE_KEY = 'gosource:admin:invite-token';
const INVITE_STORAGE_TTL_MS = 60 * 60 * 1000;

const route = useRoute();
const { completeAdminSignup } = useAdminAuthService();

const inviteToken = ref('');
const loading = ref(false);
const errorMessage = ref('');

const passwordForm = reactive({
  password: '',
  confirmPassword: '',
});

const fieldErrors = reactive({
  password: '',
  confirmPassword: '',
});

const passwordRules = computed(() => getPasswordRuleStates(passwordForm.password));

const hasInviteToken = computed(() => Boolean(inviteToken.value.trim()));

function readStoredToken(): string | null {
  if (!import.meta.client) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(INVITE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { token?: string; savedAt?: number };
    if (!parsed.token || !parsed.savedAt) {
      return null;
    }

    if (Date.now() - parsed.savedAt > INVITE_STORAGE_TTL_MS) {
      sessionStorage.removeItem(INVITE_STORAGE_KEY);
      return null;
    }

    return parsed.token;
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  if (!import.meta.client) {
    return;
  }

  sessionStorage.setItem(
    INVITE_STORAGE_KEY,
    JSON.stringify({
      token,
      savedAt: Date.now(),
    }),
  );
}

function clearStoredToken() {
  if (!import.meta.client) {
    return;
  }

  sessionStorage.removeItem(INVITE_STORAGE_KEY);
}

function resolveInviteToken() {
  const queryToken = typeof route.query.token === 'string' ? route.query.token.trim() : '';

  if (queryToken) {
    inviteToken.value = queryToken;
    storeToken(queryToken);
    return;
  }

  const stored = readStoredToken();
  if (stored) {
    inviteToken.value = stored;
  }
}

onMounted(() => {
  resolveInviteToken();
});

watch(
  () => route.query.token,
  () => {
    resolveInviteToken();
  },
);

async function submit() {
  if (!hasInviteToken.value) {
    errorMessage.value = 'Your invitation link is missing or expired. Request a new invite from your administrator.';
    return;
  }

  fieldErrors.password = validatePassword(passwordForm.password);
  fieldErrors.confirmPassword = validateConfirmPassword(
    passwordForm.password,
    passwordForm.confirmPassword,
  );

  if (fieldErrors.password || fieldErrors.confirmPassword) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await completeAdminSignup(
      { password: passwordForm.password },
      inviteToken.value,
    );
    clearStoredToken();
    toast.success(extractApiResponseMessage(result, 'Account setup complete'));
    await navigateTo(ADMIN_PAGE_ROUTES.SIGN_IN);
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to complete account setup right now');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="h-9 w-[9.75rem]" />
    </template>

    <AuthCardShell
      badge="Account Setup"
      title="Set your password"
      description="Complete your GoSource admin account using the link from your invitation email."
    >
      <form v-if="hasInviteToken" class="space-y-4" @submit.prevent="submit">
        <label class="block space-y-2">
          <span class="text-body-sm font-semibold text-grey-text">Password</span>
          <PasswordInput
            v-model="passwordForm.password"
            autocomplete="new-password"
            placeholder="Create a strong password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.password)"
          />
          <p v-if="fieldErrors.password" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.password }}
          </p>
          <PasswordRulesChecklist :rules="passwordRules" />
        </label>

        <label class="block space-y-2">
          <span class="text-body-sm font-semibold text-grey-text">Confirm password</span>
          <PasswordInput
            v-model="passwordForm.confirmPassword"
            autocomplete="new-password"
            placeholder="Repeat your password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.confirmPassword)"
          />
          <p v-if="fieldErrors.confirmPassword" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.confirmPassword }}
          </p>
        </label>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Complete setup
        </Button>
      </form>

      <p
        v-else
        class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-body-sm font-medium text-negative-500"
      >
        This setup link is invalid or has expired. Open the invitation email again or ask an administrator to resend your invite.
      </p>

      <template #footer>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-body-sm font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>

        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          Already set up?
          <NuxtLink
            :to="ADMIN_PAGE_ROUTES.SIGN_IN"
            class="font-semibold text-primary-500 underline-offset-4 hover:underline"
          >
            Sign in
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
