<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { BranchRecord, RequestRecord } from '@gosource/api-client';
import {
  Button,
  ViewToggle,
  toast,
} from '@gosource/ui';
import { useDebounceFn } from '@vueuse/core';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import MemberConfirmOverlay from '~/components/members/MemberConfirmOverlay.vue';
import RequestActionsMenu from '~/components/requests/RequestActionsMenu.vue';
import type { RequestListItem } from '~/components/requests/RequestCards.vue';
import RequestDetailsPanel from '~/components/requests/RequestDetailsPanel.vue';
import RequestDetailsSlidePanel from '~/components/requests/RequestDetailsSlidePanel.vue';
import RequestRejectOverlay from '~/components/requests/RequestRejectOverlay.vue';
import RequestBranchSetupBanner from '~/components/requests/RequestBranchSetupBanner.vue';
import RequestFilterBar from '~/components/requests/RequestFilterBar.vue';
import RequestTable from '~/components/requests/RequestTable.vue';
import SearchField from '~/components/shared/collection/SearchField.vue';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  buildRequestDetailsView,
  formatRequestCurrency,
  mapRequestToListItem,
} from '~/lib/request-details';
import {
  memberCanViewRequest,
  requestCanEditProducts,
  requestCanReopenRejected,
  resolveCurrentActorId,
} from '~/lib/request-edit';
import { useRequestEdit } from '~/composables/useRequestEdit';
import { useCustomerListReturn } from '~/composables/useCustomerListReturn';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { usePageBranchFilter } from '~/composables/usePageBranchFilter';
import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';
import { usePaginatedListData } from '~/composables/usePaginatedListData';
import { useCustomerRequestService } from '~/services/request.service';
import {
  parseRequestFiltersFromQuery,
  requestFiltersToRouteQuery,
  requestMatchesListFilters,
  requestStatusFiltersToApiParam,
  type RequestListFilters,
} from '~/lib/request-list-filters';

const { session, whenReady } = useCustomerSession();
const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));
const currentActorId = computed(() => {
  const data = session.value?.data;
  return data && typeof data === 'object' && 'id' in data ? String(data.id) : '';
});
const employeeBranchId = computed(() => {
  const data = session.value?.data;
  if (!isEmployeeSession.value || !data || typeof data !== 'object' || !('branchId' in data)) {
    return '';
  }
  return String(data.branchId ?? '');
});

const { hasBranch, fetchBranchesInBackground } = useMarketBranchGate();
const { clearDismissalForSession } = useMarketBranchSetupDismissal();
const { listBranches } = useCustomerBranchService();
const { listRequests, getRequest, cancelRequest, rejectRequest } = useCustomerRequestService();
const {
  setActiveRequest,
  clearActiveRequest,
  editDraft,
  beginProductEdit,
  cancelProductEdit,
  saveProductEdit,
  updateDraftLineQuantity,
  removeDraftLineLocal,
  reopenRejected,
  lineMutationLoading,
} = useRequestEdit();
const route = useRoute();
const router = useRouter();
const { rememberManageRequestsListPath } = useCustomerListReturn();

watch(
  () => route.fullPath,
  () => rememberManageRequestsListPath(route),
  { immediate: true },
);
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

const defaultMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const listFilters = computed(() => parseRequestFiltersFromQuery(route.query));

const pageBranch = usePageBranchFilter();
const {
  viewBranchId: selectedBranchId,
  apiBranchId,
  branches,
  branchesLoading: pageBranchesLoading,
  showAllBranchesOption,
  setPageBranchFilter,
} = pageBranch;
const searchValue = ref('');
const debouncedSearch = ref('');
const requests = ref<RequestRecord[]>([]);
const meta = ref({ ...defaultMeta });

const detailsOpen = ref(false);
const detailsLoading = ref(false);
const selectedRequest = ref<RequestRecord | null>(null);
const isEditingProducts = ref(false);
const rejectOpen = ref(false);
const rejectLoading = ref(false);
const rejectReason = ref('');

