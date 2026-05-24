import type { CreateRequestPayload, CustomerMeResponse } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { getMarketProductById, getMarketUnitPrice, isCartLineInStock } from '~/lib/marketplace-data';
import { useCustomerApiMode } from '~/composables/useCustomerApiMode';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerRequestService } from '~/services/request.service';
import { customerSignInLocation } from '~/lib/auth-redirect';
import { extractApiErrorMessage } from '~/utils/api-error';

const MIN_REQUEST_SUBTOTAL_NAIRA = 25_000;

export function useCartRequestAction() {
  const router = useRouter();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { cartDrawerOpen } = useMarketplaceUi();
  const { activeBranchId, fetchBranchesInBackground, hasSession, openBranchGateForCustomer } =
    useMarketBranchGate();
  const { flushGuestCartToStorage, lines, loadCart, resetCartState, subtotalNaira } =
    useMarketplaceCart();
  const { getBranch } = useCustomerBranchService();
  const { createRequest } = useCustomerRequestService();
  const { isLegacyMode } = useCustomerApiMode();

  const isSubmitting = ref(false);

  const isBusinessOwner = computed(() => isBusinessOwnerSession(session.value));

  const hasOutOfStockProduct = computed(() => lines.value.some((line) => !isCartLineInStock(line)));

  const primaryCtaLabel = computed(() => {
    if (!hasSession.value) {
      return 'Checkout';
    }

    return isBusinessOwner.value ? 'Checkout' : 'Send order request';
  });

  const canSubmitPrimary = computed(() => {
    if (!lines.value.length || hasOutOfStockProduct.value) {
      return false;
    }

    return true;
  });

  function closeCartDrawer() {
    cartDrawerOpen.value = false;
  }

  function continueShopping() {
    closeCartDrawer();
  }

  function readPhoneFromSession(value: CustomerMeResponse | null | undefined): string {
    const data = value?.data;
    if (!data || typeof data !== 'object' || !('phoneNumber' in data)) {
      return '';
    }

    return String(data.phoneNumber ?? '').trim();
  }

  async function resolvePhoneNumber(): Promise<string> {
    const cached = readPhoneFromSession(session.value);
    if (cached) {
      return cached;
    }

    try {
      const refreshed = await $fetch<CustomerMeResponse>('/api/auth/session/me', {
        credentials: 'same-origin',
      });
      session.value = refreshed;
      return readPhoneFromSession(refreshed);
    } catch {
      return '';
    }
  }

  function buildCreateRequestPayload(
    branchId: string,
    branch: { streetName: string; lga: string; state: string },
    phoneNumber: string,
  ): CreateRequestPayload {
    const payload: CreateRequestPayload = {
      branchId,
      phoneNumber,
      address: {
        streetAddress: branch.streetName,
        lga: branch.lga,
        state: branch.state || 'Lagos',
        directions: '',
      },
    };

    // Legacy gosource-api reads line items from the branch cart — same as gosource-web-app.
    if (!isLegacyMode.value) {
      payload.products = lines.value
        .map((line) => {
          const product = line.product ?? getMarketProductById(line.productId);
          if (!product) {
            return null;
          }

          return {
            productId: line.productId,
            productName: product.name,
            quantity: line.quantity,
            unitPrice: getMarketUnitPrice(product, line.unit),
            unit: line.unit,
            imageUrl: product.imageUrl,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }

    return payload;
  }

  async function submitCartAsRequest() {
    if (!hasSession.value) {
      flushGuestCartToStorage();
      closeCartDrawer();
      await router.push(customerSignInLocation('/market'));
      return;
    }

    if (hasOutOfStockProduct.value) {
      toast.error('Remove out of stock items before continuing.');
      return;
    }

    if (subtotalNaira.value < MIN_REQUEST_SUBTOTAL_NAIRA) {
      toast.error('Minimum order is ₦25,000');
      return;
    }

    isSubmitting.value = true;

    try {
      let branchId = activeBranchId.value;
      if (!branchId) {
        await fetchBranchesInBackground(true);
        branchId = activeBranchId.value;
      }

      if (!branchId) {
        toast.error('Create a delivery branch before checkout.');
        closeCartDrawer();
        await nextTick();
        openBranchGateForCustomer();
        return;
      }

      const phoneNumber = await resolvePhoneNumber();
      if (!phoneNumber) {
        toast.error(
          'Add a phone number in Settings → My Profile before checkout.',
        );
        return;
      }

      const branchResponse = await getBranch(branchId);
      const branch = branchResponse.data;
      if (!branch) {
        toast.error('Selected branch is unavailable right now.');
        return;
      }

      const payload = buildCreateRequestPayload(branchId, branch, phoneNumber);

      const response = await createRequest(payload);
      const createdRequestId = response.data?.id;

      resetCartState();
      await loadCart(true);
      closeCartDrawer();
      toast.success('Request created successfully');

      // Reference gosource-web-app: cart → POST /request → Super Admin → /checkout/:id (pay/approve).
      // Members only create the pending request; owner completes checkout separately.
      if (isBusinessOwner.value && createdRequestId) {
        await router.push(`/checkout/${createdRequestId}`);
        return;
      }

      if (createdRequestId) {
        await router.push({
          path: '/manage-requests',
          query: { open: createdRequestId },
        });
        return;
      }

      await router.push('/manage-requests');
    } catch (error) {
      toast.error(extractApiErrorMessage(error, 'Unable to create request right now'));
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    canSubmitPrimary,
    continueShopping,
    hasOutOfStockProduct,
    isBusinessOwner,
    isSubmitting,
    primaryCtaLabel,
    submitCartAsRequest,
  };
}
