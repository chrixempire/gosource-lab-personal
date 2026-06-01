<script setup lang="ts">
import type {
  BranchMemberRecord,
  BranchRecord,
  CustomerMeResponse,
  EmployeeInviteResponse,
} from '@gosource/api-client';
import {
  Avatar,
  Button,
  Checkbox,
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
  ViewToggle,
  toast,
} from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import BranchInviteMemberOverlay from '~/components/branches/BranchInviteMemberOverlay.vue';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import AddIcon from '~/components/icons/AddIcon.vue';
import MemberActionsMenu from '~/components/members/MemberActionsMenu.vue';
import MemberConfirmOverlay from '~/components/members/MemberConfirmOverlay.vue';
import MemberDetailsOverlay from '~/components/members/MemberDetailsOverlay.vue';
import MemberEditOverlay from '~/components/members/MemberEditOverlay.vue';
import MemberResendInviteOverlay from '~/components/members/MemberResendInviteOverlay.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { usePageBranchFilter } from '~/composables/usePageBranchFilter';
import {
  CUSTOMER_TABLE_BODY_CLASS,
  CUSTOMER_TABLE_PANEL_CLASS,
  CUSTOMER_TABLE_STICKY_HEADER_CLASS,
} from '~/lib/customer-table-layout';
import {
  ALL_BRANCHES_VALUE,
  branchFilterFromQueryParam,
} from '~/lib/branch-picker';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useCustomerEmployeeService } from '~/services/employee.service';

const runWhenSessionReady = useAuthenticatedFetch();

const route = useRoute();
const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isEmployeeSession = computed(() => session.value?.user_type === 'employee');

/** Employees are scoped to one branch; branch switching is not allowed. */
const employeeBranchId = computed(() => {
  const s = session.value;
  if (s?.user_type !== 'employee' || !s.data) {
    return '';
  }
  const data = s.data;
  return 'branchId' in data && typeof data.branchId === 'string' ? data.branchId : '';
});

const pageBranch = usePageBranchFilter();
const {
  viewBranchId: selectedBranchId,
  apiBranchId,
  branches,
  branchesLoading,
  setPageBranchFilter,
  ensureBranchesLoaded,
  activeBranchId,
} = pageBranch;
const {
  listBranchMembers,
  cancelEmployeeInvite,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
} = useCustomerEmployeeService();
const {
  effectiveView,
  routeView,
  isCompactViewport,
  page,
  limit,
  setPage,
  setLimit,
  setView,
} = useCollectionRouteState('table');

const searchValue = ref('');
const debouncedSearch = ref('');
const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 120);

watch(searchValue, (value) => {
  syncSearch(value);
});

const membersLoading = ref(true);
const memberRows = ref<BranchMemberRecord[]>([]);
const meta = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

const membersGridTemplate = computed(() =>
  isEmployeeSession.value
    ? 'minmax(0,2fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,0.85fr) minmax(0,0.85fr)'
    : '44px minmax(0,2fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,0.85fr) minmax(0,0.85fr) minmax(0,3.25rem)',
);

const membersSkeletonColumns = computed(() => [
  ...(isEmployeeSession.value ? [] : [{ kind: 'checkbox' as const }]),
  { kind: 'stack' as const, avatar: true, lineClass: 'w-full', sublineClass: 'w-4/5' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  ...(isEmployeeSession.value ? [] : [{ kind: 'action' as const }]),
]);

const selectedMemberIds = ref<string[]>([]);

const allMembersSelected = computed(
  () =>
    memberRows.value.length > 0
    && memberRows.value.every((member) => selectedMemberIds.value.includes(member.id)),
);

const memberSelectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedMemberIds.value.length === 0) {
    return false;
  }
  if (allMembersSelected.value) {
    return true;
  }
  return 'indeterminate';
});

function toggleAllMembers() {
  if (allMembersSelected.value) {
    selectedMemberIds.value = [];
    return;
  }
  selectedMemberIds.value = memberRows.value.map((member) => member.id);
}