const confirmOpen = ref(false);
const confirmTitle = ref('');
const confirmDescription = ref('');
const confirmMessage = ref('');
const confirmLabel = ref('');
const confirmDestructive = ref(true);
const confirmLoading = ref(false);
let confirmAction: (() => Promise<void>) | null = null;

const syncSearch = useDebounceFn((value: string) => {
  debouncedSearch.value = value;
}, 120);

watch(searchValue, (value) => {
  syncSearch(value);
});

watch(debouncedSearch, (next, prev) => {
  if (next !== prev && page.value !== 1) {
    setPage(1);
  }
});

watch(employeeBranchId, (next) => {
  if (isEmployeeSession.value && next && selectedBranchId.value !== next) {
    selectedBranchId.value = next;
  }
});

const requestsListKeyParts = computed(() => [
  page.value,
  limit.value,
  debouncedSearch.value,
  listFilters.value.amountMin ?? '',
  listFilters.value.amountMax ?? '',
  listFilters.value.status.join(','),
  apiBranchId.value ?? '',
]);

const {
  data: requestsPagePayload,
  pending: requestsLoading,
  status: requestsFetchStatus,
  refresh: refreshRequestsData,
} = await usePaginatedListData(
  'manage-requests-index',
  requestsListKeyParts,
  async () => {
    const branchesResponse = await listBranches({ page: 1, limit: 100 });
    const branchRows = branchesResponse.data ?? [];

    if (!isEmployeeSession.value && branchRows.length === 0) {
      return {
        branches: [],
        requests: [] as RequestRecord[],
        meta: { ...defaultMeta },
      };
    }

    const requestedBranchId = !isEmployeeSession.value ? apiBranchId.value?.trim() : '';
    const scopedBranchId =
      requestedBranchId
      && (branchRows.length === 0 || branchRows.some((branch) => branch.id === requestedBranchId))
        ? requestedBranchId
        : undefined;

    const requestsResponse = await listRequests({
      page: page.value,
      limit: limit.value,
      search: debouncedSearch.value.trim() || undefined,
      status: requestStatusFiltersToApiParam(listFilters.value.status),
      branchId: scopedBranchId,
      amountFrom: listFilters.value.amountMin ?? undefined,
      amountTo: listFilters.value.amountMax ?? undefined,
    });

    const rows = requestsResponse.data ?? [];

    return {
      branches: branchRows,
      requests: isSuperAdmin.value
        ? rows
        : rows.filter((request) => request.initiator.accountId === currentActorId.value),
      meta: requestsResponse.meta ?? { ...defaultMeta },
    };
  },
  {
    default: () => ({
      branches: [] as BranchRecord[],
      requests: [] as RequestRecord[],
      meta: { ...defaultMeta },
    }),
  },
  );

const hasFinishedInitialFetch = computed(
  () => requestsFetchStatus.value === 'success' || requestsFetchStatus.value === 'error',
);

watch(hasBranch, (next, prev) => {
  if (next && !prev) {
    clearDismissalForSession();
    void fetchBranchesInBackground(true);
    void refreshRequestsData();
  }
});

onMounted(() => {
  if (!isEmployeeSession.value) {
    void fetchBranchesInBackground();
  }
});

const branchesLoading = computed(
  () =>
    pageBranchesLoading.value
    || (requestsLoading.value && (!Array.isArray(branches.value) || branches.value.length === 0)),
);

watch(
  requestsPagePayload,
  (payload) => {
    if (!payload) {
      return;
    }

    requests.value = Array.isArray(payload.requests) ? payload.requests : [];
    meta.value = payload.meta ?? { ...defaultMeta };
  },
  { immediate: true },
);

