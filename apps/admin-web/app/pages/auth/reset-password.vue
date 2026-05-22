<script setup lang="ts">
import { BrandLogo, Button, Input, OtpInput, PasswordInput, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import PasswordRulesChecklist from '~/components/auth/shared/PasswordRulesChecklist.vue';
import { useAdminOtpLength } from '~/composables/useAdminOtpLength';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { useAdminAuthService } from '~/services/auth.service';
import {
  getPasswordRuleStates,
  normalizeEmail,
  validateConfirmPassword,
  validateEmail,
  validateOtpCode,
  validatePassword,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: 'auth',
});

const { initiatePasswordReset, verifyPasswordOtp, completePasswordReset } = useAdminAuthService();
const otpLength = useAdminOtpLength();

const step = ref(1);
const loading = ref(false);
const errorMessage = ref('');
const resetCode = ref('');

const flowState = reactive({
  email: '',
});

const emailForm = reactive({
  email: '',
});

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: '',
});

const fieldErrors = reactive({
  email: '',
  resetCode: '',
  newPassword: '',
  confirmPassword: '',
});

async function submitEmail() {
  fieldErrors.email = validateEmail(emailForm.email);

  if (fieldErrors.email) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await initiatePasswordReset({
      email: normalizeEmail(emailForm.email),
    });
    flowState.email = normalizeEmail(emailForm.email);
    step.value = 2;
    toast.success(extractApiResponseMessage(result, 'If an account exists, a reset code has been sent'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to send reset code right now');
  } finally {
    loading.value = false;
  }
}

async function submitVerifyCode() {
  fieldErrors.resetCode = validateOtpCode(resetCode.value, 'Reset code', otpLength.value);

  if (fieldErrors.resetCode) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await verifyPasswordOtp({
      email: flowState.email,
      token: resetCode.value,
    });
    step.value = 3;
    toast.success(extractApiResponseMessage(result, 'Reset code verified'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to verify reset code right now');
  } finally {
    loading.value = false;
  }
}

async function submitNewPassword() {
  fieldErrors.newPassword = validatePassword(passwordForm.newPassword);
  fieldErrors.confirmPassword = validateConfirmPassword(
    passwordForm.newPassword,
    passwordForm.confirmPassword,
  );

  if (fieldErrors.newPassword || fieldErrors.confirmPassword) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await completePasswordReset({
      email: flowState.email,
      token: resetCode.value,
      password: passwordForm.newPassword,
    });
    toast.success(extractApiResponseMessage(result, 'Password updated successfully'));
    await navigateTo(ADMIN_PAGE_ROUTES.SIGN_IN);
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to reset password right now');
  } finally {
    loading.value = false;
  }
}

async function resendCode() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await initiatePasswordReset({ email: flowState.email });
    toast.success(extractApiResponseMessage(result, 'Reset code sent'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to resend reset code right now');
  } finally {
    loading.value = false;
  }
}

const title = computed(() => {
  if (step.value === 1) {
    return 'Reset your password';
  }
  if (step.value === 2) {
    return 'Verify reset code';
  }
  return 'Choose a new password';
});

const description = computed(() => {
  if (step.value === 1) {
    return `Enter your admin email and we will send a ${otpLength.value}-digit reset code.`;
  }
  if (step.value === 2) {
    return `Enter the ${otpLength.value}-digit code sent to ${flowState.email}.`;
  }
  return 'Choose a new password for your GoSource admin account.';
});

const passwordRules = computed(() => getPasswordRuleStates(passwordForm.newPassword));
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="h-9 w-[9.75rem]" />
    </template>

    <AuthCardShell badge="Password Recovery" :title="title" :description="description">
      <form v-if="step === 1" class="space-y-4" @submit.prevent="submitEmail">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Email address</span>
          <Input
            v-model="emailForm.email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.email)"
          />
          <p v-if="fieldErrors.email" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.email }}
          </p>
        </label>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Send reset code
        </Button>
      </form>

      <div v-else-if="step === 2" class="space-y-5">
        <OtpInput
          v-model="resetCode"
          :maxlength="otpLength"
          :disabled="loading"
          :invalid="Boolean(fieldErrors.resetCode)"
        />
        <p v-if="fieldErrors.resetCode" class="-mt-2 text-[12px] font-medium text-negative-500">
          {{ fieldErrors.resetCode }}
        </p>

        <Button
          size="medium"
          class="w-full"
          type="button"
          :loading="loading"
          :disabled="resetCode.length !== otpLength"
          @click="submitVerifyCode"
        >
          Verify reset code
        </Button>

        <div class="flex items-center justify-center gap-2 text-[13px] text-grey-300">
          <p>Didn’t get the code?</p>
          <button
            type="button"
            class="font-semibold text-primary-500 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-grey-400"
            :disabled="loading"
            @click="resendCode"
          >
            Resend code
          </button>
        </div>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submitNewPassword">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">New password</span>
          <PasswordInput
            v-model="passwordForm.newPassword"
            autocomplete="new-password"
            placeholder="Minimum 8 characters"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.newPassword)"
          />
          <p v-if="fieldErrors.newPassword" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.newPassword }}
          </p>
          <PasswordRulesChecklist :rules="passwordRules" />
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Confirm password</span>
          <PasswordInput
            v-model="passwordForm.confirmPassword"
            autocomplete="new-password"
            placeholder="Repeat your new password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.confirmPassword)"
          />
          <p v-if="fieldErrors.confirmPassword" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.confirmPassword }}
          </p>
        </label>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Update password
        </Button>
      </form>

      <template #footer>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>

        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          Remembered your password?
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