function toggleMemberSelection(memberId: string) {
  if (selectedMemberIds.value.includes(memberId)) {
    selectedMemberIds.value = selectedMemberIds.value.filter((id) => id !== memberId);
    return;
  }
  selectedMemberIds.value = [...selectedMemberIds.value, memberId];
}

watch(
  () => memberRows.value.map((member) => member.id),
  (ids) => {
    selectedMemberIds.value = selectedMemberIds.value.filter((id) => ids.includes(id));
  },
);

const inviteOpen = ref(false);
const resendInviteOpen = ref(false);
const resendInvitationId = ref('');
const resendInitialEmail = ref('');
const resendInitialRole = ref('');
const resendMode = ref<'resend' | 'refresh'>('resend');
const detailsOpen = ref(false);
const detailsEmployeeId = ref<string | null>(null);
const editOpen = ref(false);
const editEmployeeId = ref<string | null>(null);

const confirmOpen = ref(false);
const confirmTitle = ref('');
const confirmDescription = ref('');
const confirmMessage = ref('');
const confirmLabel = ref('');
const confirmDestructive = ref(true);
const confirmLoading = ref(false);
let confirmAction: (() => Promise<void>) | null = null;

const membersSearchActive = computed(() => debouncedSearch.value.trim().length > 0);

/** Branch list and/or member rows loading — drives skeletons like `loading` on the branches page. */
const membersListLoading = computed(() => branchesLoading.value || membersLoading.value);

const selectedBranch = computed(
  () => branches.value.find((branch) => branch.id === selectedBranchId.value) ?? null,
);

function resolveBranchId(branch: BranchRecord & { _id?: string }) {
  const fromId = typeof branch.id === 'string' ? branch.id.trim() : '';
  if (fromId) {
    return fromId;
  }

  const raw = branch._id;
  if (typeof raw === 'string') {
    return raw.trim();
  }

  if (raw != null) {
    const next = String(raw).trim();
    if (next && next !== '[object Object]') {
      return next;
    }
  }

  return '';
}

function normalizeBranches(rows: BranchRecord[]) {
  return rows.map((branch) => {
    const id = resolveBranchId(branch as BranchRecord & { _id?: string });
    return id && id !== branch.id ? { ...branch, id } : branch;
  });
}

function resolveMembersBranchId(nextBranches: BranchRecord[]): string {
  const branchIds = nextBranches.map((branch) => branch.id);

  if (isEmployeeSession.value && employeeBranchId.value && branchIds.includes(employeeBranchId.value)) {
    return employeeBranchId.value;
  }

  const fromRoute = branchFilterFromQueryParam(route.query.branchId);
  if (fromRoute !== null && fromRoute !== ALL_BRANCHES_VALUE && branchIds.includes(fromRoute)) {
    return fromRoute;
  }

  const fromView = apiBranchId.value
    ?? (selectedBranchId.value !== ALL_BRANCHES_VALUE ? selectedBranchId.value : '');
  if (fromView && branchIds.includes(fromView)) {
    return fromView;
  }

  const activeId = activeBranchId.value;
  if (activeId && branchIds.includes(activeId)) {
    return activeId;
  }

  return nextBranches.find((branch) => branch.isHeadquarter)?.id ?? nextBranches[0]?.id ?? '';
}

async function fetchMembers() {
  await refreshMembersPayload();
}

const defaultMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const { data: membersPayload, pending: membersPayloadPending, refresh: refreshMembersPayload } =
  await useAuthenticatedAsyncData(
    'members-index',
    async () => {
      await ensureBranchesLoaded();
      const nextBranches = normalizeBranches(branches.value ?? []);
      const resolvedBranchId = resolveMembersBranchId(nextBranches);

      if (!resolvedBranchId) {
        return {
          members: [] as BranchMemberRecord[],
          meta: { ...defaultMeta },
        };
      }

      const membersResponse = await runWhenSessionReady(() =>
        listBranchMembers(resolvedBranchId, {
          page: page.value,
          limit: limit.value,
          search: debouncedSearch.value.trim() || undefined,
        }),
      );

      return {
        members: Array.isArray(membersResponse.data) ? membersResponse.data : ([] as BranchMemberRecord[]),
        meta: membersResponse.meta ?? { ...defaultMeta },
      };
    },
    {
      watch: [page, limit, debouncedSearch, apiBranchId, () => route.query.branchId],
      default: () => ({
        members: [] as BranchMemberRecord[],
        meta: { ...defaultMeta },
      }),
    },
  );