async function openRequestFromQuery() {
  const raw = route.query.open;
  const requestId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  if (!requestId) {
    return;
  }

  await openRequestDetails(requestId);

  const nextQuery = { ...route.query };
  delete nextQuery.open;
  await router.replace({
    path: route.path,
    query: Object.keys(nextQuery).length ? nextQuery : undefined,
  });
}

watch(
  () => route.query.open,
  () => {
    void openRequestFromQuery();
  },
);

onMounted(async () => {
  await openRequestFromQuery();
});

const requestItems = computed<RequestListItem[]>(() =>
  requests.value.map(mapRequestToListItem),
);

/** Owner with zero branches after the first list fetch — show setup banner + empty table. */
const showNoBranchSetup = computed(
  () => isSuperAdmin.value && hasFinishedInitialFetch.value && branches.value.length === 0,
);

const tableRequests = computed(() => (showNoBranchSetup.value ? [] : requestItems.value));

const tableLoading = computed(
  () => requestsLoading.value || branchesLoading.value || showNoBranchSetup.value,
);

const tableEmptyMessage = computed(() =>
  showNoBranchSetup.value
    ? 'Create a branch to start managing order requests here.'
    : 'No requests found for the current filters.',
);

function replaceListFilters(next: Partial<RequestListFilters>) {
  const merged: RequestListFilters = {
    ...listFilters.value,
    ...next,
  };

  const filterQuery = requestFiltersToRouteQuery(merged);
  const nextQuery = { ...route.query, ...filterQuery, page: '1' } as Record<
    string,
    string | string[] | undefined
  >;

  if (!filterQuery.amountFrom) {
    delete nextQuery.amountFrom;
  }
  if (!filterQuery.amountTo) {
    delete nextQuery.amountTo;
  }

  router.replace({ query: nextQuery });
}

function onApplyRequestFilters(next: Partial<RequestListFilters>) {
  replaceListFilters(next);
}

function clearAllRequestFilters() {
  searchValue.value = '';
  debouncedSearch.value = '';
  pageBranch.resetViewToActiveBranch();

  const { amountFrom, amountTo, status, ...rest } = route.query;
  router.replace({
    query: {
      ...rest,
      page: '1',
    },
  });
}

async function navigateToRequestDetails(
  requestId: string,
  options?: { edit?: boolean },
) {
  if (!requestId) {
    return;
  }

  if (!isSuperAdmin.value) {
    await openRequestDetails(requestId, options);
    return;
  }

  const query: Record<string, string> = {};
  if (options?.edit) {
    query.edit = '1';
  }

  await navigateTo({
    path: `/manage-requests/${requestId}`,
    query: Object.keys(query).length ? query : undefined,
  });
}

async function openRequestDetails(
  requestId: string,
  options?: { edit?: boolean },
) {
  if (!requestId) {
    return;
  }

  if (import.meta.client) {
    await whenReady();
  }

  const activeSession = session.value;
  if (!activeSession) {
    return;
  }

  const cached = requests.value.find((item) => item.id === requestId);
  if (cached && !memberCanViewRequest(activeSession, cached)) {
    toast.error('You do not have access to this request.');
    return;
  }

  detailsOpen.value = true;
  isEditingProducts.value = Boolean(options?.edit);
  detailsLoading.value = true;
  selectedRequest.value = cached ?? null;
  if (cached) {
    setActiveRequest(cached);
    if (options?.edit) {
      beginProductEdit(cached);
    }
  }

  try {
    const response = await getRequest(requestId);
    if (response.data) {
      if (!memberCanViewRequest(activeSession, response.data)) {
        toast.error('You do not have access to this request.');
        closeDetails();
        return;
      }

      selectedRequest.value = response.data;
      setActiveRequest(response.data);
      if (isEditingProducts.value) {
        beginProductEdit(response.data);
      }
    }
  } finally {
    detailsLoading.value = false;
  }
}

function closeDetails() {
  detailsOpen.value = false;
  isEditingProducts.value = false;
  cancelProductEdit();
  selectedRequest.value = null;
  clearActiveRequest();
  detailsLoading.value = false;
}

