<script setup lang="ts">
import type { BranchMemberRecord, BranchRecord, EmployeeInviteResponse } from '@gosource/api-client';
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaginationBar,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { useDebounceFn, useMediaQuery } from '@vueuse/core';
import { ChevronDown, ChevronLeft, Pencil, Power, Trash2, UserPlus } from 'lucide-vue-next';
import BranchDeactivateOverlay from '~/components/branches/BranchDeactivateOverlay.vue';
import BranchDeleteOverlay from '~/components/branches/BranchDeleteOverlay.vue';
import BranchEditOverlay from '~/components/branches/BranchEditOverlay.vue';
import BranchInviteMemberOverlay from '~/components/branches/BranchInviteMemberOverlay.vue';
import AddIcon from '~/components/icons/AddIcon.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerEmployeeService } from '~/services/employee.service';

const runWhenSessionReady = useAuthenticatedFetch();

const session = useState<{ user_type?: string } | null>('customer-session', () => null);
const isEmployeeSession = computed(() => session.value?.user_type === 'employee');

const route = useRoute();
const { getBranch, listBranches } = useCustomerBranchService();
const { listBranchMembers } = useCustomerEmployeeService();

const branchId = computed(() => String(route.params.id ?? ''));
const branch = ref<BranchRecord | null>(null);
const allBranches = ref<BranchRecord[]>([]);
const editOpen = ref(false);
const deactivateOpen = ref(false);
const deleteOpen = ref(false);
const inviteOpen = ref(false);
const membersLoading = ref(true);
const memberRows = ref<BranchMemberRecord[]>([]);
const defaultMemberMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};
const memberMeta = ref({
  ...defaultMemberMeta,
});
const membersGridTemplate = 'minmax(0,2.2fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,0.9fr)';
const isCompactViewport = useMediaQuery('(max-width: 999px)');
const membersSearchValue = ref('');
const debouncedMembersSearch = ref('');
const flushMembersSearch = useDebounceFn((value: string) => {
  debouncedMembersSearch.value = value;
}, 200);

watch(membersSearchValue, (value) => {
  void flushMembersSearch(value);
});

const membersSearchActive = computed(() => debouncedMembersSearch.value.trim().length > 0);

const membersSkeletonColumns = [
  { kind: 'stack' as const, avatar: true, lineClass: 'w-full', sublineClass: 'w-4/5' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
];

const {
  data: branchDetailPayload,
  pending: loading,
} = await useAuthenticatedAsyncData(
  'branch-detail',
  async () => {
    if (!branchId.value) {
      return {
        branch: null as BranchRecord | null,
        allBranches: [] as BranchRecord[],
        members: [] as BranchMemberRecord[],
        memberMeta: { ...defaultMemberMeta },
      };
    }

    const [branchResponse, branchMembersResponse, branchesResponse] = await Promise.all([
      getBranch(branchId.value),
      listBranchMembers(branchId.value, {
        page: defaultMemberMeta.page,
        limit: defaultMemberMeta.limit,
      }),
      isEmployeeSession.value
        ? Promise.resolve(null)
        : listBranches({ page: 1, limit: 100 }).catch(() => null),
    ]);

    const nextBranch = branchResponse.data ?? null;

    return {
      branch: nextBranch
        ? {
            ...nextBranch,
            id: String(nextBranch.id || branchId.value).trim(),
          }
        : null,
      allBranches: branchesResponse?.data ?? (nextBranch ? [nextBranch] : []),
      members: branchMembersResponse.data ?? [],
      memberMeta: branchMembersResponse.meta ?? { ...defaultMemberMeta },
    };
  },
  {
    watch: [branchId],
    default: () => ({
      branch: null as BranchRecord | null,
      allBranches: [] as BranchRecord[],
      members: [] as BranchMemberRecord[],
      memberMeta: { ...defaultMemberMeta },
    }),
  },
);

watch(
  branchDetailPayload,
  (payload) => {
    if (!payload) {
      return;
    }

    branch.value = payload.branch ?? null;
    allBranches.value = Array.isArray(payload.allBranches) ? payload.allBranches : [];
    memberRows.value = Array.isArray(payload.members) ? payload.members : [];
    memberMeta.value = payload.memberMeta ?? { ...defaultMemberMeta };
    membersLoading.value = false;
  },
  { immediate: true },
);

async function fetchMembers() {
  if (!branchId.value) {
    return;
  }

  membersLoading.value = true;

  try {
    const response = await runWhenSessionReady(() => listBranchMembers(branchId.value, {
      page: memberMeta.value.page,
      limit: memberMeta.value.limit,
      search: debouncedMembersSearch.value.trim() || undefined,
    }));

    memberRows.value = response.data ?? [];
    memberMeta.value = response.meta ?? memberMeta.value;
  } finally {
    membersLoading.value = false;
  }
}

watch(branchId, (_id, prevId) => {
  if (prevId !== undefined && _id !== prevId) {
    membersSearchValue.value = '';
    debouncedMembersSearch.value = '';
    memberMeta.value = { ...defaultMemberMeta };
    memberRows.value = [];
    membersLoading.value = true;
  }
}, { immediate: true });

watch(debouncedMembersSearch, (_query, prev) => {
  if (prev === undefined) {
    return;
  }

  memberMeta.value.page = 1;
  void fetchMembers();
});

const summaryCards = computed(() => {
  if (!branch.value) {
    return [];
  }

  return [
    {
      label: 'Total amount',
      value: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        maximumFractionDigits: 2,
      }).format(branch.value.totalAmountProcured ?? 0),
    },
    { label: 'Total orders', value: String(branch.value.totalOrders ?? 0) },
    {
      label: 'Items purchased',
      value: String(branch.value.totalItemsPurchased ?? 0),
    },
  ];
});

