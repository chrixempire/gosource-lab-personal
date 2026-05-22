<script setup lang="ts">
import {
  Button,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { Pencil, Trash2, Users } from 'lucide-vue-next';
import type { AdminRoleListItem } from '~/types/settings';

defineProps<{
  roles: AdminRoleListItem[];
  loading?: boolean;
  busyRoleId?: string | null;
}>();

const emit = defineEmits<{
  viewUsers: [role: AdminRoleListItem];
  edit: [role: AdminRoleListItem];
  delete: [role: AdminRoleListItem];
}>();

const gridTemplate = 'minmax(0,1.2fr) minmax(0,0.5fr) minmax(0,0.7fr) 7rem';
</script>

<template>
  <TableShell class="overflow-visible rounded-xl border border-grey-50 bg-white">
    <TableHeader
      class="sticky -top-8 z-30 shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white pb-1 shadow-[0_10px_20px_-16px_rgba(16,24,40,0.18)]"
    >
      <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
        <TableCell>Role</TableCell>
        <TableCell>Users</TableCell>
        <TableCell>Date added</TableCell>
        <TableCell class="sr-only">Actions</TableCell>
      </TableHeadRow>
    </TableHeader>

    <TableSkeleton
      v-if="loading"
      :columns="[
        { kind: 'line', lineClass: 'w-full' },
        { kind: 'line', lineClass: 'w-10' },
        { kind: 'line', lineClass: 'w-24' },
      ]"
      :grid-template-columns="gridTemplate"
      :row-count="6"
    />

    <TableBody v-else class="!max-h-none !overflow-visible">
      <TableRow
        v-for="role in roles"
        :key="role.id"
        :style="{ gridTemplateColumns: gridTemplate }"
      >
        <TableCell>
          <p class="font-semibold text-grey-900">{{ role.name }}</p>
          <p v-if="role.description" class="mt-0.5 text-xs text-grey-500">{{ role.description }}</p>
        </TableCell>
        <TableCell class="text-grey-700">{{ role.userCount }}</TableCell>
        <TableCell class="text-grey-700">{{ role.createdAtLabel }}</TableCell>
        <TableCell class="flex items-center justify-end gap-1" @click.stop>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="!size-8"
            aria-label="View users"
            @click="emit('viewUsers', role)"
          >
            <Users class="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="!size-8"
            aria-label="Edit role"
            @click="emit('edit', role)"
          >
            <Pencil class="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="!size-8 text-negative-500 hover:bg-negative-50 hover:text-negative-500"
            aria-label="Delete role"
            :disabled="busyRoleId === role.id"
            @click="emit('delete', role)"
          >
            <Trash2 class="size-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>

    <TableFooter v-if="!loading && roles.length === 0">
      <p class="px-4 py-8 text-center text-sm text-grey-300">No roles found.</p>
    </TableFooter>
  </TableShell>
</template>