function selectRequestForAction(request: RequestListItem) {
  const record = requestRecordForListItem(request);
  if (record) {
    selectedRequest.value = record;
    setActiveRequest(record);
  }
}

const displayRequest = computed(() => {
  if (isEditingProducts.value && editDraft.value) {
    return editDraft.value;
  }

  return selectedRequest.value;
});

const requestDetailsView = computed(() =>
  displayRequest.value ? buildRequestDetailsView(displayRequest.value) : null,
);

const showRequestDetailsSkeleton = computed(
  () => detailsLoading.value && !selectedRequest.value,
);

const isRequestDetailsRefreshing = computed(
  () => detailsLoading.value && !!selectedRequest.value,
);

const canCancel = computed(() => {
  if (!selectedRequest.value || selectedRequest.value.status !== 'pending') {
    return false;
  }

  if (isSuperAdmin.value) {
    return true;
  }

  return selectedRequest.value.initiator.accountId === resolveCurrentActorId(session.value);
});

const canEditProducts = computed(() =>
  requestCanEditProducts(selectedRequest.value, session.value),
);

const canAddMoreItems = computed(() => canEditProducts.value);

const productsEditable = computed(() => canEditProducts.value && isEditingProducts.value);

function startEditingProducts() {
  if (selectedRequest.value) {
    beginProductEdit(selectedRequest.value);
  }

  isEditingProducts.value = true;
}

async function finishEditingProducts(save: boolean) {
  if (save && selectedRequest.value) {
    const next = await saveProductEdit(selectedRequest.value.id);
    if (next) {
      syncRequestInList(next);
    }
  } else {
    cancelProductEdit();
  }

  isEditingProducts.value = false;
}

function syncRequestInList(next: RequestRecord) {
  const matches = requestMatchesListFilters(next, listFilters.value, {
    branchId: apiBranchId.value,
  });
  const index = requests.value.findIndex((item) => item.id === next.id);

  if (!matches) {
    if (index >= 0) {
      requests.value = requests.value.filter((item) => item.id !== next.id);
      const total = Math.max(0, meta.value.total - 1);
      const totalPages = Math.max(1, Math.ceil(total / meta.value.limit) || 1);
      meta.value = {
        ...meta.value,
        total,
        totalPages,
        hasNextPage: meta.value.page < totalPages,
        hasPrevPage: meta.value.page > 1,
      };
    }
  } else if (index >= 0) {
    requests.value = requests.value.map((item) => (item.id === next.id ? next : item));
  }

  if (selectedRequest.value?.id === next.id) {
    selectedRequest.value = next;
    setActiveRequest(next);
  }
}

function handleProductQuantityChange(cartLineId: string, quantity: number) {
  updateDraftLineQuantity(cartLineId, quantity);
}

function handleProductRemove(cartLineId: string) {
  removeDraftLineLocal(cartLineId);
}

const { startAddMoreToRequest } = useRequestAddItemsMode();

async function handleAddMoreItems() {
  const record = selectedRequest.value;
  if (!record) {
    return;
  }

  await startAddMoreToRequest(record);
}

function openConfirm(options: {
  title: string;
  description?: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => Promise<void>;
}) {
  confirmTitle.value = options.title;
  confirmDescription.value = options.description ?? '';
  confirmMessage.value = options.message;
  confirmLabel.value = options.confirmLabel;
  confirmDestructive.value = options.destructive ?? true;
  confirmAction = options.action;
  confirmOpen.value = true;
}

async function runConfirmAction() {
  if (!confirmAction) {
    return;
  }

  confirmLoading.value = true;
  try {
    await confirmAction();
    confirmOpen.value = false;
  } finally {
    confirmLoading.value = false;
  }
}

