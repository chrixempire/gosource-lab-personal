<script setup lang="ts">
import {
  Avatar,
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
import {
  SETTINGS_TABLE_STATUS_TAG_CLASS,
  adminUserStatusVariant,
} from '~/lib/settings-constants';
import type { AdminRoleMember } from '~/types/settings';

defineProps<{
  members: AdminRoleMember[];
  loading?: boolean;
}>();

const gridTemplate = 'minmax(0,1fr) minmax(0,0.45fr)';
</script>

<template>
  <TableShell class="overflow-visible rounded-xl border border-grey-50 bg-white">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell>User</TableCell>
        <TableCell>Status</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="[
        { kind: 'line', lineClass: 'w-full' },
        { kind: 'line', lineClass: 'w-16' },
      ]"
      :grid-template-columns="gridTemplate"
      :row-count="6"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="member in members"
        :key="member.id"
        :style="{ gridTemplateColumns: gridTemplate }"
      >
        <TableCell>
          <div class="flex items-center gap-3">
            <Avatar
              size="sm"
              :alt="`${member.firstName} ${member.lastName}`"
              :fallback="`${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase()"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-900">
                {{ member.firstName }} {{ member.lastName }}
              </p>
              <p class="truncate text-xs text-grey-500">{{ member.email }}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <StatusTag
            :variant="adminUserStatusVariant(member.status)"
            size="medium"
            :class="SETTINGS_TABLE_STATUS_TAG_CLASS"
          >
            {{ member.statusLabel }}
          </StatusTag>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && members.length === 0">
      <p class="px-4 py-8 text-center text-sm text-grey-300">No users in this role.</p>
    </TableFooter>
  </TableShell>
</template>
