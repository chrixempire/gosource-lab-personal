<script setup lang="ts">
import { Button, PasswordInput, Switch } from '@gosource/ui';
import SettingsTwoColumnSkeleton from '~/components/settings/skeletons/SettingsTwoColumnSkeleton.vue';

defineProps<{
  loading?: boolean;
}>();
import { useSettingsMutations } from '~/composables/useSettingsMutations';

const { busyKey, changePassword } = useSettingsMutations();

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
});

const fieldErrors = reactive<Record<string, string>>({});
const dirty = ref(false);

function markDirty() {
  dirty.value = true;
}

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  if (!passwordForm.oldPassword) fieldErrors.oldPassword = 'Current password is required';
  if (!passwordForm.newPassword) fieldErrors.newPassword = 'New password is required';
  else if (passwordForm.newPassword.length < 6) {
    fieldErrors.newPassword = 'Password must be at least 6 characters';
  }
  return Object.keys(fieldErrors).length === 0;
}

async function onSubmit() {
  if (!validate()) return;
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    dirty.value = false;
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <SettingsTwoColumnSkeleton v-if="loading" :main-field-count="2" :sidebar-rows="1" />

  <div v-else class="flex w-full flex-col gap-6 lg:flex-row">
    <section
      class="w-full max-w-sm shrink-0 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Two Factor authentication (2FA)</h2>
      <div class="mt-5">
        <p class="text-xs text-grey-500">Enable Two factor authentication</p>
        <Switch
          class="mt-2"
          :model-value="false"
          disabled
          aria-label="Enable two factor authentication"
        />
      </div>
    </section>

    <div class="flex min-w-0 flex-1 flex-col gap-5">
      <section
        class="w-full rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
      >
        <h2 class="text-base font-semibold text-grey-900">Change password</h2>
        <form class="mt-5 max-w-xl space-y-4" @submit.prevent="onSubmit">
          <PasswordInput
            v-model="passwordForm.oldPassword"
            label="Enter your password"
            autocomplete="current-password"
            :invalid="Boolean(fieldErrors.oldPassword)"
            @update:model-value="markDirty"
          />
          <p v-if="fieldErrors.oldPassword" class="-mt-2 text-xs text-negative-500">
            {{ fieldErrors.oldPassword }}
          </p>

          <PasswordInput
            v-model="passwordForm.newPassword"
            label="Enter new password"
            autocomplete="new-password"
            :invalid="Boolean(fieldErrors.newPassword)"
            @update:model-value="markDirty"
          />
          <p v-if="fieldErrors.newPassword" class="-mt-2 text-xs text-negative-500">
            {{ fieldErrors.newPassword }}
          </p>

          <Button
            type="submit"
            size="small"
            class="!w-fit"
            :loading="busyKey === 'password'"
            :disabled="!dirty"
          >
            Save changes
          </Button>
        </form>
      </section>
    </div>
  </div>
</template>
