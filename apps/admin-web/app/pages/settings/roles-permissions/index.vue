<script setup lang="ts">
import { Button, SearchField } from '@gosource/ui';
import { Plus } from 'lucide-vue-next';
import SettingsDeleteRoleDialog from '~/components/settings/SettingsDeleteRoleDialog.vue';
import SettingsRolesTable from '~/components/settings/SettingsRolesTable.vue';
import SettingsTableToolbarSkeleton from '~/components/settings/skeletons/SettingsTableToolbarSkeleton.vue';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import {
  ADMIN_PAGE_ROUTES,
  settingsRoleEditPath,
  settingsRoleUsersPath,
} from '~/lib/admin-routes';
import { parseAdminRolesList } from '~/lib/settings-api';
import type { AdminRoleListItem } from '~/types/settings';

const router = useRouter();
const { busyKey, deleteRole } = useSettingsMutations();

const searchQuery = ref('');
const deleteOpen = ref(false);
const activeRole = ref<AdminRoleListItem | null>(null);

const { data, pending, refresh } = await useAdminListFetch<unknown>('/api/roles');

const roles = computed(() => parseAdminRolesList(data.value));

const filteredRoles = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return roles.value;
  return roles.value.filter((role) =>
    [role.name, role.description].join(' ').toLowerCase().includes(query),
  );
});

function openDelete(role: AdminRoleListItem) {
  activeRole.value = role;
  deleteOpen.value = true;
}

async function onDeleteConfirm() {
  if (!activeRole.value) return;
  try {
    await deleteRole(activeRole.value.id);
    deleteOpen.value = false;
    await refresh();
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <div class="space-y-4">
    <SettingsTableToolbarSkeleton v-if="pending" />

    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <SearchField
        v-model="searchQuery"
        class="w-full max-w-xs"
        placeholder="Search roles"
      />
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Plus"
        @click="navigateTo(ADMIN_PAGE_ROUTES.SETTINGS_ROLE_CREATE)"
      >
        Add custom role
      </Button>
    </div>

    <SettingsRolesTable
      :roles="filteredRoles"
      :loading="pending"
      :busy-role-id="busyKey"
      @view-users="(role) => navigateTo(settingsRoleUsersPath(role.id))"
      @edit="(role) => navigateTo(settingsRoleEditPath(role.id))"
      @delete="openDelete"
    />

    <SettingsDeleteRoleDialog
      v-model:open="deleteOpen"
      :role="activeRole"
      :loading="Boolean(activeRole && busyKey === activeRole.id)"
      @confirm="onDeleteConfirm"
    />
  </div>
</template>
