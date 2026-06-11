<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { RequestRecord } from '@gosource/api-client';
import { Button, StatusTag, toast } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import MemberConfirmOverlay from '~/components/members/MemberConfirmOverlay.vue';
import RequestActionsMenu from '~/components/requests/RequestActionsMenu.vue';
import RequestBranchRequestsSection from '~/components/requests/RequestBranchRequestsSection.vue';
import RequestDetailsPanel from '~/components/requests/RequestDetailsPanel.vue';
import RequestRejectForm from '~/components/requests/RequestRejectForm.vue';
import type { RequestListItem } from '~/components/requests/RequestCards.vue';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import {
  buildRequestDetailsView,
  formatRequestCurrency,
  mapRequestToListItem,
  requestHasPendingActions,
} from '~/lib/request-details';
import {
  memberCanViewRequest,
  requestCanEditProducts,
  requestCanReopenRejected,
  resolveCurrentActorId,
} from '~/lib/request-edit';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch';
import { useRequestEdit } from '~/composables/useRequestEdit';
import { useCustomerRequestService } from '~/services/request.service';

const runWhenSessionReady = useAuthenticatedFetch();

const { session, sessionResolved } = useCustomerSession();
const isSuperAdmin = computed(() => isBusinessOwnerSession(session.value));

const route = useRoute();
const router = useRouter();
const requestId = computed(() => String(route.params.id ?? ''));
const requestDetailKey = computed(
  () =>
    `manage-request-detail:${getCustomerSessionCacheSignature(session.value)}:${requestId.value || 'empty'}`,
);
const isEditingProducts = ref(false);

const { getRequest, listRequests, rejectRequest, cancelRequest } = useCustomerRequestService();
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

const relatedLoading = ref(false);
const request = ref<RequestRecord | null>(null);
const relatedRequests = ref<RequestListItem[]>([]);
const isRejecting = ref(false);
const rejectReason = ref('');
const confirmLoading = ref(false);

const confirmOpen = ref(false);
const confirmTitle = ref('');
const confirmDescription = ref('');
const confirmMessage = ref('');
const confirmLabel = ref('');
const confirmDestructive = ref(true);
let confirmAction: (() => Promise<void>) | null = null;

