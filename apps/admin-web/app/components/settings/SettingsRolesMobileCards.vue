<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Pencil, Trash2, Users } from 'lucide-vue-next';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';
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
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" />

  <p v-else-if="!roles.length" class="rounded-xl border border-grey-50 bg-white px-4 py-8 text-center text-sm text-grey-300">
    No roles found.
  </p>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="role in roles"
      :key="role.id"
      :class="CREDIT_CARD_SHELL_CLASS"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-semibold text-grey-900">{{ role.name }}</p>
          <p v-if="role.description" class="mt-0.5 text-xs text-grey-500">{{ role.description }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
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
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <AdminMobileCardStat label="Users">{{ role.userCount }}</AdminMobileCardStat>
        <AdminMobileCardStat label="Date added">{{ role.createdAtLabel }}</AdminMobileCardStat>
      </div>
    </article>
  </div>
</template>
