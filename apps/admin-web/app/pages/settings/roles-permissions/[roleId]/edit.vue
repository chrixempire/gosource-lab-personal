<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import SettingsRoleForm from '~/components/settings/SettingsRoleForm.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { createEmptyRoleFormValues, validateRoleForm } from '~/lib/settings-form';
import {
  normalizeRolePermissions,
  parseAdminRoleDetail,
  parsePermissionSections,
} from '~/lib/settings-api';

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();
const { busyKey, updateRole } = useSettingsMutations();

const roleId = computed(() => String(route.params.roleId ?? ''));

const form = reactive(createEmptyRoleFormValues());
const fieldErrors = reactive<Record<string, string>>({});

const { data: roleData, pending: rolePending, error: roleError, refresh } = await useFetch<unknown>(
  () => `/api/roles/${roleId.value}`,
  { watch: [roleId] },
);

const { data: permissionsData, pending: permissionsPending } = await useFetch<unknown>(
  '/api/roles/permissions',
);

const role = computed(() => parseAdminRoleDetail(roleData.value));
const permissionSections = computed(() => parsePermissionSections(permissionsData.value));

function syncFormFromRole() {
  const value = role.value;
  const sections = permissionSections.value;
  if (!value) return;

  form.name = value.name === '—' ? '' : value.name;
  form.description = value.description;
  form.permissions = normalizeRolePermissions(value.permissions, sections);
}

watch([role, permissionSections], syncFormFromRole, { immediate: true });

watch(
  () => role.value?.name,
  (name) => {
    if (!name) return;
    updateHeader({
      title: `Edit ${name}`,
      goBack: true,
      goBackTo: ADMIN_PAGE_ROUTES.SETTINGS_ROLES,
    });
  },
  { immediate: true },
);

async function onSubmit() {
  if (!roleId.value) return;

  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateRoleForm(form));
  if (Object.keys(fieldErrors).length) return;

  try {
    await updateRole(roleId.value, {
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: [...form.permissions],
    });
    await refresh();
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
        v-if="role"
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :loading="busyKey === roleId"
        @click="onSubmit"
      >
        Save changes
      </Button>
    </div>

    <EmptyState
      v-if="!rolePending && (roleError || !role)"
      title="Role not found"
      :description="roleError?.message ?? 'This role could not be loaded.'"
    />

    <SettingsRoleForm
      v-else
      v-model="form"
      v-model:field-errors="fieldErrors"
      :permission-sections="permissionSections"
      :permissions-loading="permissionsPending && !rolePending"
      :page-loading="rolePending || (permissionsPending && !permissionSections.length)"
      hide-inline-submit
      :loading="busyKey === roleId"
      @submit="onSubmit"
    />
  </div>
</template>