function handleCancel() {
  if (!selectedRequest.value) {
    return;
  }

  openConfirm({
    title: 'Cancel request',
    description: 'This request will no longer be actionable.',
    message: `Cancel request ${selectedRequest.value.reference}?`,
    confirmLabel: 'Cancel request',
    action: async () => {
      const response = await cancelRequest(selectedRequest.value!.id);
      if (response.data) {
        syncRequestInList(response.data);
        closeDetails();
      }
    },
  });
}

function requestRecordForListItem(request: RequestListItem) {
  return requests.value.find((item) => item.id === request.id) ?? null;
}

function handleRequestClick(request: RequestListItem) {
  if (!request.id) {
    return;
  }

  void navigateToRequestDetails(request.id);
}

function rowCanApproveReject(request: RequestListItem) {
  return isSuperAdmin.value && request.status === 'pending';
}

function rowCanCheckout(request: RequestListItem) {
  return isSuperAdmin.value && request.status === 'pending';
}

function rowCanCancel(request: RequestListItem) {
  if (request.status !== 'pending') {
    return false;
  }

  if (isSuperAdmin.value) {
    return true;
  }

  return request.initiatorAccountId === resolveCurrentActorId(session.value);
}

function rowCanEdit(request: RequestListItem) {
  return requestCanEditProducts(requestRecordForListItem(request), session.value);
}

function rowCanAddMore(request: RequestListItem) {
  return rowCanEdit(request);
}

function rowCanReopen(request: RequestListItem) {
  return requestCanReopenRejected(requestRecordForListItem(request), session.value);
}

async function handleRequestViewDetails(request: RequestListItem) {
  await navigateToRequestDetails(request.id);
}

async function handleRequestEdit(request: RequestListItem) {
  await navigateToRequestDetails(request.id, { edit: true });
}

async function handleRequestAddMore(request: RequestListItem) {
  const record = requestRecordForListItem(request);
  if (!record) {
    return;
  }

  await startAddMoreToRequest(record);
}

async function handleRequestReopen(request: RequestListItem) {
  if (isSuperAdmin.value) {
    const next = await reopenRejected(request.id);
    if (!next) {
      return;
    }

    syncRequestInList(next);
    clearNuxtData(
      `manage-request-detail:${getCustomerSessionCacheSignature(session.value)}:${request.id}`,
    );
    await navigateToRequestDetails(request.id, { edit: true });
    return;
  }

  await navigateToRequestDetails(request.id);
}

async function handleRequestApprove(request: RequestListItem) {
  await navigateTo(`/checkout/${request.id}`);
}

async function handleRequestCheckout(request: RequestListItem) {
  await navigateTo(`/checkout/${request.id}`);
}

async function handleRequestReject(request: RequestListItem) {
  selectRequestForAction(request);
  if (!selectedRequest.value) {
    toast.error('Unable to load request.');
    return;
  }

  rejectReason.value = '';
  rejectOpen.value = true;
}

async function handleRequestCancel(request: RequestListItem) {
  selectRequestForAction(request);
  if (!selectedRequest.value) {
    await openRequestDetails(request.id);
  }

  handleCancel();
}

async function submitReject(reason: string) {
  if (!selectedRequest.value) {
    return;
  }

  rejectLoading.value = true;
  try {
    const response = await rejectRequest(selectedRequest.value.id, {
      rejectionReasons: reason,
    });
    if (response.data) {
      syncRequestInList(response.data);
      rejectOpen.value = false;
      rejectReason.value = '';
    }
  } finally {
    rejectLoading.value = false;
  }
}

