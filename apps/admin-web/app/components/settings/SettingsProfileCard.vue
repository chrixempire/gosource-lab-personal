<script setup lang="ts">
import { Avatar, Button, Input } from '@gosource/ui';
import SettingsTwoColumnSkeleton from '~/components/settings/skeletons/SettingsTwoColumnSkeleton.vue';
import { useAdminSession } from '~/composables/useAdminSession';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import { formatSettingsRoleLabel } from '~/lib/settings-api';
import type { SettingsProfileFormValues } from '~/types/settings';

defineProps<{
  loading?: boolean;
}>();

const { session } = useAdminSession();
const { busyKey, updateProfile } = useSettingsMutations();

const form = reactive<SettingsProfileFormValues>({
  firstName: '',
  lastName: '',
  phoneNumber: '',
});

const fieldErrors = reactive<Record<string, string>>({});
const dirty = ref(false);

const initials = computed(() => {
  const first = form.firstName?.[0] ?? '';
  const last = form.lastName?.[0] ?? '';
  return (first + last).toUpperCase() || 'GA';
});

const fullName = computed(() => [form.firstName, form.lastName].filter(Boolean).join(' ').trim());

watch(
  () => session.value?.data,
  (data) => {
    if (!data || dirty.value) return;
    form.firstName = String(data.firstName ?? '');
    form.lastName = String(data.lastName ?? '');
    form.phoneNumber = String(data.phoneNumber ?? '');
  },
  { immediate: true },
);

function markDirty() {
  dirty.value = true;
}

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  if (!form.firstName.trim()) fieldErrors.firstName = 'First name is required';
  if (!form.lastName.trim()) fieldErrors.lastName = 'Last name is required';
  return Object.keys(fieldErrors).length === 0;
}

async function onSave() {
  if (!validate()) return;
  try {
    const updated = await updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    });
    dirty.value = false;
    if (updated?.data) {
      session.value = updated;
      form.firstName = String(updated.data.firstName ?? '');
      form.lastName = String(updated.data.lastName ?? '');
      form.phoneNumber = String(updated.data.phoneNumber ?? '');
      return;
    }

    if (session.value?.data) {
      session.value.data.firstName = form.firstName.trim();
      session.value.data.lastName = form.lastName.trim();
      session.value.data.phoneNumber = form.phoneNumber.trim();
    }
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <SettingsTwoColumnSkeleton v-if="loading" :main-field-count="5" :sidebar-rows="2" />

  <div v-else class="flex flex-col gap-6 lg:flex-row">
    <section
      class="w-full max-w-sm rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Profile picture</h2>
      <div class="mt-4 flex items-center gap-3">
        <Avatar size="lg" :alt="fullName" :fallback="initials" />
        <div>
          <p class="text-sm font-semibold text-grey-900">{{ fullName || 'Admin user' }}</p>
          <p class="text-xs text-grey-500">{{ session?.data?.email }}</p>
        </div>
      </div>
      <Button type="button" variant="secondary" size="small" class="mt-5 !w-fit" disabled>
        Upload image
      </Button>
      <p class="mt-3 text-xs text-grey-500">Supported formats: PNG or JPEG. Maximum size: 1MB.</p>
    </section>

    <section
      class="min-w-0 flex-1 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Personal information</h2>
      <form class="mt-5 space-y-4" @submit.prevent="onSave">
        <Input
          v-model="form.firstName"
          label="First name"
          :invalid="Boolean(fieldErrors.firstName)"
          @update:model-value="markDirty"
        />
        <p v-if="fieldErrors.firstName" class="-mt-2 text-xs text-negative-500">
          {{ fieldErrors.firstName }}
        </p>

        <Input
          v-model="form.lastName"
          label="Last name"
          :invalid="Boolean(fieldErrors.lastName)"
          @update:model-value="markDirty"
        />
        <p v-if="fieldErrors.lastName" class="-mt-2 text-xs text-negative-500">
          {{ fieldErrors.lastName }}
        </p>

        <Input
          v-model="form.phoneNumber"
          label="Phone number"
          @update:model-value="markDirty"
        />

        <Input
          :model-value="session?.data?.email ?? ''"
          label="Email"
          hint="Change your email in security settings."
          disabled
        />

        <Input
          :model-value="formatSettingsRoleLabel(session?.data?.role)"
          label="Role"
          disabled
        />

        <Button
          type="submit"
          size="small"
          class="!w-fit"
          :loading="busyKey === 'profile'"
          :disabled="!dirty"
        >
          Save changes
        </Button>
      </form>
    </section>
  </div>
</template>