watch(
  membersPayload,
  (payload) => {
    if (!payload) {
      return;
    }

    memberRows.value = Array.isArray(payload.members) ? payload.members : [];
    meta.value = payload.meta ?? { ...defaultMeta };
  },
  { immediate: true },
);

watch(
  membersPayloadPending,
  (pending) => {
    membersLoading.value = pending;
  },
  { immediate: true },
);

watch(
  [page, limit, debouncedSearch, selectedBranchId],
  () => {
    selectedMemberIds.value = [];
  },
);

watch(debouncedSearch, () => {
  setPage(1);
});

function statusTagVariant(member: BranchMemberRecord) {
  if (member.kind === 'invite' || member.status === 'pending') {
    return 'warning' as const;
  }
  if (member.kind === 'member' && member.status === 'inactive') {
    return 'negative' as const;
  }
  return 'success' as const;
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
      member.kind === 'invite'
        ? 'Pending'
        : member.status === 'inactive'
          ? 'Inactive'
          : member.status === 'pending'
            ? 'Pending'
            : 'Active';

    return {
      ...member,
      fullName,
      fallback,
      branchLabel: selectedBranch.value?.branchName ?? '—',
      positionLabel: member.kind === 'invite' ? 'Pending invite' : member.position || 'Not set',
      roleLabel: member.role.charAt(0).toUpperCase() + member.role.slice(1),
      statusLabel,
      statusVariant: statusTagVariant(member),
    };
  }),
);

function handleMemberInvited(_invite: EmployeeInviteResponse['data']) {
  void fetchMembers();
}

function openInvite() {
  if (selectedBranch.value) {
    inviteOpen.value = true;
  }
}

function memberDisplayName(member: BranchMemberRecord) {
  const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return fullName || member.email;
}

function openMemberDetails(member: BranchMemberRecord) {
  if (member.kind !== 'member') {
    return;
  }
  detailsEmployeeId.value = member.id;
  detailsOpen.value = true;
}

/** Open details from a row or card for full members (invites stay non-interactive for open). */
function onMemberRowActivate(member: BranchMemberRecord) {
  if (member.kind !== 'member') {
    return;
  }
  openMemberDetails(member);
}

function tableRowClass(member: BranchMemberRecord) {
  if (member.kind === 'member') {
    return 'cursor-pointer transition-colors hover:bg-primary-50/55 active:bg-primary-50/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500/35';
  }
  return 'cursor-default transition-colors hover:bg-grey-55/30';
}

function openMemberEdit(member: BranchMemberRecord) {
  if (member.kind !== 'member') {
    return;
  }
  editEmployeeId.value = member.id;
  editOpen.value = true;
}

function openConfirm(opts: {
  title: string;
  description?: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => Promise<void>;
}) {
  confirmTitle.value = opts.title;
  confirmDescription.value = opts.description ?? '';
  confirmMessage.value = opts.message;
  confirmLabel.value = opts.confirmLabel;
  confirmDestructive.value = opts.destructive !== false;
  confirmAction = opts.action;
  confirmOpen.value = true;
}

function closeConfirm() {
  confirmOpen.value = false;
  confirmAction = null;
  confirmLoading.value = false;
}

function onConfirmOverlayOpen(value: boolean) {
  confirmOpen.value = value;
  if (!value) {
    confirmAction = null;
  }
}

async function handleConfirm() {
  if (!confirmAction) {
    return;
  }
  confirmLoading.value = true;
  try {
    await confirmAction();
    closeConfirm();
    await fetchMembers();
    toast.success('Changes saved');
  } catch {
    // API services already surface errors via toast
  } finally {
    confirmLoading.value = false;
  }
}