function handleBranchUpdated(nextBranch: BranchRecord) {
  const currentBranch = branch.value;
  branch.value = {
    ...currentBranch,
    ...nextBranch,
    id: String(nextBranch.id || branchId.value).trim(),
    totalAmountProcured: nextBranch.totalAmountProcured ?? currentBranch?.totalAmountProcured ?? 0,
    totalOrders: nextBranch.totalOrders ?? currentBranch?.totalOrders ?? 0,
    totalItemsPurchased: nextBranch.totalItemsPurchased ?? currentBranch?.totalItemsPurchased ?? 0,
  };

  void runWhenSessionReady(() => getBranch(branchId.value))
    .then((response) => {
      const refreshed = response.data;
      if (!refreshed) {
        return;
      }

      branch.value = {
        ...refreshed,
        id: String(refreshed.id || branchId.value).trim(),
      };
    })
    .catch(() => undefined);
}

function handleBranchDeactivated(nextBranch: BranchRecord) {
  branch.value = {
    ...nextBranch,
    id: String(nextBranch.id || branchId.value).trim(),
  };
}

async function handleBranchDeleted() {
  await navigateTo('/branches');
}

function setMembersPage(page: number) {
  memberMeta.value.page = page;
  void fetchMembers();
}

function setMembersLimit(limit: number) {
  memberMeta.value.limit = limit;
  memberMeta.value.page = 1;
  void fetchMembers();
}

function handleMemberInvited(_invite: EmployeeInviteResponse['data']) {
  void fetchMembers();
}

