<script setup lang="ts">
import { Button, SearchField } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import SettingsEditUserDialog from '~/components/settings/SettingsEditUserDialog.vue';
import SettingsInviteUserDialog from '~/components/settings/SettingsInviteUserDialog.vue';
import SettingsUserActionDialog from '~/components/settings/SettingsUserActionDialog.vue';
import type { SettingsUserActionMode } from '~/components/settings/SettingsUserActionDialog.vue';
import SettingsUsersTable from '~/components/settings/SettingsUsersTable.vue';
import SettingsTableToolbarSkeleton from '~/components/settings/skeletons/SettingsTableToolbarSkeleton.vue';
import { useAdminSession } from '~/composables/useAdminSession';
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import { parseAdminRolesList, parseAdminUsersList } from '~/lib/settings-api';
import type { AdminUserListItem } from '~/types/settings';

const { session } = useAdminSession();
const {
  busyKey,
  activateAdminUser,
  suspendAdminUser,
  resendAdminInvite,
} = useSettingsMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 300);
const selectedIds = ref<string[]>([]);

const inviteOpen = ref(false);
const editOpen = ref(false);
const actionOpen = ref(false);
const actionMode = ref<SettingsUserActionMode>('activate');
const activeUser = ref<AdminUserListItem | null>(null);

const { data: usersData, pending: usersPending, refresh: refreshUsers } = await useFetch<unknown>(
  '/api/admins',
);

const { data: rolesData } = await useFetch<unknown>('/api/roles');

const allUsers = computed(() => parseAdminUsersList(usersData.value));
const roles = computed(() => parseAdminRolesList(rolesData.value));

const filteredUsers = computed(() => {
  const query = String(debouncedSearch.value ?? '').trim().toLowerCase();
  if (!query) return allUsers.value;

  return allUsers.value.filter((user) => {
    const haystack = [user.firstName, user.lastName, user.email, user.role]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
});

function openEdit(user: AdminUserListItem) {
  activeUser.value = user;
  editOpen.value = true;
}

function openAction(user: AdminUserListItem, mode: SettingsUserActionMode) {
  activeUser.value = user;
  actionMode.value = mode;
  actionOpen.value = true;
}

async function onActionConfirm() {
  if (!activeUser.value) return;

  try {
    if (actionMode.value === 'activate') {
      await activateAdminUser(activeUser.value.id);
    } else if (actionMode.value === 'suspend') {
      await suspendAdminUser(activeUser.value.id);
    } else if (actionMode.value === 'resend') {
      await resendAdminInvite({
        userId: activeUser.value.id,
        callbackUrl: `${window.location.origin}/auth/setup-profile`,
      });
    }
    actionOpen.value = false;
    await refreshUsers();
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <div class="space-y-4">
    <SettingsTableToolbarSkeleton v-if="usersPending" />

    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <SearchField
        v-model="searchQuery"
        class="w-full max-w-xs"
        placeholder="Search users"
      />
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Plus"
        @click="inviteOpen = true"
      >
        Invite user
      </Button>
    </div>

    <SettingsUsersTable
      v-model:selected-ids="selectedIds"
      :users="filteredUsers"
      :loading="usersPending"
      :current-user-id="session?.data?.id"
      :busy-user-id="busyKey"
      @edit="openEdit"
      @activate="(user) => openAction(user, 'activate')"
      @suspend="(user) => openAction(user, 'suspend')"
      @resend="(user) => openAction(user, 'resend')"
    />

    <SettingsInviteUserDialog
      v-model:open="inviteOpen"
      :roles="roles"
      @invited="refreshUsers()"
    />

    <SettingsEditUserDialog
      v-model:open="editOpen"
      :user="activeUser"
      :roles="roles"
      @saved="refreshUsers()"
    />

    <SettingsUserActionDialog
      v-model:open="actionOpen"
      :mode="actionMode"
      :user="activeUser"
      :loading="Boolean(activeUser && busyKey === activeUser.id)"
      @confirm="onActionConfirm"
    />
  </div>
</template>
