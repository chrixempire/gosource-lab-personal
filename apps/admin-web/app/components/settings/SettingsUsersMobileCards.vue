<script setup lang="ts">
import { Avatar, Checkbox, StatusTag } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import SettingsUserActionsMenu from '~/components/settings/SettingsUserActionsMenu.vue';
import {
  SETTINGS_TABLE_STATUS_TAG_CLASS,
  adminUserStatusVariant,
} from '~/lib/settings-constants';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';
import type { AdminUserListItem } from '~/types/settings';

const props = defineProps<{
  users: AdminUserListItem[];
  loading?: boolean;
  currentUserId?: string;
  busyUserId?: string | null;
}>();

const emit = defineEmits<{
  edit: [user: AdminUserListItem];
  activate: [user: AdminUserListItem];
  suspend: [user: AdminUserListItem];
  resend: [user: AdminUserListItem];
}>();

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

function displayName(user: AdminUserListItem) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}

function toggleRow(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" :count="8" />

  <p v-else-if="!users.length" class="rounded-xl border border-grey-50 bg-white px-4 py-8 text-center text-sm text-grey-300">
    No users found.
  </p>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="user in users"
      :key="user.id"
      :class="CREDIT_CARD_SHELL_CLASS"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <Checkbox
            :model-value="selectedSet.has(user.id)"
            :aria-label="`Select ${displayName(user)}`"
            @click.stop
            @update:model-value="(value) => toggleRow(user.id, value === true)"
          />
          <div class="flex min-w-0 items-center gap-3">
            <Avatar
              size="sm"
              :alt="displayName(user)"
              :fallback="displayName(user).slice(0, 2).toUpperCase()"
            />
            <div class="min-w-0">
              <p class="flex items-center gap-2 truncate text-sm font-semibold text-grey-900">
                <span class="truncate">{{ displayName(user) }}</span>
                <span
                  v-if="user.id === currentUserId"
                  class="shrink-0 rounded-full bg-gradient-to-r from-[#F3A218] via-[#A718A7] to-[#B81A5B] px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                >
                  You
                </span>
              </p>
              <p class="truncate text-xs text-grey-500">{{ user.email }}</p>
            </div>
          </div>
        </div>
        <SettingsUserActionsMenu
          :user="user"
          :loading="busyUserId === user.id"
          @edit="emit('edit', user)"
          @activate="emit('activate', user)"
          @suspend="emit('suspend', user)"
          @resend="emit('resend', user)"
        />
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <AdminMobileCardStat label="Role">{{ user.role }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Date added">{{ user.createdAtLabel }}</AdminMobileCardStat>
      </div>

      <div class="mt-3">
        <StatusTag
          :variant="adminUserStatusVariant(user.status)"
          size="medium"
          :class="SETTINGS_TABLE_STATUS_TAG_CLASS"
        >
          {{ user.statusLabel }}
        </StatusTag>
      </div>
    </article>
  </div>
</template>
