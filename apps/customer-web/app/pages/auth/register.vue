<script setup lang="ts">
import type { CustomerMeResponse, SetupAccountPayload } from '@gosource/api-client';
import { BrandLogo, toast } from '@gosource/ui';
import RegisterCreateBusinessForm from '~/components/auth/register/RegisterCreateBusinessForm.vue';
import RegisterSetupAccountForm from '~/components/auth/register/RegisterSetupAccountForm.vue';
import RegisterVerifyOtpForm from '~/components/auth/register/RegisterVerifyOtpForm.vue';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { useCustomerAuthService } from '~/services/auth.service';
import {
  getPasswordRuleStates,
  validateBusinessName,
  validateEmail,
  validateOtpCode,
  validatePassword,
  validatePhoneNumber,
  validateRequiredText,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: false,
});

type SignupResponse = {
  message: string;
  data: {
    email: string;
    businessId?: string;
    onboardingStep: number;
    status?: string;
    resume?: boolean;
  };
};

const { signup, resendOtp, verifyOtp } = useCustomerAuthService();
const otpLength = useCustomerOtpLength();
const hydrated = ref(false);
const runtimeConfig = useRuntimeConfig();

const step = ref(1);
const loading = ref(false);
const errorMessage = ref('');
const otpCode = ref('');

const signupForm = reactive({
  businessName: '',
  email: '',
});

const signupErrors = reactive({
  businessName: '',
  email: '',
});

const setupForm = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  password: '',
});

const setupErrors = reactive({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  password: '',
});

const otpError = ref('');

const flowState = useState<{
  email: string;
  businessId: string | null;
  verified: boolean;
}>('customer-register-flow', () => ({
  email: '',
  businessId: null,
  verified: false,
}));
const session = useState<CustomerMeResponse | null>('customer-session', () => null);

async function submitSignup() {
  signupErrors.businessName = validateBusinessName(signupForm.businessName);
  signupErrors.email = validateEmail(signupForm.email);

  if (signupErrors.businessName || signupErrors.email) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = (await signup({
      businessName: signupForm.businessName,
      email: signupForm.email,
    })) as unknown as SignupResponse;

    flowState.value = {
      email: result.data.email,
      businessId: result.data.businessId ?? null,
      verified: result.data.onboardingStep >= 3,
    };
    step.value = result.data.onboardingStep;
    otpCode.value = '';
    toast.success(extractApiResponseMessage(result, 'Continue your registration'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to create your business account right now');
  } finally {
    loading.value = false;
  }
}

async function submitVerifyOtp() {
  otpError.value = validateOtpCode(otpCode.value, 'OTP', otpLength.value);

  if (otpError.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = (await verifyOtp({
      email: flowState.value.email,
      otp: otpCode.value,
    })) as unknown as SignupResponse;

    flowState.value.verified = true;
    step.value = 3;
    toast.success(extractApiResponseMessage(result, 'Email verified'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to verify the code right now');
  } finally {
    loading.value = false;
  }
}

async function resendVerificationCode() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = (await resendOtp(flowState.value.email)) as unknown as SignupResponse;
    toast.success(extractApiResponseMessage(result, 'Verification code sent'));
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to resend OTP right now');
  } finally {
    loading.value = false;
  }
}

async function submitSetupAccount() {
  setupErrors.firstName = validateRequiredText(setupForm.firstName, 'First name');
  setupErrors.lastName = validateRequiredText(setupForm.lastName, 'Last name');
  setupErrors.phoneNumber = validatePhoneNumber(setupForm.phoneNumber);
  setupErrors.password = validatePassword(setupForm.password);

  if (setupErrors.firstName || setupErrors.lastName || setupErrors.phoneNumber || setupErrors.password) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await $fetch<CustomerMeResponse>('/api/auth/session/setup-account', {
      method: 'PATCH',
      body: {
        email: flowState.value.email,
        firstName: setupForm.firstName,
        lastName: setupForm.lastName,
        phoneNumber: setupForm.phoneNumber,
        password: setupForm.password,
      } satisfies SetupAccountPayload,
      credentials: 'same-origin',
    });
    flowState.value = {
      email: '',
      businessId: null,
      verified: false,
    };
    toast.success(extractApiResponseMessage(result, 'Account setup complete'));

    if (runtimeConfig.public.customerApiMode === 'legacy') {
      session.value = null;
      await navigateTo({
        path: '/auth/sign-in',
        query: {
      email: result.data?.email || flowState.value.email || signupForm.email || '',
        },
      });
      return;
    }

    session.value = result;
    await navigateTo('/market');
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Unable to complete account setup right now');
    errorMessage.value = message;
    toast.error(message);
  } finally {
    loading.value = false;
  }
}

