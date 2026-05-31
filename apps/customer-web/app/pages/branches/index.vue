<script setup lang="ts">
import type { BranchRecord } from '@gosource/api-client';
import { Button, PaginationBar, ViewToggle } from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import AddIcon from '~/components/icons/AddIcon.vue';
import BranchCards, { type BranchListItem } from '~/components/branches/BranchCards.vue';
import BranchCreateOverlay from '~/components/branches/BranchCreateOverlay.vue';
import BranchDeactivateOverlay from '~/components/branches/BranchDeactivateOverlay.vue';
import BranchDeleteOverlay from '~/components/branches/BranchDeleteOverlay.vue';
import BranchEditOverlay from '~/components/branches/BranchEditOverlay.vue';
import BranchInviteMemberOverlay from '~/components/branches/BranchInviteMemberOverlay.vue';
import BranchTable from '~/components/branches/BranchTable.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useCustomerBranchService } from '~/services/branch.service';

const { listBranches } = useCustomerBranchService();
const session = useState<any | null>('customer-session', () => null);
const {
  effectiveView,
  routeView,
  isCompactViewport,
  page,
  limit,
  sortKey,
  sortDirection,
  setPage,
  setLimit,
  setView,
  toggleSort,
} =
  useCollectionRouteState('table');

const searchValue = ref('');
const createOpen = ref(false);
const editOpen = ref(false);
const deactivateOpen = ref(false);
const deleteOpen = ref(false);
const inviteOpen = ref(false);
const branches = ref<BranchRecord[]>([]);
const selectedBranchId = ref<string | null>(null);
const meta = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});
const isEmployeeSession = computed(() => session.value?.user_type === 'employee');

const debouncedSearch = ref('');
const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 120);

watch(searchValue, (value) => {
  syncSearch(value);
});

const defaultMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const { data: branchesPayload, pending: loading, refresh: refreshBranches } = await useAuthenticatedAsyncData(
  'branches-list',
  async () => {
    const response = await listBranches({
      page: page.value,
      limit: limit.value,
      search: debouncedSearch.value.trim() || undefined,
    });
    return {
      branches: response.data ?? [],
      meta: response.meta ?? defaultMeta,
    };
  },
  {
    watch: [page, limit, debouncedSearch],
    default: () => ({
      branches: [] as BranchRecord[],
      meta: { ...defaultMeta },
    }),
  },
);

watch(branchesPayload, (payload) => {
  if (!payload) {
    return;
  }
  branches.value = payload.branches;
  meta.value = payload.meta;
}, { immediate: true });

const branchItems = computed<BranchListItem[]>(() =>
  branches.value.map((branch) => ({
    ...branch,
    addressLine: `${branch.streetName}, ${branch.lga}, ${branch.state}.`,
    totalAmount: branch.totalAmountProcured,
    membersCount: branch.membersCount ?? 0,
    avatarUrl: null,
    createdDateLabel: new Intl.DateTimeFormat('en-GB').format(new Date(branch.createdAt)),
    initials: branch.branchName
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase() || 'BR',
    statusLabel: branch.isDeactivated ? 'Inactive' : 'Active',
    statusVariant: branch.isDeactivated ? ('negative' as const) : ('success' as const),
  })),
);

const sortedBranches = computed(() => {
  const rows = [...branchItems.value];

  if (!sortKey.value) {
    return rows;
  }

  return rows.sort((left, right) => {
    const leftValue = left[sortKey.value as keyof BranchListItem];
    const rightValue = right[sortKey.value as keyof BranchListItem];

    let result = 0;

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      result = leftValue - rightValue;
    } else if (sortKey.value === 'createdAt') {
      result = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    } else if (sortKey.value === 'isDeactivated') {
      result = Number(left.isDeactivated) - Number(right.isDeactivated);
    } else {
      result = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    return sortDirection.value === 'asc' ? result : -result;
  });
});

function handleBranchCreated(branch?: BranchRecord) {
  if (!branch) {
    return;
  }
  void refreshBranches();
}

const selectedBranch = computed(() =>
  branches.value.find((branch) => branch.id === selectedBranchId.value) ?? null,
);

function navigateToBranch(branchId: string) {
  return navigateTo(`/branches/${branchId}`);
}

function handleRowClick(branch: BranchListItem) {
  void navigateToBranch(branch.id);
}

function handleViewBranch(branch: BranchListItem) {
  void navigateToBranch(branch.id);
}

function handleEditBranch(branch: BranchListItem) {
  selectedBranchId.value = branch.id;
  editOpen.value = true;
}

function handleInviteBranch(branch: BranchListItem) {
  selectedBranchId.value = branch.id;
  inviteOpen.value = true;
}

function handleDeactivateBranch(branch: BranchListItem) {
  selectedBranchId.value = branch.id;
  deactivateOpen.value = true;
}

function handleActivateBranch(branch: BranchListItem) {
  selectedBranchId.value = branch.id;
  deactivateOpen.value = true;
}

function handleDeleteBranch(branch: BranchListItem) {
  selectedBranchId.value = branch.id;
  deleteOpen.value = true;
}

