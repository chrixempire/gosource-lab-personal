<script setup lang="ts">
import { Avatar, StatusTag } from '@gosource/ui';
import BranchActionsMenu from './BranchActionsMenu.vue';

export type BranchListItem = {
  id: string;
  branchName: string;
  branchCode: string;
  /** From API (`BranchRecord`); kept for sorting on the branches index page. */
  createdAt: string;
  addressLine: string;
  totalAmount: number;
  membersCount: number;
  createdDateLabel: string;
  initials: string;
  isHeadquarter: boolean;
  isDeactivated: boolean;
  statusLabel: string;
  statusVariant: 'success' | 'negative';
  avatarUrl?: string | null;
};

defineProps<{
  branches: BranchListItem[];
  canManage?: boolean;
}>();

const emit = defineEmits<{
  click: [branch: BranchListItem];
  view: [branch: BranchListItem];
  invite: [branch: BranchListItem];
  edit: [branch: BranchListItem];
  activate: [branch: BranchListItem];
  deactivate: [branch: BranchListItem];
  delete: [branch: BranchListItem];
}>();

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <article
      v-for="branch in branches"
      :key="branch.id"
      class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] cursor-pointer rounded-[24px] border border-grey-50 bg-background-on-canvas p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-colors duration-150 hover:bg-primary-50/30 sm:p-5"
      @click="emit('click', branch)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <Avatar
            size="md"
            :src="branch.avatarUrl"
            :alt="branch.branchName"
            :fallback="branch.initials"
          />
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-base font-semibold text-grey-900">
                {{ branch.branchName }}
              </h2>
              <span
                v-if="branch.isHeadquarter"
                class="inline-flex shrink-0 rounded-full bg-[linear-gradient(90deg,#F7931A_0%,#EC4899_100%)] px-2.5 py-1 text-[10px] font-semibold leading-none text-white"
              >
                Headquarter
              </span>
            </div>
            <p class="truncate text-sm text-grey-300">
              {{ branch.addressLine }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-start gap-2">
          <StatusTag
            :variant="branch.statusVariant"
            size="medium"
            class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ branch.statusLabel }}
          </StatusTag>
          <BranchActionsMenu
            :hidden="canManage === false"
            :is-deactivated="branch.isDeactivated"
            @view="emit('view', branch)"
            @invite="emit('invite', branch)"
            @edit="emit('edit', branch)"
            @activate="emit('activate', branch)"
            @deactivate="emit('deactivate', branch)"
            @delete="emit('delete', branch)"
          />
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Branch code
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ branch.branchCode }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Members
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ branch.membersCount }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Total amount
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ formatCurrency(branch.totalAmount) }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Created date
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ branch.createdDateLabel }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
