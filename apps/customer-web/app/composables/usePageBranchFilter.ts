import type { CustomerMeResponse } from '@gosource/api-client';
import { ALL_BRANCHES_VALUE, resolvePageListBranchId } from '~/lib/branch-picker';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';

/**
 * Per-page branch filter for list views (orders, lists, requests).
 * Defaults to the sidebar active branch; "All branches" only affects this page.
 * Does not change cart, market, or the global active branch peel.
 */
export function usePageBranchFilter() {
  const session = useState<CustomerMeResponse | null>('customer-session', () => null);
  const ctx = useBusinessBranchContext();

  const isOwner = computed(() => isBusinessOwnerSession(session.value));
  const isEmployee = computed(() => session.value?.user_type === 'employee');

  const employeeBranchId = computed(() => {
    const data = session.value?.data;
    if (!data || typeof data !== 'object' || !('branchId' in data)) {
      return '';
    }

    const branchId = data.branchId;
    return typeof branchId === 'string' ? branchId.trim() : '';
  });

  const viewBranchId = ref(ALL_BRANCHES_VALUE);
  const viewingAllBranches = ref(false);

  const showAllBranchesOption = computed(() => isOwner.value);

  const branches = computed(() => ctx.branches.value ?? []);

  const branchesLoading = computed(
    () => isOwner.value && ctx.branchFetchLoading.value && !ctx.isReady.value,
  );

  const apiBranchId = computed(() => {
    if (isEmployee.value) {
      return employeeBranchId.value || undefined;
    }

    if (!isOwner.value) {
      return undefined;
    }

    return resolvePageListBranchId(viewBranchId.value, { allowAll: true });
  });

  function syncViewToActiveBranch() {
    if (!isOwner.value) {
      return;
    }

    const activeId = ctx.activeBranchId.value;
    if (!activeId) {
      return;
    }

    viewingAllBranches.value = false;
    viewBranchId.value = activeId;
  }

  function resetViewToActiveBranch() {
    syncViewToActiveBranch();
  }

  watch(
    () => ctx.activeBranchId.value,
    () => {
      if (!isOwner.value || viewingAllBranches.value) {
        return;
      }

      syncViewToActiveBranch();
    },
  );

  watch(
    () => ctx.isReady.value,
    (ready) => {
      if (!ready) {
        return;
      }

      if (isEmployee.value && employeeBranchId.value) {
        viewBranchId.value = employeeBranchId.value;
        viewingAllBranches.value = false;
        return;
      }

      if (isOwner.value && !viewingAllBranches.value) {
        syncViewToActiveBranch();
      }
    },
    { immediate: true },
  );

  watch(viewBranchId, (next) => {
    if (!isOwner.value) {
      return;
    }

    viewingAllBranches.value = next === ALL_BRANCHES_VALUE;
  });

  watch(employeeBranchId, (next) => {
    if (isEmployee.value && next) {
      viewBranchId.value = next;
      viewingAllBranches.value = false;
    }
  });

  return {
    viewBranchId,
    apiBranchId,
    branches,
    branchesLoading,
    showAllBranchesOption,
    viewingAllBranches,
    isOwner,
    isEmployee,
    employeeBranchId,
    activeBranchId: ctx.activeBranchId,
    resetViewToActiveBranch,
    ensureBranchesLoaded: ctx.ensureBranchesLoaded,
  };
}
