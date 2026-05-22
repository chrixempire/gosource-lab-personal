<script setup lang="ts">
import {
  Avatar,
  Checkbox,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import SettingsUserActionsMenu from '~/components/settings/SettingsUserActionsMenu.vue';
import {
  SETTINGS_TABLE_STATUS_TAG_CLASS,
  adminUserStatusVariant,
} from '~/lib/settings-constants';
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

const gridTemplate = '3rem minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,0.55fr) minmax(0,0.7fr) 3rem';

const selectedIds = defineModel<string[]>('selectedIds', { default: () => [] });

const selectedSet = computed(() => new Set(selectedIds.value ?? []));

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (props.users.length === 0) return false;
  const count = props.users.filter((row) => selectedSet.value.has(row.id)).length;
  if (count === 0) return false;
  if (count === props.users.length) return true;
  return 'indeterminate';
});

function toggleAll(value: boolean | 'indeterminate') {
  if (value === false) {
    const ids = new Set(props.users.map((row) => row.id));
    selectedIds.value = selectedIds.value.filter((id) => !ids.has(id));
    return;
  }
  const merged = new Set(selectedIds.value);
  props.users.forEach((row) => merged.add(row.id));
  selectedIds.value = [...merged];
}

function toggleRow(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedIds.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedIds.value = [...next];
}

function displayName(user: AdminUserListItem) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}
</script>

<template>
  <TableShell class="overflow-visible rounded-xl border border-grey-50 bg-white">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell class="flex items-center">
          <Checkbox
            :model-value="selectionState"
            aria-label="Select all users"
            @update:model-value="toggleAll"
            @click.stop
          />
        </TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Role</TableCell>
        <TableCell>Status</TableCell>
        <TableCell>Date added</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="[
        { kind: 'line', lineClass: 'w-4' },
        { kind: 'line', lineClass: 'w-full' },
        { kind: 'line', lineClass: 'w-20' },
        { kind: 'line', lineClass: 'w-16' },
        { kind: 'line', lineClass: 'w-24' },
      ]"
      :grid-template-columns="gridTemplate"
      :row-count="8"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="user in users"
        :key="user.id"
        :style="{ gridTemplateColumns: gridTemplate }"
      >
        <TableCell class="flex items-center" @click.stop>
          <Checkbox
            :model-value="selectedSet.has(user.id)"
            :aria-label="`Select ${displayName(user)}`"
            @update:model-value="(value) => toggleRow(user.id, value)"
            @click.stop
          />
        </TableCell>
        <TableCell>
          <div class="flex min-w-0 items-center gap-3">
            <Avatar size="sm" :alt="displayName(user)" :fallback="displayName(user).slice(0, 2).toUpperCase()" />
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
        </TableCell>
        <TableCell class="text-grey-700">{{ user.role }}</TableCell>
        <TableCell>
          <StatusTag
            :variant="adminUserStatusVariant(user.status)"
            size="medium"
            :class="SETTINGS_TABLE_STATUS_TAG_CLASS"
          >
            {{ user.statusLabel }}
          </StatusTag>
        </TableCell>
        <TableCell class="text-grey-700">{{ user.createdAtLabel }}</TableCell>
        <TableCell class="flex justify-end" @click.stop>
          <SettingsUserActionsMenu
            :user="user"
            :loading="busyUserId === user.id"
            @edit="emit('edit', user)"
            @activate="emit('activate', user)"
            @suspend="emit('suspend', user)"
            @resend="emit('resend', user)"
          />
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && users.length === 0">
      <p class="px-4 py-8 text-center text-sm text-grey-300">No users found.</p>
    </TableFooter>
  </TableShell>
</template>
