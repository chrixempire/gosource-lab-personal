import type { BranchListResponse } from '@gosource/api-client';
import type { MarketProduct } from '~/lib/marketplace-data';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useCustomerBranchService } from '~/services/branch.service';

export function useMarketBranchGate() {
  const { whenReady } = useCustomerSession();
  const session = useState<{
    user_type?: 'customer' | 'employee';
    bootstrap?: { hasBranch?: boolean };
    data?: { businessId?: string | null; branchId?: string | null };
  } | null>('customer-session', () => null);

  const branches = useState<BranchListResponse['data']>('market-branch-gate-branches', () => []);
  const branchFetchLoading = useState('market-branch-gate-loading', () => false);
  const branchFetchInitialized = useState('market-branch-gate-initialized', () => false);
  const branchGateOpen = useState('market-branch-gate-open', () => false);
  const pendingResumeProduct = useState<MarketProduct | null>('market-branch-gate-pending-product', () => null);

  const { listBranches } = useCustomerBranchService();

  const hasSession = computed(() => Boolean(session.value?.data?.businessId));
  const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
  const hasBranch = computed(() => {
    if (isEmployeeSession.value) {
      return Boolean(session.value?.data?.branchId);
    }

    if (typeof session.value?.bootstrap?.hasBranch === 'boolean') {
      return session.value.bootstrap.hasBranch;
    }

    return Boolean(branches.value?.length);
  });
  const activeBranchId = computed(() => {
    if (session.value?.data?.branchId) {
      return session.value.data.branchId;
    }

    if (isEmployeeSession.value) {
      return null;
    }

    return branches.value?.[0]?.id ?? null;
  });

  async function fetchBranchesInBackground(force = false) {
    if (import.meta.client) {
      await whenReady();
    }

    if (!hasSession.value) {
      branchFetchInitialized.value = true;
      branches.value = [];
      return branches.value;
    }

    if (isEmployeeSession.value) {
      branchFetchInitialized.value = true;
      return branches.value;
    }

    if (branchFetchLoading.value) {
      return branches.value;
    }

    if (!force && branchFetchInitialized.value) {
      return branches.value;
    }

    branchFetchLoading.value = true;

    try {
      const response = (await listBranches()) as BranchListResponse;
      branches.value = response.data ?? [];
      branchFetchInitialized.value = true;
      if (session.value && session.value.user_type === 'customer') {
        session.value = {
          ...session.value,
          bootstrap: {
            ...(session.value.bootstrap ?? {}),
            hasBranch: branches.value.length > 0,
          },
        };
      }
      return branches.value;
    } catch {
      branchFetchInitialized.value = true;
      return branches.value;
    } finally {
      branchFetchLoading.value = false;
    }
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

  function handleBranchCreated(branch?: NonNullable<BranchListResponse['data']>[number]) {
    if (!branch) {
      return;
    }

    branches.value = [branch, ...(branches.value ?? []).filter((item) => item.id !== branch.id)];
    branchFetchInitialized.value = true;
    branchGateOpen.value = false;

    if (session.value) {
      session.value = {
        ...session.value,
        bootstrap: {
          ...(session.value.bootstrap ?? {}),
          hasBranch: true,
        },
      };
    }
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
