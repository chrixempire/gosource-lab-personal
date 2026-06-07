<script setup lang="ts">
import { Avatar, PaginationBar, StatusTag } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';

const HEADQUARTER_BADGE_STYLE =
  'background: linear-gradient(84deg, #F3A218 8.47%, #A718A7 51.23%, #B81A5B 97.75%)';

type BranchRow = {
  id: string;
  name: string;
  address: string;
  isHeadquarter?: boolean;
  membersCount: number | string;
  totalSpentLabel: string;
  statusLabel: string;
  createdAtLabel: string;
};

defineProps<{
  rows: BranchRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pending?: boolean;
  error?: unknown;
}>();

const emit = defineEmits<{
  retry: [];
  page: [page: number];
  pageSize: [size: number];
}>();

function branchInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?'
  );
}

function branchAvatarFallbackClass(isInactive: boolean) {
  return isInactive
    ? '!bg-grey-55 !text-grey-400'
    : '!bg-primary-50 !text-primary-700';
}
</script>

<template>
  <div class="space-y-4">
    <AdminMobileCardsSkeleton v-if="pending" :count="8" />

    <LoadErrorState
      v-else-if="error && rows.length === 0"
      compact
      :error="error"
      load-failed-title="Unable to load branches"
      resource-label="branch list"
      @retry="emit('retry')"
    />

    <p
      v-else-if="!rows.length"
      class="rounded-xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500"
    >
      No branches found
    </p>

    <template v-else>
      <div :class="CREDIT_CARDS_GRID_CLASS">
        <article
          v-for="branch in rows"
          :key="branch.id"
          :class="[CREDIT_CARD_SHELL_CLASS, 'cursor-default hover:bg-white hover:border-grey-50']"
        >
          <div class="flex min-w-0 items-start gap-3">
            <Avatar
              size="md"
              :alt="branch.name"
              :fallback="branchInitials(branch.name)"
              :fallback-class="branchAvatarFallbackClass(branch.statusLabel === 'Inactive')"
            />
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <p class="truncate text-sm font-semibold text-grey-900">{{ branch.name }}</p>
                <span
                  v-if="branch.isHeadquarter"
                  class="shrink-0 rounded-[100px] px-1.5 py-1 text-[10px] font-bold uppercase text-white"
                  :style="HEADQUARTER_BADGE_STYLE"
                >
                  Headquarter
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-grey-500">{{ branch.address }}</p>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <AdminMobileCardStat label="Members">{{ branch.membersCount }}</AdminMobileCardStat>
            <AdminMobileCardStat label="Total spent">{{ branch.totalSpentLabel }}</AdminMobileCardStat>
            <AdminMobileCardStat label="Date created">{{ branch.createdAtLabel }}</AdminMobileCardStat>
          </div>
          <div class="mt-3">
            <StatusTag
              :variant="branch.statusLabel === 'Active' ? 'success' : 'default'"
              size="medium"
            >
              {{ branch.statusLabel }}
            </StatusTag>
          </div>
        </article>
      </div>

      <PaginationBar
        v-if="meta.total > 0"
        :page="meta.page"
        :page-size="meta.limit"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :has-next-page="meta.hasNext"
        :has-prev-page="meta.hasPrev"
        @change="emit('page', $event)"
        @page-size-change="emit('pageSize', $event)"
      />
    </template>
  </div>
</template>
