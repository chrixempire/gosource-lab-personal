import type { MarketProduct } from '~/lib/marketplace-data';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';

export function useMarketBranchGate() {
  const { whenReady } = useCustomerSession();
  const ctx = useBusinessBranchContext();

  const session = useState<{
    user_type?: 'customer' | 'employee';
    bootstrap?: { hasBranch?: boolean };
    data?: { businessId?: string | null; branchId?: string | null };
  } | null>('customer-session', () => null);

  const branchGateOpen = useState('market-branch-gate-open', () => false);
  const pendingResumeProduct = useState<MarketProduct | null>('market-branch-gate-pending-product', () => null);

  const hasSession = ctx.hasSession;
  const isEmployeeSession = ctx.isEmployeeSession;
  const branches = ctx.branches;
  const branchFetchLoading = ctx.branchFetchLoading;
  const branchFetchInitialized = ctx.branchFetchInitialized;
  const activeBranchId = ctx.activeBranchId;

  const sessionBranchId = computed(() => {
    const id = session.value?.data?.branchId;
    return typeof id === 'string' && id.trim() ? id.trim() : null;
  });

  const hasBranch = computed(() => {
    if (isEmployeeSession.value) {
      return Boolean(sessionBranchId.value);
    }

    if (typeof session.value?.bootstrap?.hasBranch === 'boolean') {
      return session.value.bootstrap.hasBranch;
    }

    return Boolean(branches.value?.length);
  });

  async function fetchBranchesInBackground(force = false) {
    if (import.meta.client) {
      await whenReady();
    }

    return ctx.ensureBranchesLoaded(force);
  }

  async function resolveBranchRequirement() {
    if (!activeBranchId.value) {
      await fetchBranchesInBackground(true);
    }

    return Boolean(activeBranchId.value);
  }

  function openBranchGate() {
    branchGateOpen.value = true;
  }

  async function ensureBranchForAction() {
    if (!hasSession.value) {
      return true;
    }

    if (await resolveBranchRequirement()) {
      return true;
    }

    openBranchGate();
    return false;
  }

  function openBranchGateForCustomer() {
    if (!hasSession.value) {
      return;
    }

    openBranchGate();
  }

  function requestProductModalResume(product: MarketProduct) {
    pendingResumeProduct.value = product;
  }

  function clearProductModalResume() {
    pendingResumeProduct.value = null;
  }

  function handleBranchCreated(branch?: Parameters<typeof ctx.reconcileAfterBranchCreated>[0]) {
    if (!branch) {
      return;
    }

    ctx.reconcileAfterBranchCreated(branch);
    branchGateOpen.value = false;
  }

  return {
    branches,
    activeBranchId,
    hasBranch,
    hasSession,
    branchFetchLoading,
    branchFetchInitialized,
    branchGateOpen,
    pendingResumeProduct,
    fetchBranchesInBackground,
    resolveBranchRequirement,
    openBranchGate,
    openBranchGateForCustomer,
    ensureBranchForAction,
    handleBranchCreated,
    requestProductModalResume,
    clearProductModalResume,
  };
}