function confirmDeactivateMember(member: BranchMemberRecord) {
  const label = memberDisplayName(member);
  openConfirm({
    title: 'Deactivate member',
    description: 'They will lose access until reactivated.',
    message: `Deactivate ${label}? They can no longer sign in until you activate them again.`,
    confirmLabel: 'Deactivate',
    destructive: true,
    action: async () => {
      await deactivateEmployee(member.id);
    },
  });
}

function confirmReactivateMember(member: BranchMemberRecord) {
  const label = memberDisplayName(member);
  openConfirm({
    title: 'Activate member',
    message: `Restore access for ${label}?`,
    confirmLabel: 'Activate',
    destructive: false,
    action: async () => {
      await reactivateEmployee(member.id);
    },
  });
}

function confirmDeleteMember(member: BranchMemberRecord) {
  const label = memberDisplayName(member);
  openConfirm({
    title: 'Delete member',
    description: 'This cannot be undone.',
    message: `Permanently remove ${label} from your team? Their account and sessions will be deleted.`,
    confirmLabel: 'Delete member',
    destructive: true,
    action: async () => {
      await deleteEmployee(member.id);
    },
  });
}

function confirmCancelInvite(member: BranchMemberRecord) {
  openConfirm({
    title: 'Delete invite',
    description: 'The pending invitation will be removed.',
    message: `Remove the invite sent to ${member.email}?`,
    confirmLabel: 'Delete invite',
    destructive: true,
    action: async () => {
      await cancelEmployeeInvite(member.id);
    },
  });
}

function openResendInvite(member: BranchMemberRecord) {
  resendMode.value = 'resend';
  resendInvitationId.value = member.id;
  resendInitialEmail.value = member.email;
  resendInitialRole.value = member.role;
  resendInviteOpen.value = true;
}

function openRefreshInviteLink(member: BranchMemberRecord) {
  resendMode.value = 'refresh';
  resendInvitationId.value = member.id;
  resendInitialEmail.value = member.email;
  resendInitialRole.value = member.role;
  resendInviteOpen.value = true;
}

const cardArticleBaseClass =
  'max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-[background-color,box-shadow,border-color] duration-150';

function cardArticleClass(member: BranchMemberRecord) {
  if (member.kind === 'member') {
    return `${cardArticleBaseClass} cursor-pointer hover:border-primary-100 hover:bg-primary-50/50 hover:shadow-[0_22px_48px_-28px_rgba(16,24,40,0.2)] active:bg-primary-50/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500/35`;
  }
  return `${cardArticleBaseClass} cursor-default hover:border-grey-100 hover:bg-grey-55/20`;
}
</script>

