import type { RequestRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import {
  applyDraftLineQuantity,
  cloneRequestRecord,
  diffRequestProductEdits,
  hasRequestProductDraftChanges,
  removeDraftLine,
  removeDraftLineByProductUnit,
  type DraftRequestProductInput,
  upsertDraftLineByProductUnit,
} from '~/lib/request-edit-draft';
import { useCustomerRequestService } from '~/services/request.service';

const ACTIVE_REQUEST_STATE_KEY = 'active-request-edit';

export function useRequestEdit() {
  const activeRequest = useState<RequestRecord | null>(ACTIVE_REQUEST_STATE_KEY, () => null);
  const editBaseline = useState<RequestRecord | null>('active-request-edit-baseline', () => null);
  const editDraft = useState<RequestRecord | null>('active-request-edit-draft', () => null);
  const lineMutationLoading = useState('active-request-edit-line-loading', () => false);

  const isProductEditDraftActive = computed(() => editDraft.value !== null);
  const hasUnsavedProductEdits = computed(() =>
    hasRequestProductDraftChanges(editBaseline.value, editDraft.value),
  );

  const {
    getRequest,
    addRequestProduct,
    updateRequestProductQuantity,
    removeRequestProduct,
    updateRequest,
  } = useCustomerRequestService();

  function setActiveRequest(request: RequestRecord | null) {
    activeRequest.value = request;
  }

  function clearActiveRequest() {
    activeRequest.value = null;
    cancelProductEdit();
  }

  function beginProductEdit(request: RequestRecord) {
    editBaseline.value = cloneRequestRecord(request);
    editDraft.value = cloneRequestRecord(request);
  }

  function cancelProductEdit() {
    editBaseline.value = null;
    editDraft.value = null;
  }

  function updateDraftLineQuantity(cartLineId: string, quantity: number) {
    if (!editDraft.value || !cartLineId) {
      return;
    }

    editDraft.value = applyDraftLineQuantity(editDraft.value, cartLineId, quantity);
  }

  function removeDraftLineLocal(cartLineId: string) {
    if (!editDraft.value || !cartLineId) {
      return;
    }

    editDraft.value = removeDraftLine(editDraft.value, cartLineId);
  }

  function upsertDraftProductLineLocal(input: DraftRequestProductInput) {
    if (!editDraft.value) {
      return;
    }

    editDraft.value = upsertDraftLineByProductUnit(editDraft.value, input);
  }

  function removeDraftLineByProductUnitLocal(productId: string, unit: string) {
    if (!editDraft.value) {
      return;
    }

    editDraft.value = removeDraftLineByProductUnit(editDraft.value, productId, unit);
  }

  async function refreshRequest(requestId: string) {
    const response = await getRequest(requestId);
    if (response.data) {
      if (activeRequest.value?.id === response.data.id) {
        activeRequest.value = response.data;
      }
      return response.data;
    }
    return null;
  }

  async function applyRequestMutation(
    requestId: string,
    mutate: () => Promise<{ data?: RequestRecord | null }>,
    options?: { successMessage?: string },
  ) {
    lineMutationLoading.value = true;
    try {
      const response = await mutate();
      if (response.data) {
        if (activeRequest.value?.id === response.data.id) {
          activeRequest.value = response.data;
        }
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        return response.data;
      }
      return await refreshRequest(requestId);
    } finally {
      lineMutationLoading.value = false;
    }
  }

  async function persistLineRemoval(requestId: string, cartLineId: string) {
    return applyRequestMutation(requestId, () => removeRequestProduct(requestId, cartLineId));
  }

  async function persistLineQuantity(
    requestId: string,
    cartLineId: string,
    quantity: number,
  ) {
    if (quantity <= 0) {
      return persistLineRemoval(requestId, cartLineId);
    }

    return applyRequestMutation(requestId, () =>
      updateRequestProductQuantity({
        requestId,
        cartId: cartLineId,
        quantity,
      }),
    );
  }

  async function saveProductEdit(requestId: string) {
    if (!editBaseline.value || !editDraft.value) {
      return null;
    }

    if (!hasRequestProductDraftChanges(editBaseline.value, editDraft.value)) {
      cancelProductEdit();
      return editBaseline.value;
    }

    const { removedLineIds, quantityPatches, addedLines } = diffRequestProductEdits(
      editBaseline.value,
      editDraft.value,
    );

    lineMutationLoading.value = true;
    try {
      let latest: RequestRecord | null = null;

      for (const cartLineId of removedLineIds) {
        const response = await removeRequestProduct(requestId, cartLineId);
        if (response.data) {
          latest = response.data;
        }
      }

      for (const patch of quantityPatches) {
        const response = await updateRequestProductQuantity({
          requestId,
          cartId: patch.cartLineId,
          quantity: patch.quantity,
        });
        if (response.data) {
          latest = response.data;
        }
      }

      for (const line of addedLines) {
        const response = await addRequestProduct(requestId, {
          productId: line.productId,
          quantity: line.quantity,
          unit: line.unit,
          requestId,
        });
        if (response.data) {
          latest = response.data;
        }
      }

      if (!latest) {
        latest = await refreshRequest(requestId);
      }

      if (latest) {
        if (activeRequest.value?.id === latest.id) {
          activeRequest.value = latest;
        }
        toast.success('Request updated');
      }

      cancelProductEdit();
      return latest;
    } catch {
      return null;
    } finally {
      lineMutationLoading.value = false;
    }
  }

  async function reopenRejected(requestId: string) {
    return applyRequestMutation(
      requestId,
      () => updateRequest(requestId, { status: 'pending' }),
      { successMessage: 'Request reopened for editing' },
    );
  }

  return {
    activeRequest,
    editBaseline,
    editDraft,
    isProductEditDraftActive,
    hasUnsavedProductEdits,
    lineMutationLoading,
    setActiveRequest,
    clearActiveRequest,
    beginProductEdit,
    cancelProductEdit,
    updateDraftLineQuantity,
    removeDraftLineLocal,
    upsertDraftProductLineLocal,
    removeDraftLineByProductUnitLocal,
    saveProductEdit,
    refreshRequest,
    reopenRejected,
  };
}
