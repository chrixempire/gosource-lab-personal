import type { CustomerMeResponse, RequestProductRecord, RequestRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { getMarketProductById, getMarketUnitPrice } from '~/lib/marketplace-data';
import {
  REQUEST_ADD_TO_MARKET_QUERY,
  REQUEST_OPEN_DRAWER_QUERY,
  buildMarketAddToRequestLocation,
  parseRouteQueryParam,
} from '~/lib/request-add-to-market';
import { useRequestEdit } from '~/composables/useRequestEdit';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useCustomerRequestService } from '~/services/request.service';
import { extractApiResponseMessage } from '~/utils/api-error';
import { invalidateManageRequestsListCache } from '~/lib/invalidate-customer-list-cache';

let activeBootstrapPromise: Promise<void> | null = null;
let activeBootstrapRequestId: string | null = null;

export function useRequestAddItemsMode() {
  const route = useRoute();
  const router = useRouter();
  const session = useState<CustomerMeResponse | null>(
    'customer-session',
    () => null,
  );
  const {
    activeRequest,
    editDraft,
    setActiveRequest,
    clearActiveRequest,
    beginProductEdit,
    cancelProductEdit,
    saveProductEdit,
    upsertDraftProductLineLocal,
    removeDraftLineByProductUnitLocal,
    lineMutationLoading,
  } = useRequestEdit();
  const { getRequest } = useCustomerRequestService();
  const { cartDrawerOpen } = useMarketplaceUi();

  const bootstrapLoading = useState('request-add-bootstrap-loading', () => false);
  /** Set when navigating from manage-requests so the drawer opens even if query sync lags. */
  const pendingOpenRequestDrawer = useState('request-add-pending-open-drawer', () => false);
  const routeRequestId = computed(() =>
    parseRouteQueryParam(route.query[REQUEST_ADD_TO_MARKET_QUERY]),
  );

  const isAddingToRequest = computed(() => Boolean(routeRequestId.value));

  const displayRequest = computed(() => editDraft.value ?? activeRequest.value);

  const requestReference = computed(() => displayRequest.value?.reference ?? '');
  const requestId = computed(() => activeRequest.value?.id ?? routeRequestId.value);

  /** Distinct request product lines for cart badge (not sum of quantities). */
  const totalItemCount = computed(
    () => (displayRequest.value?.products ?? []).filter((line) => line.quantity > 0).length,
  );

  const requestSubtotal = computed(() => displayRequest.value?.subtotal ?? 0);
  const requestDeliveryFee = computed(() => displayRequest.value?.deliveryFee ?? 0);
  const requestServiceCharge = computed(() => displayRequest.value?.serviceCharge ?? 0);
  const requestDiscount = computed(() => displayRequest.value?.discount ?? 0);
  const requestTotalPrice = computed(() => displayRequest.value?.totalPrice ?? 0);

  const requestProducts = computed(() => displayRequest.value?.products ?? []);

  const isRequestReady = computed(
    () =>
      Boolean(activeRequest.value?.id) &&
      activeRequest.value?.id === routeRequestId.value &&
      activeRequest.value?.status === 'pending',
  );

  const isBusinessOwner = computed(() => isBusinessOwnerSession(session.value));

  const primaryActionLabel = computed(() =>
    isBusinessOwner.value ? 'Checkout' : 'Update order request',
  );

  function normalizeUnit(unit: string | null | undefined) {
    return (unit ?? 'Standard pack').trim();
  }

  function findRequestLine(productId: string, unit: string): RequestProductRecord | undefined {
    const normalizedUnit = normalizeUnit(unit);
    return displayRequest.value?.products.find(
      (line) =>
        line.productId === productId && normalizeUnit(line.unit) === normalizedUnit,
    );
  }

  function getQtyForUnit(productId: string, unit: string) {
    return findRequestLine(productId, unit)?.quantity ?? 0;
  }

  function getTotalQtyForProduct(productId: string) {
    return (displayRequest.value?.products ?? [])
      .filter((line) => line.productId === productId)
      .reduce((sum, line) => sum + line.quantity, 0);
  }

  async function setQuantityForUnit(productId: string, unit: string, raw: number) {
    if (!isRequestReady.value) {
      toast.error('Request is still loading. Try again in a moment.');
      return false;
    }

    const request = displayRequest.value!;
    const resolvedUnit = normalizeUnit(unit);
    const next = Math.max(0, Math.min(999, Math.floor(Number.isFinite(raw) ? raw : 0)));
    const line = findRequestLine(productId, resolvedUnit);
    const current = line?.quantity ?? 0;

    if (next <= 0) {
      if (request.products.length <= 1) {
        toast.error('A request must include at least one product.');
        return false;
      }

      removeDraftLineByProductUnitLocal(productId, resolvedUnit);
      return true;
    }

    if (next === current) {
      return true;
    }

    const product = getMarketProductById(productId);
    if (!product) {
      toast.error('Product details are unavailable right now.');
      return false;
    }

    upsertDraftProductLineLocal({
      productId,
      productName: product.name,
      quantity: next,
      unitPrice: getMarketUnitPrice(product, resolvedUnit),
      unit: resolvedUnit,
      imageUrl: product.imageUrl ?? null,
      inStock: product.inStock !== false,
    });

    return true;
  }

  async function addOne(productId: string, unit?: string) {
    const resolvedUnit = normalizeUnit(unit ?? 'Standard pack');
    const current = getQtyForUnit(productId, resolvedUnit);
    return setQuantityForUnit(productId, resolvedUnit, current + 1);
  }

  async function bootstrapFromRoute() {
    const id = routeRequestId.value;
    if (!id) {
      return;
    }

    if (activeBootstrapPromise && activeBootstrapRequestId === id) {
      return activeBootstrapPromise;
    }

    if (activeRequest.value?.id === id && activeRequest.value.status === 'pending') {
      if (!editDraft.value) {
        beginProductEdit(activeRequest.value);
      }
      openDrawerFromQuery();
      return;
    }

    activeBootstrapRequestId = id;
    activeBootstrapPromise = (async () => {
      bootstrapLoading.value = true;
      try {
        const response = await getRequest(id);
        const record = response.data ?? null;

        if (!record) {
          toast.error('Request not found.');
          await router.replace({ path: '/manage-requests' });
          return;
        }

        if (record.status !== 'pending') {
          toast.error('Only pending requests can be edited.');
          await router.replace({ path: '/manage-requests' });
          return;
        }

        setActiveRequest(record);
        beginProductEdit(record);
        openDrawerFromQuery();
      } catch (error) {
        toast.error(extractApiResponseMessage(error, 'Unable to load request'));
      } finally {
        bootstrapLoading.value = false;
        activeBootstrapPromise = null;
        activeBootstrapRequestId = null;
      }
    })();

    return activeBootstrapPromise;
  }

  function shouldOpenRequestDrawerFromRoute() {
    return (
      pendingOpenRequestDrawer.value ||
      parseRouteQueryParam(route.query[REQUEST_OPEN_DRAWER_QUERY]) === '1'
    );
  }

  function openDrawerFromQuery() {
    if (!shouldOpenRequestDrawerFromRoute()) {
      return;
    }

    pendingOpenRequestDrawer.value = false;
    cartDrawerOpen.value = true;

    if (parseRouteQueryParam(route.query[REQUEST_OPEN_DRAWER_QUERY]) !== '1') {
      return;
    }

    const nextQuery = { ...route.query };
    delete nextQuery[REQUEST_OPEN_DRAWER_QUERY];
    void router.replace({
      path: route.path,
      query: Object.keys(nextQuery).length ? nextQuery : undefined,
    });
  }

  async function startAddMoreToRequest(request: RequestRecord) {
    beginProductEdit(request);
    setActiveRequest(request);
    pendingOpenRequestDrawer.value = true;
    await router.push(buildMarketAddToRequestLocation(request.id));
    await bootstrapFromRoute();
  }

  async function finishAddingToRequest() {
    await updateRequestAndOpen();
  }

  // Commit the in-progress draft to the server. Returns the request id on
  // success (drawer closed, caches dropped) or null on failure/no-op, so callers
  // decide where to navigate next.
  async function commitDraft(): Promise<string | null> {
    const id = requestId.value;
    if (!id) {
      pendingOpenRequestDrawer.value = false;
      cartDrawerOpen.value = false;
      clearActiveRequest();
      await router.push('/manage-requests');
      return null;
    }

    // Run the update first so the CTA can show its loading state. Keep the
    // drawer open on failure so the user can retry; only close on success.
    const next = await saveProductEdit(id);
    if (!next) {
      toast.error('Unable to update request right now');
      return null;
    }

    setActiveRequest(next);
    cancelProductEdit();
    pendingOpenRequestDrawer.value = false;
    cartDrawerOpen.value = false;

    // Drop the cached requests list BEFORE navigating so the table reflects the
    // updated item count instead of serving stale rows until a manual reload.
    invalidateManageRequestsListCache();

    return id;
  }

  // "Update request" — commit, then reopen the request's slide-in modal so the
  // user sees the updated items (and can check out from there). Used by the
  // owner's secondary action and the member's primary action.
  async function updateRequestAndOpen() {
    const id = await commitDraft();
    if (!id) {
      return;
    }

    await router.push({
      path: '/manage-requests',
      query: { open: id },
    });
  }

  // "Checkout" — commit, then route the business owner straight to payment.
  async function checkoutRequest() {
    const id = await commitDraft();
    if (!id) {
      return;
    }

    await router.push(`/checkout/${id}`);
  }

  // Back-compat alias for the previous primary action (the member update path).
  async function commitDraftForPrimaryAction() {
    await updateRequestAndOpen();
  }

  function cancelAddingToRequest() {
    const id = requestId.value;
    pendingOpenRequestDrawer.value = false;
    cartDrawerOpen.value = false;
    cancelProductEdit();
    clearActiveRequest();

    if (!id) {
      void router.push('/manage-requests');
      return;
    }

    if (isBusinessOwnerSession(session.value)) {
      void router.push(`/manage-requests/${id}`);
      return;
    }

    void router.push({
      path: '/manage-requests',
      query: { open: id },
    });
  }

  if (import.meta.client) {
    watch(
      () =>
        [
          routeRequestId.value,
          parseRouteQueryParam(route.query[REQUEST_OPEN_DRAWER_QUERY]),
        ] as const,
      ([id]) => {
        if (!id) {
          pendingOpenRequestDrawer.value = false;
          return;
        }

        void bootstrapFromRoute();
      },
      { immediate: true },
    );
  }

  return {
    activeRequest,
    isAddingToRequest,
    isRequestReady,
    bootstrapLoading,
    editDraft,
    requestReference,
    requestId,
    requestProducts,
    totalItemCount,
    requestSubtotal,
    requestDeliveryFee,
    requestServiceCharge,
    requestDiscount,
    requestTotalPrice,
    isBusinessOwner,
    primaryActionLabel,
    isCommittingRequest: lineMutationLoading,
    getQtyForUnit,
    getTotalQtyForProduct,
    setQuantityForUnit,
    addOne,
    startAddMoreToRequest,
    bootstrapFromRoute,
    finishAddingToRequest,
    commitDraftForPrimaryAction,
    updateRequestAndOpen,
    checkoutRequest,
    cancelAddingToRequest,
  };
}
