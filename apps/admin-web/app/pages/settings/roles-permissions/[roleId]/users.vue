<script setup lang="ts">
import { Button, SearchField } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import SettingsRoleUsersTable from '~/components/settings/SettingsRoleUsersTable.vue';
import SettingsTableToolbarSkeleton from '~/components/settings/skeletons/SettingsTableToolbarSkeleton.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { parseAdminRoleDetail } from '~/lib/settings-api';

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();

const roleId = computed(() => String(route.params.roleId ?? ''));
const searchQuery = ref('');

const { data, pending, error, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/roles/${roleId.value}`,
  {
    watch: [roleId],
    key: computed(() => `admin-role-users:${roleId.value}`),
  },
);

const role = computed(() => parseAdminRoleDetail(data.value));

const filteredMembers = computed(() => {
  const members = role.value?.members ?? [];
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return members;

  return members.filter((member) =>
    [member.firstName, member.lastName, member.email].join(' ').toLowerCase().includes(query),
  );
});

watch(
  () => role.value?.name,
  (name) => {
    updateHeader({
      title: name ? `${name} users` : 'Role users',
      goBack: true,
      goBackTo: ADMIN_PAGE_ROUTES.SETTINGS_ROLES,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-4">
    <div class="w-fit">
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
    </div>

    <LoadErrorState
      v-if="!pending && (error || !role)"
      :error="error"
      not-found-title="Role not found"
      resource-label="role"
      @retry="refresh()"
    />

    <template v-else>
      <SettingsTableToolbarSkeleton v-if="pending" />

      <SearchField
        v-else
        v-model="searchQuery"
        class="w-full max-w-xs"
        placeholder="Search users"
      />

      <SettingsRoleUsersTable
        :members="pending ? [] : filteredMembers"
        :loading="pending"
      />
    </template>
  </div>
</template>