</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex w-full flex-col gap-2 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between">
        <div
          v-if="!isEmployeeSession"
          class="flex w-full flex-col gap-2 min-[1000px]:max-w-md"
        >
          <BranchPickerDropdown
            :model-value="selectedBranchId"
            :branches="branches"
            :loading="branchesLoading"
            :disabled="requestsLoading"
            :show-all-branches-option="showAllBranchesOption"
            @update:model-value="(id) => setPageBranchFilter(id, { resetPage: true })"
          />
          <SearchField
            v-model="searchValue"
            placeholder="Search request, branch, initiator, or product"
            :disabled="requestsLoading"
          />
        </div>

        <div v-else class="w-full min-[1000px]:max-w-md">
          <SearchField
            v-model="searchValue"
            placeholder="Search request, branch, initiator, or product"
            :disabled="requestsLoading"
          />
        </div>

        <ViewToggle
          class="shrink-0 self-end min-[1000px]:self-auto"
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>

      <RequestFilterBar
        v-if="!showNoBranchSetup"
        :filters="listFilters"
        :search="debouncedSearch"
        @apply="onApplyRequestFilters"
        @clear-all="clearAllRequestFilters"
      />

      <RequestBranchSetupBanner
        :branch-count="branches.length"
        :branches-ready="hasFinishedInitialFetch"
      />

      <RequestTable
        :requests="tableRequests"
        :layout="effectiveView"
        :page="page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="limit"
        :has-next-page="meta.hasNextPage"
        :has-prev-page="meta.hasPrevPage"
        :loading="tableLoading"
        :empty-message="tableEmptyMessage"
        :can-approve-reject="rowCanApproveReject"
        :can-cancel="rowCanCancel"
        :can-edit="rowCanEdit"
        :can-add-more="rowCanAddMore"
        :can-reopen="rowCanReopen"
        :can-checkout="rowCanCheckout"
        @page="setPage"
        @page-size="setLimit"
        @row-click="handleRequestClick"
        @view-details="handleRequestViewDetails"
        @edit="handleRequestEdit"
        @add-more="handleRequestAddMore"
        @reopen="handleRequestReopen"
        @checkout="handleRequestCheckout"
        @approve="handleRequestApprove"
        @reject="handleRequestReject"
        @cancel="handleRequestCancel"
      />

    <RequestDetailsSlidePanel
      v-if="!isSuperAdmin"
      :open="detailsOpen"
      @update:open="!$event && closeDetails()"
    >
      <template #actions>
        <RequestActionsMenu
          v-if="selectedRequest && requestDetailsView && !showRequestDetailsSkeleton && !isEditingProducts"
          trigger-variant="icon"
          :show-view-details="false"
          :can-cancel="canCancel"
          :can-edit="canEditProducts"
          :can-add-more="canAddMoreItems"
          @edit="startEditingProducts"
          @add-more="handleAddMoreItems"
          @cancel="handleCancel"
        />
      </template>

      <RequestDetailsPanel
        :view="requestDetailsView"
        :loading="showRequestDetailsSkeleton"
        :refreshing="isRequestDetailsRefreshing"
        :editable="productsEditable"
        :products-editing="lineMutationLoading"
        :format-currency="formatRequestCurrency"
        @quantity-change="handleProductQuantityChange"
        @remove-line="handleProductRemove"
      >
        <template
          v-if="isEditingProducts && canEditProducts"
          #productsActions
        >
          <Button
            variant="neutral"
            size="small"
            class="!w-auto"
            :disabled="lineMutationLoading"
            @click="finishEditingProducts(false)"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            class="!w-auto"
            :loading="lineMutationLoading"
            @click="finishEditingProducts(true)"
          >
            Edit
          </Button>
        </template>
      </RequestDetailsPanel>
    </RequestDetailsSlidePanel>

    <MemberConfirmOverlay
      :open="confirmOpen"
      :title="confirmTitle"
      :description="confirmDescription || undefined"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :destructive="confirmDestructive"
      :loading="confirmLoading"
      @update:open="confirmOpen = $event"
      @confirm="runConfirmAction"
    />

    <RequestRejectOverlay
      v-model:open="rejectOpen"
      v-model:reason="rejectReason"
      :request-reference="selectedRequest?.reference"
      :loading="rejectLoading"
      @confirm="submitReject"
    />
  </div>
</template>
