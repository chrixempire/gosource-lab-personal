<script setup lang="ts">
import type { CustomerLoginPayload, CustomerMeResponse } from '@gosource/api-client';
import { BrandLogo, Button, Input, PasswordInput, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { validateEmail } from '~/utils/auth-validation';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { sanitizeAuthRedirectPath, customerDefaultAfterLogin } from '~/lib/auth-redirect';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: false,
});

const route = useRoute();
const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');
const { adoptSession } = useCustomerSession();
const { mergeGuestCartAfterLogin } = useMarketplaceCart();
const fieldErrors = reactive({
  email: '',
  password: '',
});

const { endIntentionalSignOut } = useCustomerSignOut();
onMounted(endIntentionalSignOut);

watch(
  () => route.query.email,
  (email) => {
    if (typeof email === 'string' && email.trim()) {
      form.email = email.trim();
    }
  },
  { immediate: true },
);

async function submit() {
  fieldErrors.email = validateEmail(form.email);
  fieldErrors.password = form.password.trim() ? '' : 'Password is required';

  if (fieldErrors.email || fieldErrors.password) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await $fetch<CustomerMeResponse>('/api/auth/session/login', {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password,
      } satisfies CustomerLoginPayload,
      credentials: 'same-origin',
    });
    adoptSession(result);
    toast.success(extractApiResponseMessage(result, 'Signed in'));
    await mergeGuestCartAfterLogin();
    await navigateTo(sanitizeAuthRedirectPath(route.query.redirect, customerDefaultAfterLogin()));
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Unable to sign in right now');
    errorMessage.value = message;
    toast.error(message);
  } finally {
    loading.value = false;
  }
}

function onEmailUpdate(value: string) {
  form.email = value;
  errorMessage.value = '';

  if (fieldErrors.email) {
    fieldErrors.email = validateEmail(value);
  }
}

function onPasswordUpdate(value: string) {
  form.password = value;
  errorMessage.value = '';

  if (fieldErrors.password) {
    fieldErrors.password = value.trim() ? '' : 'Password is required';
  }
}
</script>

<template>
  <AuthPageShell>
    <template #logo>
      <BrandLogo class="h-9 w-[9.75rem]" />
    </template>

    <AuthCardShell
      badge="Customer Login"
      title="Welcome back"
      description="Sign in to continue managing your business with GoSource."
    >
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Email address</span>
          <Input
            :model-value="form.email"
            type="email"
            autocomplete="email"
            placeholder="you@business.com"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.email)"
            @update:model-value="onEmailUpdate"
          />
          <p v-if="fieldErrors.email" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.email }}
          </p>
        </label>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <span class="text-[13px] font-semibold text-grey-text">Password</span>
            <NuxtLink
              to="/auth/reset-password"
              class="text-[12px] font-semibold text-primary-500 underline-offset-4 hover:underline"
            >
              Forgot password?
            </NuxtLink>
          </div>

          <PasswordInput
            :model-value="form.password"
            autocomplete="current-password"
            placeholder="Enter your password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.password)"
            @update:model-value="onPasswordUpdate"
          />
          <p v-if="fieldErrors.password" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.password }}
          </p>
        </div>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Sign in
        </Button>

        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-center text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </form>

      <template #footer>
        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          New to GoSource?
          <NuxtLink to="/auth/register" class="font-semibold text-primary-500 underline-offset-4 hover:underline">
            Create a business account
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
