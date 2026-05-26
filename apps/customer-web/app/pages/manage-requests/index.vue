<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type {
  BranchRecord,
  CustomerMeResponse,
  RequestRecord,
} from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  PaginationBar,
  ViewToggle,
  toast,
} from '@gosource/ui';
import { useDebounceFn, useMediaQuery } from '@vueuse/core';
import BranchPickerDropdown from '~/components/branches/BranchPickerDropdown.vue';
import MemberConfirmOverlay from '~/components/members/MemberConfirmOverlay.vue';
import RequestActionsMenu from '~/components/requests/RequestActionsMenu.vue';
import RequestCards, { type RequestListItem } from '~/components/requests/RequestCards.vue';
import RequestDetailsPanel from '~/components/requests/RequestDetailsPanel.vue';
import RequestRejectForm from '~/components/requests/RequestRejectForm.vue';
import RequestBranchSetupBanner from '~/components/requests/RequestBranchSetupBanner.vue';
import RequestFilterBar from '~/components/requests/RequestFilterBar.vue';
import RequestRoleGuide from '~/components/requests/RequestRoleGuide.vue';
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
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { usePageBranchFilter } from '~/composables/usePageBranchFilter';
import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';
import { useCustomerBranchService } from '~/services/branch.service';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCustomerRequestService } from '~/services/request.service';
import {
  parseRequestFiltersFromQuery,
  requestFiltersToRouteQuery,
  requestStatusFiltersToApiParam,
  type RequestListFilters,
} from '~/lib/request-list-filters';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));
const requestRoleGuideVariant = computed(() =>
  isSuperAdmin.value ? ('super_admin' as const) : ('member' as const),
);
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
const { listRequests, getRequest, cancelRequest } = useCustomerRequestService();
const {
  setActiveRequest,
  clearActiveRequest,
  editDraft,
  beginProductEdit,
  cancelProductEdit,
  saveProductEdit,
  updateDraftLineQuantity,
  removeDraftLineLocal,
  lineMutationLoading,
} = useRequestEdit();
const route = useRoute();
const router = useRouter();
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
} = pageBranch;
const searchValue = ref('');
const debouncedSearch = ref('');
const requests = ref<RequestRecord[]>([]);
const meta = ref({ ...defaultMeta });

const detailsOpen = ref(false);
const detailsLoading = ref(false);
const selectedRequest = ref<RequestRecord | null>(null);
const isEditingProducts = ref(false);
const isRejecting = ref(false);
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

watch(selectedBranchId, (next, prev) => {
  if (next !== prev) {
    setPage(1);
  }
});

watch(employeeBranchId, (next) => {
  if (isEmployeeSession.value && next && selectedBranchId.value !== next) {
    selectedBranchId.value = next;
  }
});

