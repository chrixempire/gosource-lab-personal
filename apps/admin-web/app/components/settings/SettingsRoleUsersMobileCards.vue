<script setup lang="ts">
import { Avatar, StatusTag } from '@gosource/ui';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import {
  SETTINGS_TABLE_STATUS_TAG_CLASS,
  adminUserStatusVariant,
} from '~/lib/settings-constants';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';
import type { AdminRoleMember } from '~/types/settings';

defineProps<{
  members: AdminRoleMember[];
  loading?: boolean;
}>();
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" />

  <p v-else-if="!members.length" class="rounded-xl border border-grey-50 bg-white px-4 py-8 text-center text-sm text-grey-300">
    No users in this role.
  </p>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="member in members"
      :key="member.id"
      :class="CREDIT_CARD_SHELL_CLASS"
    >
      <div class="flex items-center gap-3">
        <Avatar
          size="sm"
          :alt="`${member.firstName} ${member.lastName}`"
          :fallback="`${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase()"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-grey-900">
            {{ member.firstName }} {{ member.lastName }}
          </p>
          <p class="truncate text-xs text-grey-500">{{ member.email }}</p>
        </div>
        <StatusTag
          :variant="adminUserStatusVariant(member.status)"
          size="medium"
          :class="SETTINGS_TABLE_STATUS_TAG_CLASS"
        >
          {{ member.statusLabel }}
        </StatusTag>
      </div>
    </article>
  </div>
</template>
