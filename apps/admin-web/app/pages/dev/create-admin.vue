<script setup lang="ts">
import { BrandLogo, Button, Input, PasswordInput, toast } from '@gosource/ui';
import AuthCardShell from '~/components/auth/shared/AuthCardShell.vue';
import AuthPageShell from '~/components/auth/shared/AuthPageShell.vue';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  normalizeEmail,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequiredText,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

definePageMeta({
  layout: 'auth',
});

if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not found',
  });
}

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  firstName: 'GoSource',
  lastName: 'Admin',
  email: '',
  password: '',
  confirmPassword: '',
  roleName: 'super_admin',
  bootstrapSecret: '',
});

const fieldErrors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  bootstrapSecret: '',
});

async function submit() {
  fieldErrors.firstName = validateRequiredText(form.firstName, 'First name');
  fieldErrors.lastName = validateRequiredText(form.lastName, 'Last name');
  fieldErrors.email = validateEmail(form.email);
  fieldErrors.password = validatePassword(form.password);
  fieldErrors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword);
  fieldErrors.bootstrapSecret = validateRequiredText(form.bootstrapSecret, 'Bootstrap secret');

  if (
    fieldErrors.firstName ||
    fieldErrors.lastName ||
    fieldErrors.email ||
    fieldErrors.password ||
    fieldErrors.confirmPassword ||
    fieldErrors.bootstrapSecret
  ) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const result = await $fetch<{ message?: string; data?: { email?: string } }>(
      '/api/dev/bootstrap-admin',
      {
        method: 'POST',
        headers: {
          'x-dev-bootstrap-secret': form.bootstrapSecret.trim(),
        },
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: normalizeEmail(form.email),
          password: form.password,
          roleName: form.roleName.trim() || 'super_admin',
        },
      },
    );

    successMessage.value = extractApiResponseMessage(
      result,
      `Created ${result.data?.email ?? 'admin'}. You can sign in now.`,
    );
    toast.success(successMessage.value);
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to create admin account');
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
      badge="Dev only — delete before production"
      title="Create local admin"
      description="Writes directly to the legacy-api MongoDB (adminusers + roles). Use only when you have no super admin yet. Remove this page before shipping."
    >
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">First name</span>
            <Input v-model="form.firstName" :disabled="loading" :invalid="Boolean(fieldErrors.firstName)" />
            <p v-if="fieldErrors.firstName" class="text-[12px] font-medium text-negative-500">
              {{ fieldErrors.firstName }}
            </p>
          </label>

          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Last name</span>
            <Input v-model="form.lastName" :disabled="loading" :invalid="Boolean(fieldErrors.lastName)" />
            <p v-if="fieldErrors.lastName" class="text-[12px] font-medium text-negative-500">
              {{ fieldErrors.lastName }}
            </p>
          </label>
        </div>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Email</span>
          <Input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="admin@gosource.dev"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.email)"
          />
          <p v-if="fieldErrors.email" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.email }}
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Role name</span>
          <Input
            v-model="form.roleName"
            placeholder="super_admin"
            :disabled="loading"
          />
          <p class="text-[12px] text-grey-300">
            Creates the role in Mongo if missing (default: super_admin).
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Password</span>
          <PasswordInput
            v-model="form.password"
            autocomplete="new-password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.password)"
          />
          <p v-if="fieldErrors.password" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.password }}
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Confirm password</span>
          <PasswordInput
            v-model="form.confirmPassword"
            autocomplete="new-password"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.confirmPassword)"
          />
          <p v-if="fieldErrors.confirmPassword" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.confirmPassword }}
          </p>
        </label>

        <label class="block space-y-2">
          <span class="text-[13px] font-semibold text-grey-text">Bootstrap secret</span>
          <Input
            v-model="form.bootstrapSecret"
            type="password"
            autocomplete="off"
            placeholder="NUXT_DEV_ADMIN_BOOTSTRAP_SECRET"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.bootstrapSecret)"
          />
          <p v-if="fieldErrors.bootstrapSecret" class="text-[12px] font-medium text-negative-500">
            {{ fieldErrors.bootstrapSecret }}
          </p>
        </label>

        <Button size="medium" class="w-full" type="submit" :loading="loading">
          Create admin account
        </Button>
      </form>

      <template #footer>
        <p
          v-if="successMessage"
          class="rounded-[18px] border border-primary-100 bg-primary-50 px-4 py-3 text-[13px] font-medium text-primary-700"
        >
          {{ successMessage }}
          <NuxtLink
            :to="ADMIN_PAGE_ROUTES.SIGN_IN"
            class="mt-1 block font-semibold underline-offset-4 hover:underline"
          >
            Go to sign in
          </NuxtLink>
        </p>

        <p
          v-if="errorMessage"
          class="mt-3 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>

        <p class="mt-4 text-center text-[11px] leading-5 text-grey-300">
          Production flow: super admin calls
          <code class="text-[10px]">POST /v2/admin/auth/register</code>
          with
          <code class="text-[10px]">callbackUrl</code>
          → invite email →
          <NuxtLink :to="ADMIN_PAGE_ROUTES.SETUP_PROFILE" class="font-semibold text-primary-500">
            setup-profile
          </NuxtLink>
        </p>
      </template>
    </AuthCardShell>
  </AuthPageShell>
</template>