const stepTitle = computed(() => {
  if (step.value === 1) return 'Create a business account';
  if (step.value === 2) return 'Verify your email';
  return 'Set up your account';
});

const stepDescription = computed(() => {
  if (step.value === 1) {
    return 'Start your GoSource onboarding by creating your business account to continue with OTP verification and setup.';
  }
  if (step.value === 2) {
    return `Enter the ${otpLength.value}-digit code sent to ${flowState.value.email}. You can paste the full code in one action.`;
  }
  if (step.value === 3) {
    return 'Complete your profile details to continue to your GoSource marketplace workspace.';
  }
  return '';
});

const passwordRules = computed(() => getPasswordRuleStates(setupForm.password));

const signInTo = computed(() => {
  if (!hydrated.value) {
    return '/auth/sign-in';
  }

  const email = (flowState.value.email || signupForm.email).trim();
  if (email) {
    return { path: '/auth/sign-in', query: { email } };
  }
  return '/auth/sign-in';
});

onMounted(() => {
  hydrated.value = true;
});

function onBusinessNameUpdate(value: string) {
  signupForm.businessName = value;
  errorMessage.value = '';

  if (signupErrors.businessName) {
    signupErrors.businessName = validateBusinessName(value);
  }
}

function onSignupEmailUpdate(value: string) {
  signupForm.email = value;
  errorMessage.value = '';

  if (signupErrors.email) {
    signupErrors.email = validateEmail(value);
  }
}

function onOtpUpdate(value: string) {
  otpCode.value = value;
  errorMessage.value = '';

  if (otpError.value) {
    otpError.value = validateOtpCode(value, 'OTP', otpLength.value);
  }
}

function onSetupFieldUpdate(field: 'firstName' | 'lastName' | 'phoneNumber' | 'password', value: string) {
  setupForm[field] = value;
  errorMessage.value = '';

  if (field === 'firstName' && setupErrors.firstName) {
    setupErrors.firstName = validateRequiredText(value, 'First name');
  }

  if (field === 'lastName' && setupErrors.lastName) {
    setupErrors.lastName = validateRequiredText(value, 'Last name');
  }

  if (field === 'phoneNumber' && setupErrors.phoneNumber) {
    setupErrors.phoneNumber = validatePhoneNumber(value);
  }

  if (field === 'password' && setupErrors.password) {
    setupErrors.password = validatePassword(value);
  }
}
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="w-36" />
    </template>

    <AuthCardShell
      :badge="`Step ${step <= 3 ? step : 3} of 3`"
      :title="stepTitle"
      :description="stepDescription"
    >
      <RegisterCreateBusinessForm
        v-if="step === 1"
        :business-name="signupForm.businessName"
        :email="signupForm.email"
        :loading="loading"
        :business-name-error="signupErrors.businessName"
        :email-error="signupErrors.email"
        @update:business-name="onBusinessNameUpdate"
        @update:email="onSignupEmailUpdate"
        @submit="submitSignup"
      />

      <RegisterVerifyOtpForm
        v-else-if="step === 2"
        :otp-code="otpCode"
        :otp-length="otpLength"
        :loading="loading"
        :otp-error="otpError"
        @update:otp-code="onOtpUpdate"
        @verify="submitVerifyOtp"
        @resend="resendVerificationCode"
      />

      <RegisterSetupAccountForm
        v-else-if="step === 3"
        :first-name="setupForm.firstName"
        :last-name="setupForm.lastName"
        :show-role-field="false"
        :phone-number="setupForm.phoneNumber"
        :password="setupForm.password"
        :loading="loading"
        :first-name-error="setupErrors.firstName"
        :last-name-error="setupErrors.lastName"
        :phone-number-error="setupErrors.phoneNumber"
        :password-error="setupErrors.password"
        :password-rules="passwordRules"
        @update:first-name="onSetupFieldUpdate('firstName', $event)"
        @update:last-name="onSetupFieldUpdate('lastName', $event)"
        @update:phone-number="onSetupFieldUpdate('phoneNumber', $event)"
        @update:password="onSetupFieldUpdate('password', $event)"
        @submit="submitSetupAccount"
      />

      <template #footer>
        <p class="text-center text-[11px] leading-5 text-grey-300">
          Already have an account?
          <NuxtLink :to="signInTo" class="font-semibold text-primary-500 underline-offset-4 hover:underline">
            Sign in
          </NuxtLink>
        </p>

        <p class="mt-3 text-center text-[11px] leading-5 text-grey-300">
          By creating an account, you agree to the GoSource terms and privacy policy.
        </p>

        <p
          v-if="errorMessage"
          class="mt-4 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