const formattedMembers = computed(() =>
  memberRows.value.map((member) => {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
    const fallback = (fullName || member.email)
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase();

    const statusLabel =
      member.kind === 'invite' || member.status === 'pending'
        ? 'Pending'
        : member.status === 'inactive'
          ? 'Inactive'
          : 'Active';

    const statusVariant =
      member.kind === 'invite' || member.status === 'pending'
        ? ('warning' as const)
        : member.status === 'inactive'
          ? ('negative' as const)
          : ('success' as const);

    return {
      ...member,
      fullName,
      fallback,
      positionLabel: member.kind === 'invite' ? 'Pending invite' : member.position || 'Not set',
      roleLabel: member.role.charAt(0).toUpperCase() + member.role.slice(1),
      statusLabel,
      statusVariant,
    };
  }),
);
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <div class="flex items-center justify-between">
      <Button
        variant="neutral"
        size="small"
        class="!w-auto"
        :left-icon="ChevronLeft"
        @click="navigateTo('/branches')"
      >
        Back
      </Button>

      <DropdownMenu v-if="branch && !isEmployeeSession">
        <DropdownMenuTrigger as-child>
          <Button variant="primary" size="small" class="!w-auto" :right-icon="ChevronDown">
            More actions
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem class="gap-2.5" @select="editOpen = true">
            <Pencil class="size-4" />
            Edit branch
          </DropdownMenuItem>
          <DropdownMenuItem class="gap-2.5" @select="inviteOpen = true">
            <UserPlus class="size-4" />
            Invite member
          </DropdownMenuItem>
          <DropdownMenuItem
            :class="
              branch.isDeactivated
                ? 'gap-2.5'
                : 'gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!'
            "
            @select="deactivateOpen = true"
          >
            <Power class="size-4" />
            {{ branch.isDeactivated ? 'Activate branch' : 'Deactivate branch' }}
          </DropdownMenuItem>
          <DropdownMenuItem class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!" @select="deleteOpen = true">
            <Trash2 class="size-4" />
            Delete branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="loading" class="flex flex-col gap-2">
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="index in 3"
          :key="index"
          class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-5 py-5"
        >
          <div class="h-3 w-24 animate-pulse rounded bg-grey-50" />
          <div class="mt-4 h-8 w-40 animate-pulse rounded bg-grey-50" />
        </div>
      </div>

      <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
        <div class="flex flex-col gap-2">
          <div>
            <div class="h-7 w-48 max-w-full animate-pulse rounded bg-grey-50" />
            <div class="mt-2 h-4 w-[min(100%,20rem)] animate-pulse rounded bg-grey-50" />
          </div>
          <div class="-mx-6 border-b border-grey-50" />
        </div>

        <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            v-for="index in 4"
            :key="`field-${index}`"
            class="flex flex-col gap-1"
          >
            <div class="h-4 w-24 animate-pulse rounded bg-grey-50" />
            <div class="h-4 w-full max-w-xs animate-pulse rounded bg-grey-50" />
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="h-7 w-40 max-w-full animate-pulse rounded bg-grey-50" />
            <div class="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-grey-50" />
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="h-10 w-full max-w-md animate-pulse rounded-[10px] bg-grey-50" />
          <div class="h-9 w-36 shrink-0 animate-pulse rounded-[10px] bg-grey-50" />
        </div>

        <TableShell class="flex flex-col">
          <TableHeader>
            <TableHeadRow :style="{ gridTemplateColumns: membersGridTemplate }">
              <TableCell>Name &amp; Email</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableHeadRow>
          </TableHeader>

          <TableSkeleton
            :columns="membersSkeletonColumns"
            :grid-template-columns="membersGridTemplate"
            :row-count="6"
          />

          <TableFooter>
            <PaginationBar
              :page="memberMeta.page"
              :total-pages="memberMeta.totalPages"
              :total-items="memberMeta.total"
              :page-size="memberMeta.limit"
              :has-next-page="memberMeta.hasNextPage"
              :has-prev-page="memberMeta.hasPrevPage"
              plain
              disabled
              @change="setMembersPage"
              @page-size-change="setMembersLimit"
            />
          </TableFooter>
        </TableShell>
      </section>
    </div>

    <div v-else-if="branch" class="flex flex-col gap-2">
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-5 py-5"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.08em] text-grey-300">
            {{ card.label }}
          </p>
          <p class="mt-3 text-[1.75rem] font-semibold leading-10 tracking-[-1px] text-grey-900">
            {{ card.value }}
          </p>
        </div>
      </div>

      <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
        <div class="flex flex-col gap-2">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-semibold text-grey-900">
                Branch information
              </h2>
              <StatusTag
                :variant="branch.isDeactivated ? 'negative' : 'success'"
                size="medium"
                class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
              >
                {{ branch.isDeactivated ? 'Deactivated' : 'Active' }}
              </StatusTag>
            </div>
            <p class="mt-1 text-sm text-grey-text">
              Review this branch’s details and manage updates from here.
            </p>
          </div>
          <div class="-mx-6 border-b border-grey-50" />
        </div>

        <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="space-y-1">
            <p class="text-sm font-medium text-grey-900">Branch</p>
            <div class="flex items-center gap-3">
              <p class="text-sm text-grey-300">{{ branch.branchName }}</p>
              <span
                v-if="branch.isHeadquarter"
                class="inline-flex rounded-full bg-[linear-gradient(90deg,#F7931A_0%,#EC4899_100%)] px-2.5 py-1 text-[10px] font-semibold leading-none text-white"
              >
                Headquarter
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-medium text-grey-900">Address</p>
            <p class="text-sm text-grey-300">
              {{ `${branch.streetName}, ${branch.lga}, ${branch.state}.` }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-medium text-grey-900">Created on</p>
            <p class="text-sm text-grey-300">
              {{ new Intl.DateTimeFormat('en-GB').format(new Date(branch.createdAt)) }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-medium text-grey-900">Branch code</p>
            <p class="text-sm text-grey-300">{{ branch.branchCode }}</p>
          </div>

          <div class="space-y-1">
            <p class="text-sm font-medium text-grey-900">Activated on</p>
            <p class="text-sm text-grey-300">
              {{
                branch.activatedAt
                  ? new Intl.DateTimeFormat('en-GB').format(new Date(branch.activatedAt))
                  : 'Not activated yet'
              }}
            </p>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-grey-900">Members</h2>
            <p class="mt-1 text-sm text-grey-text">
              Invite and manage the members assigned to this branch.
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="w-full sm:max-w-md">
            <SearchField
              v-model="membersSearchValue"
              placeholder="Search by name, email, role, or position"
              :disabled="membersLoading"
            />
          </div>
          <Button
            v-if="!isEmployeeSession"
            :left-icon="AddIcon"
            size="small"
            class="!w-auto shrink-0 self-start sm:self-center"
            :disabled="membersLoading"
            @click="inviteOpen = true"
          >
            Invite members
          </Button>
        </div>

        <div v-if="isCompactViewport" class="space-y-2">
          <div v-if="membersLoading" class="grid gap-4">
            <div
              v-for="index in 4"
              :key="index"
              class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]"
            >
              <div class="flex items-start gap-3">
                <div class="size-10 shrink-0 animate-pulse rounded-full bg-grey-55" />
                <div class="min-w-0 flex-1 space-y-2 pt-0.5">
                  <div class="h-5 max-w-[11rem] animate-pulse rounded-md bg-grey-55" />
                  <div class="h-3.5 w-full max-w-[20rem] animate-pulse rounded-md bg-grey-55" />
                </div>
                <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div
                  v-for="cardIndex in 2"
                  :key="cardIndex"
                  class="rounded-[18px] bg-grey-55 px-4 py-3"
                >
                  <div class="h-3 w-20 animate-pulse rounded-full bg-grey-100" />
                  <div class="mt-2 h-4 w-16 animate-pulse rounded-full bg-grey-100" />
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="formattedMembers.length > 0" class="grid gap-4">
            <article
              v-for="member in formattedMembers"
              :key="member.id"
              class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]"
            >
              <div class="flex items-start gap-3">
                <Avatar size="md" :fallback="member.fallback" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-grey-900">
                    {{ member.fullName || 'Pending invite' }}
                  </p>
                  <p class="truncate text-sm text-grey-300">
                    {{ member.email }}
                  </p>
                </div>
                <StatusTag
                  :variant="member.statusVariant"
                  size="medium"
                  class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
                >
                  {{ member.statusLabel }}
                </StatusTag>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-[18px] bg-grey-55 px-4 py-3">
                  <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
                    Position
                  </p>
                  <p class="mt-1 text-sm font-semibold text-grey-900">
                    {{ member.positionLabel }}
                  </p>
                </div>
                <div class="rounded-[18px] bg-grey-55 px-4 py-3">
                  <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
                    Role
                  </p>
                  <p class="mt-1 text-sm font-semibold text-grey-900">
                    {{ member.roleLabel }}
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-6 py-14 text-center"
          >
            <p class="text-base font-semibold text-grey-900">
              {{ membersSearchActive ? 'No members match your search' : 'No members in this branch yet' }}
            </p>
            <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey-300">
              {{
                membersSearchActive
                  ? 'Try a different name, email, or keyword.'
                  : 'Invite a team member to this branch and they will appear here once invited.'
              }}
            </p>
          </div>

          <PaginationBar
            plain
            :page="memberMeta.page"
            :total-pages="memberMeta.totalPages"
            :total-items="memberMeta.total"
            :page-size="memberMeta.limit"
            :has-next-page="memberMeta.hasNextPage"
            :has-prev-page="memberMeta.hasPrevPage"
            :disabled="membersLoading"
            @change="setMembersPage"
            @page-size-change="setMembersLimit"
          />
        </div>

        <TableShell v-else class="flex flex-col">
          <TableHeader>
            <TableHeadRow :style="{ gridTemplateColumns: membersGridTemplate }">
              <TableCell>Name &amp; Email</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableHeadRow>
          </TableHeader>

          <TableSkeleton
            v-if="membersLoading"
            :columns="membersSkeletonColumns"
            :grid-template-columns="membersGridTemplate"
            :row-count="6"
          />

          <TableBody v-else-if="formattedMembers.length > 0">
            <TableRow
              v-for="member in formattedMembers"
              :key="member.id"
              :style="{ gridTemplateColumns: membersGridTemplate }"
              class="hover:bg-grey-55/35"
            >
              <TableCell class="flex items-center gap-3">
                <Avatar size="sm" :fallback="member.fallback" />
                <div class="min-w-0">
                  <p class="truncate text-base font-semibold text-grey-900">
                    {{ member.fullName || 'Pending invite' }}
                  </p>
                  <p class="truncate text-sm text-grey-300">
                    {{ member.email }}
                  </p>
                </div>
              </TableCell>

              <TableCell>
                <p class="text-sm font-medium text-grey-900">
                  {{ member.positionLabel }}
                </p>
              </TableCell>

              <TableCell>
                <p class="text-sm font-medium text-grey-900">
                  {{ member.roleLabel }}
                </p>
              </TableCell>

              <TableCell>
                <StatusTag
                  :variant="member.statusVariant"
                  size="medium"
                  class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
                >
                  {{ member.statusLabel }}
                </StatusTag>
              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else>
            <div class="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 text-center">
              <p class="text-base font-semibold text-grey-900">
                {{ membersSearchActive ? 'No members match your search' : 'No members in this branch yet' }}
              </p>
              <p class="max-w-sm text-sm leading-6 text-grey-300">
                {{
                  membersSearchActive
                    ? 'Try a different name, email, or keyword.'
                    : 'Invite a team member to this branch and they will appear here once invited.'
                }}
              </p>
            </div>
          </TableBody>

          <TableFooter>
            <PaginationBar
              :page="memberMeta.page"
              :total-pages="memberMeta.totalPages"
              :total-items="memberMeta.total"
              :page-size="memberMeta.limit"
              :has-next-page="memberMeta.hasNextPage"
              :has-prev-page="memberMeta.hasPrevPage"
              :disabled="membersLoading"
              @change="setMembersPage"
              @page-size-change="setMembersLimit"
            />
          </TableFooter>
        </TableShell>
      </section>
    </div>

    <div
      v-else
      class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-6 py-14 text-center text-sm text-grey-300"
    >
      Branch not found.
    </div>

    <BranchEditOverlay
      v-model:open="editOpen"
      :branch="branch"
      @updated="handleBranchUpdated"
    />
    <BranchDeactivateOverlay
      v-model:open="deactivateOpen"
      :branch="branch"
      @deactivated="handleBranchDeactivated"
    />
    <BranchDeleteOverlay
      v-model:open="deleteOpen"
      :branch="branch"
      @deleted="handleBranchDeleted"
    />
    <BranchInviteMemberOverlay
      v-model:open="inviteOpen"
      :branch="branch"
      :branches="allBranches"
      @invited="handleMemberInvited"
    />
  </div>
</template>
