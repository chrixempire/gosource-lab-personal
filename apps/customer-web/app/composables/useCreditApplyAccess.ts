import type { CustomerMeResponse } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { CREDIT_PAGE_ROUTES } from '~/lib/credit-routes';

export const CREDIT_APPLY_DENIED_MESSAGE =
  "You don't have the permission to carry out this action";

export function useCreditApplyAccess() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const { whenReady } = useCustomerSession();
  const checkingAccess = ref(false);

  const canApplyForCredit = computed(() => isBusinessOwnerSession(session.value));

  async function ensureCanApplyForCredit(options?: { redirectOnDenied?: boolean }) {
    checkingAccess.value = true;
    try {
      await whenReady();

      if (canApplyForCredit.value) {
        return true;
      }

      toast.error(CREDIT_APPLY_DENIED_MESSAGE);

      if (options?.redirectOnDenied) {
        await navigateTo(CREDIT_PAGE_ROUTES.HOME, { replace: true });
      }

      return false;
    } finally {
      checkingAccess.value = false;
    }
  }

  async function openCreditApply() {
    if (checkingAccess.value) {
      return;
    }

    const allowed = await ensureCanApplyForCredit();
    if (allowed) {
      await navigateTo(CREDIT_PAGE_ROUTES.APPLY);
    }
  }

  return {
    checkingAccess,
    canApplyForCredit,
    ensureCanApplyForCredit,
    openCreditApply,
  };
}
