import type { CreateRequestPayload, CustomerMeResponse, ShoppingListRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { shoppingListSubtotal } from '~/lib/shopping-list';
import { useCustomerBranchService } from '~/services/branch.service';
import { useCustomerRequestService } from '~/services/request.service';
import { invalidateManageRequestsListCache } from '~/lib/invalidate-customer-list-cache';
import { resolveRequestRecordId } from '~/lib/request-details';
import { reportCustomerApiError } from '~/utils/api-error';

const MIN_REQUEST_SUBTOTAL_NAIRA = 25_000;

export function useListRequestAction() {
  const router = useRouter();
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { getBranch } = useCustomerBranchService();
  const { createRequestFromShoppingList } = useCustomerRequestService();

  const isSubmitting = ref(false);
  const isBusinessOwner = computed(() => isBusinessOwnerSession(session.value));

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

  async function submitListAsRequest(list: ShoppingListRecord) {
    if (!list.items.length) {
      toast.error('Add at least one product to the list before creating a request.');
      return;
    }

    const subtotal = shoppingListSubtotal(list);
    if (subtotal < MIN_REQUEST_SUBTOTAL_NAIRA) {
      toast.error('Minimum order is ₦25,000');
      return;
    }

    const phoneNumber = await resolvePhoneNumber();
    if (!phoneNumber) {
      toast.error('Add a phone number in Settings → My Profile before creating a request.');
      return;
    }

    isSubmitting.value = true;

    try {
      const branchResponse = await getBranch(list.branchId);
      const branch = branchResponse.data;
      if (!branch) {
        toast.error('Unable to resolve branch for this list.');
        return;
      }

      const payload: CreateRequestPayload = {
        branchId: list.branchId,
        phoneNumber,
        address: {
          streetAddress: branch.streetName,
          lga: branch.lga,
          state: branch.state || 'Lagos',
          directions: '',
        },
      };

      const response = await createRequestFromShoppingList(list.id, payload);
      const createdRequestId = resolveRequestRecordId(response.data);
      const routesToCheckout = Boolean(isBusinessOwner.value && createdRequestId);

      if (routesToCheckout) {
        await router.push(`/checkout/${createdRequestId}`);
        invalidateManageRequestsListCache();
        return;
      }

      if (createdRequestId) {
        await router.push({
          path: '/manage-requests',
          query: { open: createdRequestId },
        });
      } else {
        await router.push('/manage-requests');
      }

      invalidateManageRequestsListCache();
      toast.success('Request submitted', { duration: 2000 });
    } catch (error) {
      reportCustomerApiError(error, 'Unable to create request from list right now');
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    submitListAsRequest,
  };
}