function handleBranchUpdated(branch?: BranchRecord) {
  if (!branch) {
    return;
  }

  const targetId = String(branch.id || selectedBranchId.value || '').trim();
  if (!targetId) {
    void refreshBranches();
    return;
  }

  branches.value = branches.value.map((item) =>
    item.id === targetId
      ? {
          ...item,
          ...branch,
          id: targetId,
        }
      : item,
  );
}

function handleBranchDeactivated(branch?: BranchRecord) {
  if (!branch) {
    return;
  }

  const targetId = String(branch.id || selectedBranchId.value || '').trim();
  if (!targetId) {
    void refreshBranches();
    return;
  }

  branches.value = branches.value.map((item) =>
    item.id === targetId
      ? {
          ...item,
          ...branch,
          id: targetId,
        }
      : item,
  );
}

function handleBranchDeleted(branchId: string) {
  selectedBranchId.value = branchId;
  void refreshBranches();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="max-w-3xl text-base leading-7 text-grey-text">
      Create and manage your company’s branches
    </p>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between">
        <div class="w-full min-[1000px]:max-w-md">
          <SearchField
            v-model="searchValue"
            placeholder="Search branch name or branch ID"
            :disabled="loading"
          />
        </div>

        <div
          class="flex items-center gap-2"
          :class="loading ? 'pointer-events-none opacity-50' : undefined"
        >
          <ViewToggle
            v-if="!isCompactViewport"
            :model-value="routeView"
            @update:model-value="setView"
          />

          <Button
            v-if="!isEmployeeSession"
            :left-icon="AddIcon"
            size="medium"
            class="!w-auto"
            :disabled="loading"
            @click="createOpen = true"
          >
            Create branch
          </Button>
        </div>
      </div>

      <BranchTable
        v-if="effectiveView === 'table'"
        :branches="sortedBranches"
        :sort-key="sortKey"
        :sort-direction="sortDirection"
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
        :has-next-page="meta.hasNextPage"
        :has-prev-page="meta.hasPrevPage"
        :loading="loading"
        :can-manage="!isEmployeeSession"
        @sort="toggleSort"
        @page="setPage"
        @page-size="setLimit"
        @row-click="handleRowClick"
        @view="handleViewBranch"
        @invite="handleInviteBranch"
        @edit="handleEditBranch"
        @activate="handleActivateBranch"
        @deactivate="handleDeactivateBranch"
        @delete="handleDeleteBranch"
      />

      <div v-else-if="!loading" class="space-y-4">
        <BranchCards
          :branches="sortedBranches"
          :can-manage="!isEmployeeSession"
          @click="handleRowClick"
          @view="handleViewBranch"
          @invite="handleInviteBranch"
          @edit="handleEditBranch"
          @activate="handleActivateBranch"
          @deactivate="handleDeactivateBranch"
          @delete="handleDeleteBranch"
        />
        <PaginationBar
          plain
          :page="meta.page"
          :total-pages="meta.totalPages"
          :total-items="meta.total"
          :page-size="meta.limit"
          :has-next-page="meta.hasNextPage"
          :has-prev-page="meta.hasPrevPage"
          @change="setPage"
          @page-size-change="setLimit"
        />
      </div>

      <div v-else class="flex flex-wrap gap-4">
        <div
          v-for="index in 4"
          :key="index"
          class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] sm:p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <div class="size-10 shrink-0 animate-pulse rounded-full bg-grey-55" />
              <div class="min-w-0 flex-1 space-y-2 pt-0.5">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="h-5 max-w-[12rem] animate-pulse rounded-md bg-grey-55" />
                  <div class="h-6 w-24 shrink-0 animate-pulse rounded-full bg-grey-55" />
                </div>
                <div class="h-3.5 w-full max-w-[18rem] animate-pulse rounded-md bg-grey-55" />
              </div>
            </div>
            <div class="flex shrink-0 items-start gap-2">
              <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
              <div
                class="size-9 shrink-0 animate-pulse rounded-full border border-grey-50 bg-grey-55"
              />
            </div>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div
              v-for="cardIndex in 4"
              :key="cardIndex"
              class="rounded-[18px] bg-grey-55 px-4 py-3"
            >
              <div class="h-3 w-20 animate-pulse rounded-full bg-grey-100" />
              <div class="mt-2 h-4 w-16 animate-pulse rounded-full bg-grey-100" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <BranchCreateOverlay
      v-if="!isEmployeeSession"
      v-model:open="createOpen"
      @created="handleBranchCreated"
    />
    <BranchEditOverlay
      v-model:open="editOpen"
      :branch="selectedBranch"
      @updated="handleBranchUpdated"
    />
    <BranchDeactivateOverlay
      v-model:open="deactivateOpen"
      :branch="selectedBranch"
      @deactivated="handleBranchDeactivated"
    />
    <BranchDeleteOverlay
      v-model:open="deleteOpen"
      :branch="selectedBranch"
      @deleted="handleBranchDeleted"
    />
    <BranchInviteMemberOverlay
      v-model:open="inviteOpen"
      :branch="selectedBranch"
      :branches="branches"
      @invited="() => {}"
    />
  </div>
</template>
