<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import SettingsRoleForm from '~/components/settings/SettingsRoleForm.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { createEmptyRoleFormValues, validateRoleForm } from '~/lib/settings-form';
import { parsePermissionSections } from '~/lib/settings-api';

const router = useRouter();
const { updateHeader } = useAdminHeader();
const { busyKey, createRole } = useSettingsMutations();

const form = reactive(createEmptyRoleFormValues());
const fieldErrors = reactive<Record<string, string>>({});

const { data: permissionsData, pending: permissionsPending } = await useFetch<unknown>(
  '/api/roles/permissions',
);

const permissionSections = computed(() => parsePermissionSections(permissionsData.value));

updateHeader({
  title: 'Add custom role',
  goBack: true,
  goBackTo: ADMIN_PAGE_ROUTES.SETTINGS_ROLES,
});

async function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateRoleForm(form));
  if (Object.keys(fieldErrors).length) return;

  try {
    await createRole({
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: [...form.permissions],
    });
    await navigateTo(ADMIN_PAGE_ROUTES.SETTINGS_ROLES);
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="router.push(ADMIN_PAGE_ROUTES.SETTINGS_ROLES)"
      >
        Back to roles
      </Button>

      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :loading="busyKey === 'create-role'"
        @click="onSubmit"
      >
        Add role
      </Button>
    </div>

    <SettingsRoleForm
      v-model="form"
      v-model:field-errors="fieldErrors"
      :permission-sections="permissionSections"
      :page-loading="permissionsPending && !permissionSections.length"
      :permissions-loading="permissionsPending"
      hide-inline-submit
      :loading="busyKey === 'create-role'"
      @submit="onSubmit"
    />
  </div>
</template>