<template>
  <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-2 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between">
        <div class="w-full min-[1000px]:max-w-md space-y-2">
          <BranchPickerDropdown
            v-if="!isEmployeeSession"
            :model-value="selectedBranchId"
            :branches="branches"
            :loading="branchesLoading"
            @update:model-value="(id) => setPageBranchFilter(id, { resetPage: true })"
          />

          <div
            v-else
            class="rounded-[12px] border border-grey-50 bg-grey-55/50 px-4 py-3"
          >
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-grey-300">
              Branch
            </p>
            <p class="mt-1 truncate text-sm font-semibold text-grey-900">
              <template v-if="branchesLoading">
                …
              </template>
              <template v-else-if="selectedBranch">
                {{ selectedBranch.branchName }}
                <span v-if="selectedBranch.branchCode" class="font-normal text-grey-300">
                  · {{ selectedBranch.branchCode }}
                </span>
              </template>
              <template v-else>
                {{ employeeBranchId ? 'Your branch' : '—' }}
              </template>
            </p>
          </div>

          <SearchField
            v-model="searchValue"
            placeholder="Search by name, email, role, or position"
            :disabled="membersListLoading"
          />
        </div>

        <div
          class="flex items-center gap-2"
          :class="membersListLoading ? 'pointer-events-none opacity-50' : undefined"
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
            :disabled="!selectedBranch || membersListLoading"
            @click="openInvite"
          >
            Invite members
          </Button>
        </div>
      </div>

      <TableShell
        v-if="effectiveView === 'table'"
        :class="[CUSTOMER_TABLE_PANEL_CLASS, 'overflow-visible']"
      >
        <TableHeader :class="CUSTOMER_TABLE_STICKY_HEADER_CLASS">
          <TableHeadRow
            :style="{ gridTemplateColumns: membersGridTemplate }"
            :class="membersListLoading ? 'pointer-events-none opacity-60' : undefined"
          >
            <TableCell v-if="!isEmployeeSession" class="flex items-center justify-center">
              <Checkbox
                :model-value="memberSelectionState"
                :disabled="membersListLoading"
                aria-label="Select all members"
                @update:model-value="toggleAllMembers"
              />
            </TableCell>
            <TableCell>Name &amp; Email</TableCell>
            <TableCell>Branch</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell v-if="!isEmployeeSession" class="text-right">
              Actions
            </TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableSkeleton
          v-if="membersListLoading"
          :columns="membersSkeletonColumns"
          :grid-template-columns="membersGridTemplate"
          :row-count="10"
          :body-class="CUSTOMER_TABLE_BODY_CLASS"
        />

        <TableBody
          v-else-if="formattedMembers.length > 0"
          :class="CUSTOMER_TABLE_BODY_CLASS"
        >
          <TableRow
            v-for="member in formattedMembers"
            :key="member.id"
            :style="{ gridTemplateColumns: membersGridTemplate }"
            :class="tableRowClass(member)"
            :role="member.kind === 'member' ? 'button' : undefined"
            :tabindex="member.kind === 'member' ? 0 : undefined"
            @click="onMemberRowActivate(member)"
            @keydown.enter="onMemberRowActivate(member)"
            @keydown.space.prevent="onMemberRowActivate(member)"
          >
            <TableCell v-if="!isEmployeeSession" class="flex items-center justify-center">
              <Checkbox
                :model-value="selectedMemberIds.includes(member.id)"
                :aria-label="`Select ${member.fullName || member.email}`"
                @update:model-value="toggleMemberSelection(member.id)"
                @click.stop
              />
            </TableCell>

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
              <p class="truncate text-sm font-medium text-grey-900">
                {{ member.branchLabel }}
              </p>
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

            <TableCell v-if="!isEmployeeSession" class="flex justify-end">
              <MemberActionsMenu
                :member="member"
                @view-details="openMemberDetails(member)"
                @edit="openMemberEdit(member)"
                @deactivate="confirmDeactivateMember(member)"
                @activate="confirmReactivateMember(member)"
                @delete-member="confirmDeleteMember(member)"
                @delete-invite="confirmCancelInvite(member)"
                @resend-invite="openResendInvite(member)"
                @refresh-invite="openRefreshInviteLink(member)"
              />
            </TableCell>
          </TableRow>
        </TableBody>

        <TableBody v-else :class="CUSTOMER_TABLE_BODY_CLASS">
          <div class="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 text-center">
            <p class="text-base font-semibold text-grey-900">
              {{
                !selectedBranchId && !isEmployeeSession
                  ? 'Select a branch to view members'
                  : membersSearchActive
                    ? 'No members match your search'
                    : 'No members in this branch yet'
              }}
            </p>
            <p class="max-w-sm text-sm leading-6 text-grey-300">
              {{
                !selectedBranchId && !isEmployeeSession
                  ? 'Create a branch first, then pick it from the list above.'
                  : membersSearchActive
                    ? 'Try a different name, email, or keyword.'
                    : 'Invite a team member and they will appear here once invited.'
              }}
            </p>
          </div>
        </TableBody>

        <TableFooter>
          <PaginationBar
            :page="meta.page"
            :total-pages="meta.totalPages"
            :total-items="meta.total"
            :page-size="meta.limit"
            :has-next-page="meta.hasNextPage"
            :has-prev-page="meta.hasPrevPage"
            :disabled="membersListLoading"
            @change="setPage"
            @page-size-change="setLimit"
          />
        </TableFooter>
      </TableShell>

      <div v-else-if="!membersListLoading" class="space-y-2">
        <div v-if="formattedMembers.length > 0" class="flex flex-wrap gap-4">
          <article
            v-for="member in formattedMembers"
            :key="member.id"
            :class="cardArticleClass(member)"
            :role="member.kind === 'member' ? 'button' : undefined"
            :tabindex="member.kind === 'member' ? 0 : undefined"
            @click="onMemberRowActivate(member)"
            @keydown.enter="onMemberRowActivate(member)"
            @keydown.space.prevent="onMemberRowActivate(member)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 flex-1 items-start gap-3">
                <Avatar size="md" :fallback="member.fallback" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-base font-semibold text-grey-900">
                    {{ member.fullName || 'Pending invite' }}
                  </p>
                  <p class="truncate text-sm text-grey-300">
                    {{ member.email }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 items-start gap-2">
                <StatusTag
                  :variant="member.statusVariant"
                  size="medium"
                  class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
                >
                  {{ member.statusLabel }}
                </StatusTag>
                <MemberActionsMenu
                  v-if="!isEmployeeSession"
                  :member="member"
                  @view-details="openMemberDetails(member)"
                  @edit="openMemberEdit(member)"
                  @deactivate="confirmDeactivateMember(member)"
                  @activate="confirmReactivateMember(member)"
                  @delete-member="confirmDeleteMember(member)"
                  @delete-invite="confirmCancelInvite(member)"
                  @resend-invite="openResendInvite(member)"
                  @refresh-invite="openRefreshInviteLink(member)"
                />
              </div>
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
            {{
              !selectedBranchId && !isEmployeeSession
                ? 'Select a branch to view members'
                : membersSearchActive
                  ? 'No members match your search'
                  : 'No members in this branch yet'
            }}
          </p>
          <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey-300">
            {{
              !selectedBranchId && !isEmployeeSession
                ? 'Create a branch first, then pick it from the list above.'
                : membersSearchActive
                  ? 'Try a different name, email, or keyword.'
                  : 'Invite a team member and they will appear here once invited.'
            }}
          </p>
        </div>

        <PaginationBar
          plain
          :page="meta.page"
          :total-pages="meta.totalPages"
          :total-items="meta.total"
          :page-size="meta.limit"
          :has-next-page="meta.hasNextPage"
          :has-prev-page="meta.hasPrevPage"
          :disabled="membersListLoading"
          @change="setPage"
          @page-size-change="setLimit"
        />
      </div>

      <div v-else class="flex flex-wrap gap-4">
        <div
          v-for="index in 4"
          :key="index"
          class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <div class="size-10 shrink-0 animate-pulse rounded-full bg-grey-55" />
              <div class="min-w-0 flex-1 space-y-2 pt-0.5">
                <div class="h-5 max-w-[11rem] animate-pulse rounded-md bg-grey-55" />
                <div class="h-3.5 w-full max-w-[20rem] animate-pulse rounded-md bg-grey-55" />
              </div>
            </div>
            <div class="flex shrink-0 items-start gap-2">
              <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
              <div
                v-if="!isEmployeeSession"
                class="size-9 shrink-0 animate-pulse rounded-full border border-grey-50 bg-grey-55"
              />
            </div>
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

    <BranchInviteMemberOverlay
      v-model:open="inviteOpen"
      :branch="selectedBranch"
      :branches="branches"
      @invited="handleMemberInvited"
    />

    <MemberDetailsOverlay
      v-model:open="detailsOpen"
      :employee-id="detailsEmployeeId"
    />

    <MemberEditOverlay
      v-model:open="editOpen"
      :employee-id="editEmployeeId"
      :branches="branches"
      @saved="fetchMembers"
    />

    <MemberResendInviteOverlay
      v-model:open="resendInviteOpen"
      :invitation-id="resendInvitationId"
      :initial-email="resendInitialEmail"
      :initial-role="resendInitialRole"
      :mode="resendMode"
      @resent="fetchMembers"
    />

    <MemberConfirmOverlay
      :open="confirmOpen"
      :title="confirmTitle"
      :description="confirmDescription || undefined"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :destructive="confirmDestructive"
      :loading="confirmLoading"
      @update:open="onConfirmOverlayOpen"
      @confirm="handleConfirm"
    />
  </div>
</template>