watch(
  () => route.query.reject,
  (value) => {
    if (value === '1' || value === 'true') {
      isRejecting.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => route.query.edit,
  (value) => {
    isEditingProducts.value = value === '1' || value === 'true';
  },
  { immediate: true },
);

useHead({
  title: computed(() =>
    request.value ? `${request.value.reference} · Requests` : 'Request details',
  ),
});

async function refreshRelatedRequests(nextRequest = request.value) {
  if (!nextRequest?.branchId || !isSuperAdmin.value) {
    relatedRequests.value = [];
    return;
  }

  relatedLoading.value = true;
  try {
    const response = await runWhenSessionReady(() =>
      listRequests({
        branchId: nextRequest.branchId,
        page: 1,
        limit: 20,
      }),
    );
    relatedRequests.value = (response.data ?? [])
      .filter((item) => item.id !== nextRequest.id)
      .map(mapRequestToListItem);
  } finally {
    relatedLoading.value = false;
  }
}

const {
  data: requestDetailPayload,
  pending: loading,
} = await useAuthenticatedAsyncData(
  requestDetailKey,
  async () => {
    if (!requestId.value) {
      return {
        requestKey: '',
        ready: true,
        request: null as RequestRecord | null,
        relatedRequests: [] as RequestListItem[],
      };
    }

    const response = await getRequest(requestId.value);
    const nextRequest = response.data ?? null;

    if (!nextRequest) {
      return {
        requestKey: requestId.value,
        ready: true,
        request: null as RequestRecord | null,
        relatedRequests: [] as RequestListItem[],
      };
    }

    let nextRelated: RequestListItem[] = [];
    if (isSuperAdmin.value && nextRequest.branchId) {
      const relatedResponse = await listRequests({
        branchId: nextRequest.branchId,
        page: 1,
        limit: 20,
      });

      nextRelated = (relatedResponse.data ?? [])
        .filter((item) => item.id !== nextRequest.id)
        .map(mapRequestToListItem);
    }

    return {
      requestKey: requestId.value,
      ready: true,
      request: nextRequest,
      relatedRequests: nextRelated,
    };
  },
  {
    fastNav: true,
    watch: [requestId],
    default: () => ({
      requestKey: requestId.value,
      ready: false,
      request: null as RequestRecord | null,
      relatedRequests: [] as RequestListItem[],
    }),
  },
);

const payloadReadyForRoute = computed(() =>
  requestDetailPayload.value?.requestKey === requestId.value &&
  Boolean(requestDetailPayload.value?.ready),
);

watch(
  [requestDetailPayload, sessionResolved, session] as const,
  ([payload, resolved, activeSession]) => {
    if (payload?.requestKey !== requestId.value || !payload?.ready) {
      return;
    }

    const nextRequest = payload?.request ?? null;

    request.value = nextRequest;
    relatedRequests.value = Array.isArray(payload?.relatedRequests) ? payload!.relatedRequests : [];

    if (!nextRequest) {
      clearActiveRequest();
      return;
    }

    if (!resolved || !activeSession) {
      return;
    }

    if (!memberCanViewRequest(activeSession, nextRequest)) {
      request.value = null;
      relatedRequests.value = [];
      clearActiveRequest();
      toast.error('You do not have access to this request.');
      void navigateTo('/manage-requests');
      return;
    }

    setActiveRequest(nextRequest);
    if (isEditingProducts.value) {
      beginProductEdit(nextRequest);
    }
  },
  { immediate: true },
);

async function fetchRequest() {
  if (!requestId.value) {
    return;
  }

  const response = await runWhenSessionReady(() => getRequest(requestId.value));
  const nextRequest = response.data ?? null;
  request.value = nextRequest;

  if (!nextRequest) {
    clearActiveRequest();
    relatedRequests.value = [];
    return;
  }

  if (!memberCanViewRequest(session.value, nextRequest)) {
    request.value = null;
    relatedRequests.value = [];
    clearActiveRequest();
    toast.error('You do not have access to this request.');
    void navigateTo('/manage-requests');
    return;
  }

  setActiveRequest(nextRequest);
  if (isEditingProducts.value) {
    beginProductEdit(nextRequest);
  }

  await refreshRelatedRequests(nextRequest);
}

watch(requestId, () => {
  clearActiveRequest();
  isRejecting.value = false;
  rejectReason.value = '';
  cancelProductEdit();
}, { immediate: true });

const displayRequest = computed(() => {
  if (isEditingProducts.value && editDraft.value) {
    return editDraft.value;
  }

  return request.value;
});

const requestDetailsView = computed(() =>
  displayRequest.value ? buildRequestDetailsView(displayRequest.value) : null,
);

const summaryCards = computed(() => {
  if (!displayRequest.value) {
    return [];
  }

  const products = Array.isArray(displayRequest.value.products)
    ? displayRequest.value.products
    : [];

  return [
    {
      label: 'Items',
      value: String(products.length),
    },
    {
      label: 'Total',
      value: formatRequestCurrency(displayRequest.value.totalPrice),
    },
    {
      label: 'Branch',
      value: displayRequest.value.branchName,
    },
  ];
});

const canApproveOrReject = computed(
  () =>
    isSuperAdmin.value &&
    !!request.value &&
    requestHasPendingActions(request.value.status),
);

const canCancel = computed(() => {
  if (!request.value || request.value.status !== 'pending') {
    return false;
  }

  if (isSuperAdmin.value) {
    return true;
  }

  return request.value.initiator.accountId === resolveCurrentActorId(session.value);
});

const canEditProducts = computed(() =>
  requestCanEditProducts(request.value, session.value),
);

const canAddMoreItems = computed(() => canEditProducts.value);

/** Line editing only while in edit mode (?edit=1 or “Edit request” from More actions). */
const productsEditable = computed(() => canEditProducts.value && isEditingProducts.value);

const editModeBlockedReason = computed(() => {
  if (!request.value || canEditProducts.value) {
    return '';
  }

  if (request.value.status === 'approved') {
    return 'This request has been approved, so line items can no longer be changed and no further actions are available.';
  }

  if (request.value.status !== 'pending') {
    return `This request is ${request.value.status}, so line items can no longer be changed.`;
  }

  return 'You can only edit requests you created.';
});

function startEditingProducts() {
  if (request.value) {
    beginProductEdit(request.value);
  }

  isEditingProducts.value = true;
  void router.replace({
    query: {
      ...route.query,
      edit: '1',
    },
  });
}

function exitProductEditMode() {
  isEditingProducts.value = false;
  const query = { ...route.query };
  delete query.edit;
  void router.replace({
    query: Object.keys(query).length ? query : undefined,
  });
}

async function finishEditingProducts(save: boolean) {
  if (save && request.value) {
    const next = await saveProductEdit(request.value.id);
    if (next) {
      request.value = next;
    }
  } else {
    cancelProductEdit();
  }

  exitProductEditMode();
}

async function handleReopenRequest() {
  if (!request.value) {
    return;
  }

  const next = await reopenRejected(request.value.id);
  if (next) {
    request.value = next;
    isRejecting.value = false;
    startEditingProducts();
  }
}

const canReopenRejected = computed(() =>
  requestCanReopenRejected(request.value, session.value),
);

function handleProductQuantityChange(cartLineId: string, quantity: number) {
  updateDraftLineQuantity(cartLineId, quantity);
}

function handleProductRemove(cartLineId: string) {
  removeDraftLineLocal(cartLineId);
}

const { startAddMoreToRequest } = useRequestAddItemsMode();

function handleAddMoreItems() {
  if (!request.value) {
    return;
  }

  void startAddMoreToRequest(request.value);
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
  if (!confirmAction) return;
  confirmLoading.value = true;
  try {
    await confirmAction();
    confirmOpen.value = false;
  } finally {
    confirmLoading.value = false;
  }
}

function handleCheckout() {
  if (!request.value) return;
  void navigateTo(`/checkout/${request.value.id}`);
}

function handleCancel() {
  if (!request.value) return;

  openConfirm({
    title: 'Cancel request',
    description: 'This request will no longer be actionable.',
    message: `Cancel request ${request.value.reference}?`,
    confirmLabel: 'Cancel request',
    action: async () => {
      const response = await cancelRequest(request.value!.id);
      if (response.data) {
        request.value = response.data;
        isRejecting.value = false;
        await refreshRelatedRequests(response.data);
      }
    },
  });
}

async function submitReject() {
  if (!request.value) return;
  const reason = rejectReason.value.trim();
  if (!reason) return;

  confirmLoading.value = true;
  try {
    const response = await rejectRequest(request.value.id, { reason });
    if (response.data) {
      request.value = response.data;
      isRejecting.value = false;
      rejectReason.value = '';
      await refreshRelatedRequests(response.data);
    }
  } finally {
    confirmLoading.value = false;
  }
}

function openRelatedRequest(item: RequestListItem) {
  void router.push(`/manage-requests/${item.id}`);
}
</script>

<template>
  <div data-testid="request-detail-page" class="flex w-full flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <Button
        variant="neutral"
        size="small"
        class="!w-auto"
        :left-icon="ChevronLeft"
        @click="navigateTo('/manage-requests')"
      >
        Back
      </Button>

      <div
        v-if="request && isEditingProducts && canEditProducts"
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
      <div v-else-if="request" class="flex items-center gap-2">
        <Button
          v-if="canApproveOrReject"
          variant="primary"
          size="small"
          class="!w-auto whitespace-nowrap"
          @click="handleCheckout"
        >
          Checkout
        </Button>
        <RequestActionsMenu
          trigger-variant="primary"
          :show-view-details="false"
          :can-approve-reject="canApproveOrReject"
          :can-cancel="canCancel"
          :can-edit="canEditProducts"
          :can-add-more="canAddMoreItems"
          :can-reopen="canReopenRejected"
          :show-approve-action="false"
          @edit="startEditingProducts"
          @add-more="handleAddMoreItems"
          @reopen="handleReopenRequest"
          @reject="isRejecting = true"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <div v-if="loading || !payloadReadyForRoute" class="flex flex-col gap-2">
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
        <RequestDetailsPanel :view="null" loading :format-currency="formatRequestCurrency" />
      </section>
      <section class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5">
        <RequestBranchRequestsSection
          branch-name=""
          :requests="[]"
          loading
          current-request-id=""
        />
      </section>
    </div>

    <div v-else-if="request" class="flex flex-col gap-2">
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
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 class="text-xl font-semibold text-grey-900">
                Request details
              </h1>
            </div>
            <StatusTag
              :variant="requestDetailsView?.statusVariant ?? 'warning'"
              size="medium"
              class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
            >
              {{ requestDetailsView?.statusLabel }}
            </StatusTag>
          </div>
          <div class="-mx-6 border-b border-grey-50" />
        </div>

        <div class="mt-6">
          <RequestDetailsPanel
            :view="requestDetailsView"
            page-layout
            :info-message="editModeBlockedReason || undefined"
            :editable="productsEditable"
            :products-editing="lineMutationLoading"
            :format-currency="formatRequestCurrency"
            @quantity-change="handleProductQuantityChange"
            @remove-line="handleProductRemove"
          />
          <RequestRejectForm
            v-if="isRejecting && requestDetailsView"
            v-model:reason="rejectReason"
            class="mt-5"
          />
        </div>

        <div
          v-if="isRejecting && requestDetailsView"
          class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-grey-50 pt-5"
        >
          <Button
            variant="neutral"
            size="medium"
            class="!w-auto min-w-[9rem]"
            :disabled="confirmLoading"
            @click="isRejecting = false"
          >
            Back
          </Button>
          <Button
            variant="destructive"
            size="medium"
            class="!w-auto min-w-[9rem]"
            :loading="confirmLoading"
            :disabled="!rejectReason.trim()"
            @click="submitReject"
          >
            Reject request
          </Button>
        </div>

      </section>

      <RequestBranchRequestsSection
        :branch-name="request.branchName"
        :requests="relatedRequests"
        :loading="relatedLoading"
        :current-request-id="request.id"
        @select="openRelatedRequest"
      />
    </div>

    <div
      v-else
      class="rounded-[24px] border border-grey-50 bg-background-on-canvas px-6 py-14 text-center text-sm text-grey-300"
    >
      Request not found.
    </div>

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
