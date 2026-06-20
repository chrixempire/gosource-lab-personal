import type { BranchListResponse, BranchRecord } from '@gosource/api-client';
import {
  clearStoredActiveBranchId,
  readStoredActiveBranchId,
  writeStoredActiveBranchId,
} from '~/lib/active-branch-storage';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useCustomerBranchService } from '~/services/branch.service';

export function resolveDefaultActiveBranchId(
  branches: BranchRecord[],
  preferredId?: string | null,
): string | null {
  if (!branches.length) {
    return null;
  }

  const trimmedPreferred = preferredId?.trim();
  if (trimmedPreferred && branches.some((branch) => branch.id === trimmedPreferred)) {
    return trimmedPreferred;
  }

  return branches.find((branch) => branch.isHeadquarter)?.id ?? branches[0]?.id ?? null;
}

type CustomerSessionState = {
  user_type?: 'customer' | 'employee';
  bootstrap?: { hasBranch?: boolean };
  data?: { businessId?: string | null; branchId?: string | null };
};

export function useBusinessBranchContext() {
  const session = useState<CustomerSessionState | null>('customer-session', () => null);
  const branches = useState<BranchListResponse['data']>('business-branch-list', () => []);
  const branchFetchLoading = useState('business-branch-fetch-loading', () => false);
  const branchFetchInitialized = useState('business-branch-fetch-initialized', () => false);
  const activeBranchId = useState<string | null>('business-active-branch-id', () => null);

  const { listBranches, getBranch } = useCustomerBranchService();
  const { cartDrawerOpen } = useMarketplaceUi();

  const isEmployeeSession = computed(() => session.value?.user_type === 'employee');
  const isOwnerSession = computed(() => isBusinessOwnerSession(session.value));

  const businessId = computed(() => {
    const id = session.value?.data?.businessId;
    return typeof id === 'string' ? id.trim() : '';
  });

  const hasSession = computed(() => Boolean(businessId.value));

  const canSwitchBranch = computed(
    () => isOwnerSession.value && (branches.value?.length ?? 0) > 1,
  );

  const isReady = computed(() => !hasSession.value || branchFetchInitialized.value);

  const activeBranch = computed(
    () => branches.value?.find((branch) => branch.id === activeBranchId.value) ?? null,
  );

  function applyActiveBranchForOwner(branchList: BranchRecord[]) {
    const stored = businessId.value ? readStoredActiveBranchId(businessId.value) : null;
    const resolved = resolveDefaultActiveBranchId(branchList, stored);
    activeBranchId.value = resolved;

    if (businessId.value && resolved) {
      writeStoredActiveBranchId(businessId.value, resolved);
    }
  }

  function applyActiveBranchForEmployee() {
    const id = session.value?.data?.branchId;
    activeBranchId.value = typeof id === 'string' && id.trim() ? id.trim() : null;
  }

  async function ensureBranchesLoaded(force = false) {
    if (!hasSession.value) {
      branches.value = [];
      activeBranchId.value = null;
      return branches.value;
    }

    if (isEmployeeSession.value) {
      applyActiveBranchForEmployee();
      const assignedBranchId = activeBranchId.value;

      if (!assignedBranchId) {
        branches.value = [];
        branchFetchInitialized.value = true;
        return branches.value;
      }

      if (branchFetchLoading.value) {
        return branches.value;
      }

      const assignedBranchIsLoaded = branches.value?.some(
        (branch) => branch.id === assignedBranchId,
      );
      if (!force && branchFetchInitialized.value && assignedBranchIsLoaded) {
        return branches.value;
      }

      branchFetchLoading.value = true;

      try {
        const response = await getBranch(assignedBranchId);
        branches.value = response.data ? [response.data] : [];
        branchFetchInitialized.value = true;
        return branches.value;
      } catch {
        // Keep only a matching cached record; never expose another branch to an employee.
        branches.value = (branches.value ?? []).filter((branch) => branch.id === assignedBranchId);
        branchFetchInitialized.value = true;
        return branches.value;
      } finally {
        branchFetchLoading.value = false;
      }
    }

    if (!isOwnerSession.value) {
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
      const response = (await listBranches({ page: 1, limit: 100 })) as BranchListResponse;
      const rows = response.data ?? [];
      branches.value = rows;
      applyActiveBranchForOwner(rows);
      branchFetchInitialized.value = true;

      if (session.value?.user_type === 'customer') {
        session.value = {
          ...session.value,
          bootstrap: {
            ...(session.value.bootstrap ?? {}),
            hasBranch: rows.length > 0,
          },
        };
      }

      return rows;
    } catch {
      branchFetchInitialized.value = true;
      return branches.value;
    } finally {
      branchFetchLoading.value = false;
    }
  }

  function setActiveBranch(branchId: string, options?: { reload?: boolean }) {
    if (!isOwnerSession.value) {
      return;
    }

    const trimmed = branchId.trim();
    if (!trimmed || !branches.value?.some((branch) => branch.id === trimmed)) {
      return;
    }

    if (activeBranchId.value === trimmed) {
      return;
    }

    if (businessId.value) {
      writeStoredActiveBranchId(businessId.value, trimmed);
    }

    activeBranchId.value = trimmed;
    cartDrawerOpen.value = false;

    if (import.meta.client && options?.reload !== false) {
      const url = new URL(window.location.href);
      url.searchParams.delete('branchId');
      url.searchParams.delete('page');
      window.location.assign(url.pathname + url.search);
    }
  }

  function reconcileAfterBranchCreated(branch: BranchRecord) {
    branches.value = [branch, ...(branches.value ?? []).filter((item) => item.id !== branch.id)];
    branchFetchInitialized.value = true;

    if (session.value?.user_type === 'customer') {
      session.value = {
        ...session.value,
        bootstrap: {
          ...(session.value.bootstrap ?? {}),
          hasBranch: true,
        },
      };
    }

    if (!activeBranchId.value) {
      setActiveBranch(branch.id, { reload: false });
    }
  }

  function clearActiveBranchForLogout() {
    if (businessId.value) {
      clearStoredActiveBranchId(businessId.value);
    }
    branches.value = [];
    activeBranchId.value = null;
    branchFetchInitialized.value = false;
    branchFetchLoading.value = false;
  }

  if (import.meta.client) {
    watch(
      hasSession,
      (ready) => {
        if (ready) {
          void ensureBranchesLoaded();
        }
      },
      { immediate: true },
    );
  }

  return {
    branches,
    activeBranchId,
    activeBranch,
    canSwitchBranch,
    isReady,
    branchFetchLoading,
    branchFetchInitialized,
    isOwnerSession,
    isEmployeeSession,
    hasSession,
    businessId,
    ensureBranchesLoaded,
    setActiveBranch,
    reconcileAfterBranchCreated,
    clearActiveBranchForLogout,
  };
}