const {
  data: requestsPagePayload,
  pending: requestsLoading,
  status: requestsFetchStatus,
  refresh: refreshRequestsData,
} = await useAuthenticatedAsyncData(
  'manage-requests-index',
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

    const requestsResponse = await listRequests({
      page: page.value,
      limit: limit.value,
      search: debouncedSearch.value.trim() || undefined,
      status: requestStatusFiltersToApiParam(listFilters.value.status),
      branchId: !isEmployeeSession.value ? apiBranchId.value : undefined,
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
    watch: [
      page,
      limit,
      debouncedSearch,
      () => listFilters.value.amountMin,
      () => listFilters.value.amountMax,
      () => listFilters.value.status.join(','),
      apiBranchId,
    ],
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

const showRequestTable = computed(
  () =>
    showNoBranchSetup.value ||
    requestsLoading.value ||
    effectiveView.value === 'table',
);

const tableRequests = computed(() => (showNoBranchSetup.value ? [] : requestItems.value));

const tableLoading = computed(() => requestsLoading.value && !showNoBranchSetup.value);

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
  options?: { reject?: boolean; edit?: boolean },
) {
  if (!requestId) {
    return;
  }

  if (!isSuperAdmin.value) {
    await openRequestDetails(requestId, options);
    return;
  }

  const query: Record<string, string> = {};
  if (options?.reject) {
    query.reject = '1';
  }
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
  options?: { reject?: boolean; edit?: boolean },
) {
  if (!requestId) {
    return;
  }

  const cached = requests.value.find((item) => item.id === requestId);
  if (cached && !memberCanViewRequest(session.value, cached)) {
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
      if (!memberCanViewRequest(session.value, response.data)) {
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
      replaceRequestInList(next);
    }
  } else {
    cancelProductEdit();
  }

  isEditingProducts.value = false;
}

function replaceRequestInList(next: RequestRecord) {
  requests.value = requests.value.map((item) => (item.id === next.id ? next : item));
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
        replaceRequestInList(response.data);
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
  await navigateToRequestDetails(request.id);
}

async function handleRequestApprove(request: RequestListItem) {
  await navigateTo(`/checkout/${request.id}`);
}

async function handleRequestCheckout(request: RequestListItem) {
  await navigateTo(`/checkout/${request.id}`);
}

async function handleRequestReject(request: RequestListItem) {
  await navigateToRequestDetails(request.id, { reject: true });
}

async function handleRequestCancel(request: RequestListItem) {
  if (isSuperAdmin.value) {
    await navigateToRequestDetails(request.id);
    return;
  }

  selectRequestForAction(request);
  if (!selectedRequest.value) {
    await openRequestDetails(request.id);
  }
  handleCancel();
}

const pageDescription = computed(() =>
  isSuperAdmin.value
    ? 'Approve and manage all order requests across your business branches.'
    : 'View and manage order requests you created for your branch.',
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="max-w-3xl text-base leading-7 text-grey-text">
      {{ pageDescription }}
    </p>

    <RequestRoleGuide :variant="requestRoleGuideVariant" />

    <div class="mt-4 flex flex-col gap-6">
      <div class="flex w-full flex-col gap-3 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between">
        <div
          v-if="!isEmployeeSession"
          class="flex w-full flex-col gap-3 min-[1000px]:max-w-md"
        >
          <BranchPickerDropdown
            v-model="selectedBranchId"
            :branches="branches"
            :loading="branchesLoading"
            :disabled="requestsLoading"
            :show-all-branches-option="showAllBranchesOption"
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
          v-if="!isCompactViewport"
          class="shrink-0 self-end min-[1000px]:self-auto"
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>

      <RequestFilterBar
        v-if="!showNoBranchSetup"
        :filters="listFilters"
        :search="debouncedSearch"
        :branch-id="selectedBranchId"
        @apply="onApplyRequestFilters"
        @clear-all="clearAllRequestFilters"
      />

      <RequestBranchSetupBanner
        :branch-count="branches.length"
        :branches-ready="hasFinishedInitialFetch"
      />

      <RequestTable
        v-if="showRequestTable"
        :requests="tableRequests"
        :page="meta.page"
        :total-pages="meta.totalPages"
        :total-items="meta.total"
        :page-size="meta.limit"
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

      <div v-else-if="!showNoBranchSetup && !requestsLoading" class="space-y-4">
        <RequestCards
          v-if="requestItems.length"
          :requests="requestItems"
          :can-approve-reject="rowCanApproveReject"
          :can-cancel="rowCanCancel"
          :can-edit="rowCanEdit"
          :can-add-more="rowCanAddMore"
          :can-reopen="rowCanReopen"
          :can-checkout="rowCanCheckout"
          @click="handleRequestClick"
          @view-details="handleRequestViewDetails"
          @edit="handleRequestEdit"
          @add-more="handleRequestAddMore"
          @reopen="handleRequestReopen"
          @checkout="handleRequestCheckout"
          @approve="handleRequestApprove"
          @reject="handleRequestReject"
          @cancel="handleRequestCancel"
        />

        <div
          v-else
          class="rounded-[24px] border border-dashed border-grey-50 bg-white px-6 py-12 text-center text-sm text-grey-300"
        >
          No requests found for the current filters.
        </div>

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

      <div v-else-if="!showNoBranchSetup" class="flex flex-wrap gap-4">
        <div
          v-for="index in 4"
          :key="index"
          class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-white p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] sm:p-5"
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
            <div class="flex shrink-0 items-center gap-2">
              <div class="h-7 w-[4.5rem] animate-pulse rounded-full bg-grey-55" />
              <div class="size-9 animate-pulse rounded-full bg-grey-55" />
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

    <Drawer
      v-if="!isSuperAdmin"
      :open="detailsOpen && isCompactViewport"
      @update:open="!$event && closeDetails()"
    >
      <DrawerContent class="max-h-[92vh] overflow-hidden">
        <DrawerHeader class="items-center gap-3 border-b border-grey-50 bg-white">
          <DrawerTitle class="min-w-0 flex-1 text-xl font-semibold text-grey-900">
            Request details
          </DrawerTitle>
          <div
            v-if="selectedRequest && requestDetailsView && !showRequestDetailsSkeleton && isEditingProducts && canEditProducts"
            class="flex shrink-0 items-center gap-2"
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
              Save
            </Button>
          </div>
          <RequestActionsMenu
            v-else-if="selectedRequest && requestDetailsView && !showRequestDetailsSkeleton"
            trigger-variant="icon"
            :show-view-details="false"
            :can-cancel="canCancel"
            :can-edit="canEditProducts"
            :can-add-more="canAddMoreItems"
            @edit="startEditingProducts"
            @add-more="handleAddMoreItems"
            @cancel="handleCancel"
          />
          <DrawerClose class="shrink-0" />
        </DrawerHeader>
        <DrawerBody class="bg-white">
          <RequestDetailsPanel
            :view="requestDetailsView"
            :loading="showRequestDetailsSkeleton"
            :refreshing="isRequestDetailsRefreshing"
            :editable="productsEditable"
            :products-editing="lineMutationLoading"
            :format-currency="formatRequestCurrency"
            @quantity-change="handleProductQuantityChange"
            @remove-line="handleProductRemove"
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>

    <Dialog
      v-if="!isSuperAdmin && !isCompactViewport"
      :open="detailsOpen"
      @update:open="!$event && closeDetails()"
    >
      <DialogContent class="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader class="items-center gap-3 border-b border-grey-50 bg-white px-6 py-5">
          <DialogTitle class="min-w-0 flex-1 text-[24px] font-semibold text-grey-900">
            Request details
          </DialogTitle>
          <div
            v-if="selectedRequest && requestDetailsView && !showRequestDetailsSkeleton && isEditingProducts && canEditProducts"
            class="flex shrink-0 items-center gap-2"
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
              Save
            </Button>
          </div>
          <RequestActionsMenu
            v-else-if="selectedRequest && requestDetailsView && !showRequestDetailsSkeleton"
            trigger-variant="icon"
            :show-view-details="false"
            :can-cancel="canCancel"
            :can-edit="canEditProducts"
            :can-add-more="canAddMoreItems"
            @edit="startEditingProducts"
            @add-more="handleAddMoreItems"
            @cancel="handleCancel"
          />
          <DialogClose class="shrink-0" />
        </DialogHeader>
        <DialogBody class="max-h-[70vh] overflow-y-auto bg-white px-6 py-5">
          <RequestDetailsPanel
            :view="requestDetailsView"
            :loading="showRequestDetailsSkeleton"
            :refreshing="isRequestDetailsRefreshing"
            :editable="productsEditable"
            :products-editing="lineMutationLoading"
            :format-currency="formatRequestCurrency"
            @quantity-change="handleProductQuantityChange"
            @remove-line="handleProductRemove"
          />
        </DialogBody>
      </DialogContent>
    </Dialog>

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
  </div>
</template>
