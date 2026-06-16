<script setup lang="ts">
import { BrandLogo, Button, Input, PasswordInput, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { useAdminAuthService } from '~/services/auth.service';
import { useAdminSession } from '~/composables/useAdminSession';
import { normalizeEmail } from '~/utils/auth-validation';
import { sanitizeAuthRedirectPath } from '~/lib/auth-redirect';
import { extractApiErrorMessage } from '~/utils/api-error';

definePageMeta({
  layout: 'auth',
});

const route = useRoute();
const { login } = useAdminAuthService();
const { adoptSession } = useAdminSession();

const form = reactive({
  email: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');

async function submit() {
  loading.value = true;
  errorMessage.value = '';

  try {
    adoptSession(
      await login({
        email: normalizeEmail(form.email),
        password: form.password,
      }),
    );
    await navigateTo(sanitizeAuthRedirectPath(route.query.redirect, '/'));
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Unable to sign in right now');
    errorMessage.value = message;
    toast.error(message);
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
      badge="Admin Sign In"
      title="Welcome back"
      description="Sign in to manage GoSource operations from the admin workspace."
    >
      <form class="space-y-4" @submit.prevent="submit">
        <label class="block space-y-2">
          <span class="text-body-sm font-semibold text-grey-text">Email</span>
          <Input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="Enter your email"
            :disabled="loading"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-body-sm font-semibold text-grey-text">Password</span>
          <PasswordInput
            v-model="form.password"
            autocomplete="current-password"
            placeholder="Enter your password"
            :disabled="loading"
          />
        </label>

        <div class="flex justify-end">
          <NuxtLink
            :to="ADMIN_PAGE_ROUTES.RESET_PASSWORD"
            class="text-body-sm font-semibold text-primary-500 underline-offset-4 hover:underline"
          >
            Forgot password?
          </NuxtLink>
        </div>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Sign in
        </Button>
      </form>

      <template #footer>
        <p
          v-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-body-sm font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>

        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          Use an admin account issued for your workspace.
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
