import type { CreateRequestPayload, CustomerMeResponse } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { getMarketProductById, getMarketUnitPrice, isMarketProductInStock } from '~/lib/marketplace-data';
import { useCustomerApiMode } from '~/composables/useCustomerApiMode';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerRequestService } from '~/services/request.service';
import { extractApiErrorMessage } from '~/utils/api-error';

const MIN_REQUEST_SUBTOTAL_NAIRA = 25_000;

export function useCartRequestAction() {
  const router = useRouter();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { cartDrawerOpen } = useMarketplaceUi();
  const { activeBranchId, ensureBranchForAction, hasSession } = useMarketBranchGate();
  const { lines, loadCart, subtotalNaira } = useMarketplaceCart();
  const { getBranch } = useCustomerBranchService();
  const { createRequest } = useCustomerRequestService();
  const { isLegacyMode } = useCustomerApiMode();

  const isSubmitting = ref(false);

  const isBusinessOwner = computed(() => isBusinessOwnerSession(session.value));

  const hasOutOfStockProduct = computed(() =>
    lines.value.some(({ productId, unit }) => {
      const product = getMarketProductById(productId);
      return product ? !isMarketProductInStock(product) : false;
    }),
  );

  const primaryCtaLabel = computed(() => {
    if (!hasSession.value) {
      return 'Checkout';
    }

    return isBusinessOwner.value ? 'Checkout' : 'Send order request';
  });

  const canSubmitPrimary = computed(() => {
    if (!lines.value.length || hasOutOfStockProduct.value || isSubmitting.value) {
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
      await router.push('/auth/sign-in');
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

    let branchId = activeBranchId.value;
    if (!branchId) {
      await ensureBranchForAction();
      branchId = activeBranchId.value;
    }

    if (!branchId) {
      toast.error('Select a branch before sending a request.');
      return;
    }

    const phoneNumber = await resolvePhoneNumber();
    if (!phoneNumber) {
      toast.error(
        'Add a phone number in Settings → My Profile before checkout.',
      );
      return;
    }

    isSubmitting.value = true;

    try {
      const branchResponse = await getBranch(branchId);
      const branch = branchResponse.data;
      if (!branch) {
        toast.error('Selected branch is unavailable right now.');
        return;
      }

      const payload = buildCreateRequestPayload(branchId, branch, phoneNumber);

      const response = await createRequest(payload);
      const createdRequestId = response.data?.id;

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
