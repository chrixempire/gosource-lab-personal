<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
import { Button, Input, OtpInput, PasswordInput, toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import PasswordRulesChecklist from '~/components/auth/shared/PasswordRulesChecklist.vue';
import { useCustomerProfileService } from '~/services/profile.service';
import {
  getPasswordRuleStates,
  normalizeEmail,
  validateConfirmPassword,
  validateEmail,
  validateOtpCode,
  validatePassword,
  validateRequiredText,
} from '~/utils/auth-validation';
import { extractApiResponseMessage } from '~/utils/api-error';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const { changePassword, sendEmailOtp, verifyEmailOtp } = useCustomerProfileService();
const otpLength = useCustomerOtpLength();

const isOwner = computed(() => isBusinessOwnerSession(session.value));

const currentEmail = computed(() => {
  const data = session.value?.data;
  if (!data || typeof data !== 'object' || !('email' in data)) {
    return '';
  }
  return String(data.email ?? '').trim();
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordSaving = ref(false);
const passwordRules = computed(() => getPasswordRuleStates(passwordForm.newPassword));

const emailForm = reactive({
  newEmail: '',
  otp: '',
});

const emailErrors = reactive({
  newEmail: '',
  otp: '',
});

const emailStep = ref<'idle' | 'otp-sent'>('idle');
const emailSaving = ref(false);

function validatePasswordForm() {
  passwordErrors.oldPassword = validateRequiredText(
    passwordForm.oldPassword,
    'Current password',
    1,
  );
  passwordErrors.newPassword = validatePassword(passwordForm.newPassword);
  passwordErrors.confirmPassword = validateConfirmPassword(
    passwordForm.newPassword,
    passwordForm.confirmPassword,
  );

  return (
    !passwordErrors.oldPassword &&
    !passwordErrors.newPassword &&
    !passwordErrors.confirmPassword
  );
}

async function submitPasswordChange() {
  if (!isOwner.value || passwordSaving.value || !validatePasswordForm()) {
    return;
  }

  passwordSaving.value = true;
  try {
    // Legacy API expects confirmPassword to match oldPassword (gosource-api parity).
    const response = await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.oldPassword,
    });

    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    toast.success(extractApiResponseMessage(response, 'Password changed successfully'));
  } finally {
    passwordSaving.value = false;
  }
}

function validateEmailForm(forOtp: boolean) {
  emailErrors.newEmail = validateEmail(emailForm.newEmail);
  emailErrors.otp = forOtp
    ? validateOtpCode(emailForm.otp, 'Verification code', otpLength.value)
    : '';

  if (
    emailErrors.newEmail ||
    (forOtp && emailErrors.otp) ||
    normalizeEmail(emailForm.newEmail) === normalizeEmail(currentEmail.value)
  ) {
    if (
      !emailErrors.newEmail &&
      normalizeEmail(emailForm.newEmail) === normalizeEmail(currentEmail.value)
    ) {
      emailErrors.newEmail = 'Enter a different email address';
    }
    return false;
  }

  return true;
}

async function sendEmailVerification() {
  if (!isOwner.value || emailSaving.value || !validateEmailForm(false)) {
    return;
  }

  emailSaving.value = true;
  try {
    const response = await sendEmailOtp(normalizeEmail(emailForm.newEmail));
    emailStep.value = 'otp-sent';
    toast.success(extractApiResponseMessage(response, 'Verification code sent'));
  } finally {
    emailSaving.value = false;
  }
}

async function confirmEmailChange() {
  if (!isOwner.value || emailSaving.value || !validateEmailForm(true)) {
    return;
  }

  emailSaving.value = true;
  try {
    const response = await verifyEmailOtp(
      normalizeEmail(emailForm.newEmail),
      emailForm.otp.trim(),
    );

    const refreshed = await $fetch<CustomerMeResponse>('/api/auth/session/me', {
      credentials: 'same-origin',
    });
    session.value = refreshed;

    emailForm.newEmail = '';
    emailForm.otp = '';
    emailStep.value = 'idle';
    toast.success(extractApiResponseMessage(response, 'Email updated successfully'));
  } finally {
    emailSaving.value = false;
  }
}
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-8">
    <section class="rounded-[24px] border border-grey-50 bg-white p-6">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-grey-900">Change your password</h2>
        <p class="text-sm text-grey-300">
          {{
            isOwner
              ? 'Update the password you use to sign in.'
              : 'Password changes for team accounts are handled by your administrator or reset flow.'
          }}
        </p>
      </div>

      <div v-if="!isOwner" class="mt-5">
        <NuxtLink
          to="/auth/reset-password"
          class="text-sm font-semibold text-primary-500 no-underline hover:underline"
        >
          Reset your password
        </NuxtLink>
      </div>

      <form v-else class="mt-5 space-y-4" @submit.prevent="submitPasswordChange">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Current password</span>
          <PasswordInput
            v-model="passwordForm.oldPassword"
            autocomplete="current-password"
            :disabled="passwordSaving"
            :invalid="Boolean(passwordErrors.oldPassword)"
            @update:model-value="passwordErrors.oldPassword = ''"
          />
          <p v-if="passwordErrors.oldPassword" class="text-[12px] font-medium text-negative-500">
            {{ passwordErrors.oldPassword }}
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">New password</span>
          <PasswordInput
            v-model="passwordForm.newPassword"
            autocomplete="new-password"
            :disabled="passwordSaving"
            :invalid="Boolean(passwordErrors.newPassword)"
            @update:model-value="passwordErrors.newPassword = ''"
          />
          <p v-if="passwordErrors.newPassword" class="text-[12px] font-medium text-negative-500">
            {{ passwordErrors.newPassword }}
          </p>
          <PasswordRulesChecklist :rules="passwordRules" />
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Confirm new password</span>
          <PasswordInput
            v-model="passwordForm.confirmPassword"
            autocomplete="new-password"
            :disabled="passwordSaving"
            :invalid="Boolean(passwordErrors.confirmPassword)"
            @update:model-value="passwordErrors.confirmPassword = ''"
          />
          <p
            v-if="passwordErrors.confirmPassword"
            class="text-[12px] font-medium text-negative-500"
          >
            {{ passwordErrors.confirmPassword }}
          </p>
        </label>

        <div class="flex justify-end pt-2">
          <Button type="submit" :loading="passwordSaving" class="!w-auto min-w-[140px]">
            Update password
          </Button>
        </div>
      </form>
    </section>

    <section class="rounded-[24px] border border-grey-50 bg-white p-6">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-grey-900">Change your email</h2>
        <p class="text-sm text-grey-300">
          {{
            isOwner
              ? 'We will send a verification code to your new address.'
              : 'Your work email is managed by your business administrator.'
          }}
        </p>
      </div>

      <div class="mt-5 space-y-4">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Current email</span>
          <Input :model-value="currentEmail" type="email" disabled class="opacity-90" />
        </label>

        <template v-if="isOwner">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">New email address</span>
            <Input
              v-model="emailForm.newEmail"
              type="email"
              autocomplete="email"
              :disabled="emailSaving"
              :invalid="Boolean(emailErrors.newEmail)"
              @update:model-value="emailErrors.newEmail = ''"
            />
            <p v-if="emailErrors.newEmail" class="text-[12px] font-medium text-negative-500">
              {{ emailErrors.newEmail }}
            </p>
          </label>

          <div v-if="emailStep === 'otp-sent'" class="space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Verification code</span>
            <OtpInput
              :model-value="emailForm.otp"
              :maxlength="otpLength"
              align="left"
              :disabled="emailSaving"
              :invalid="Boolean(emailErrors.otp)"
              @update:model-value="
                (value) => {
                  emailForm.otp = value ?? '';
                  emailErrors.otp = '';
                }
              "
            />
            <p v-if="emailErrors.otp" class="text-[12px] font-medium text-negative-500">
              {{ emailErrors.otp }}
            </p>
          </div>

          <div class="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              v-if="emailStep !== 'otp-sent'"
              type="button"
              variant="neutral"
              size="small"
              class="!w-auto"
              :loading="emailSaving"
              @click="sendEmailVerification"
            >
              Send code
            </Button>
            <template v-else>
              <Button
                type="button"
                variant="neutral"
                size="small"
                class="!w-auto"
                :disabled="emailSaving"
                @click="emailStep = 'idle'"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="small"
                class="!w-auto"
                :loading="emailSaving"
                :disabled="emailForm.otp.length !== otpLength"
                @click="confirmEmailChange"
              >
                Verify email
              </Button>
            </template>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
