import type { CustomerMeResponse } from '@gosource/api-client';
import {
  ALL_BRANCHES_VALUE,
  branchFilterFromQueryParam,
  branchFilterToQueryParam,
} from '~/lib/branch-picker';
import { getCustomerSessionCacheSignature } from '~/lib/customer-session-cache';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';

/**
 * Per-page branch filter for list views (orders, lists, requests).
 * Defaults to the sidebar active branch; "All branches" only affects this page.
 * Persists owner selection in `?branchId=` (`all` or a branch id).
 * Does not change cart, market, or the global active branch peel.
 */
export function usePageBranchFilter() {
  const route = useRoute();
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

    if (viewingAllBranches.value) {
      return undefined;
    }

    const trimmedBranchId = viewBranchId.value.trim();
    if (trimmedBranchId) {
      return trimmedBranchId;
    }

    return ctx.activeBranchId.value?.trim() || undefined;
  });

  function isKnownBranchId(branchId: string) {
    return branches.value.some((branch) => branch.id === branchId);
  }

  function applyViewBranchId(next: string) {
    if (next === ALL_BRANCHES_VALUE) {
      viewBranchId.value = ALL_BRANCHES_VALUE;
      viewingAllBranches.value = true;
      return;
    }

    const trimmed = next.trim();
    if (trimmed && (branches.value.length === 0 || isKnownBranchId(trimmed))) {
      viewBranchId.value = trimmed;
      viewingAllBranches.value = false;
      return;
    }

    syncViewToActiveBranch();
  }

  function syncViewToActiveBranch() {
    if (!isOwner.value) {
      return;
    }

    const activeId = ctx.activeBranchId.value;
    if (!activeId) {
      return;
    }

    viewBranchId.value = activeId;
    viewingAllBranches.value = false;
  }

  async function pushBranchFilterToRoute(options?: { resetPage?: boolean }) {
    if (!isOwner.value) {
      return;
    }

    const nextParam = branchFilterToQueryParam(viewBranchId.value);
    const currentRaw = route.query.branchId;
    const currentParam =
      typeof currentRaw === 'string'
        ? currentRaw
        : Array.isArray(currentRaw)
          ? currentRaw[0]
          : undefined;

    if (nextParam === currentParam || (!nextParam && !currentParam)) {
      return;
    }

    const query = { ...route.query };
    if (nextParam) {
      query.branchId = nextParam;
    } else {
      delete query.branchId;
    }
    if (options?.resetPage) {
      query.page = '1';
    }

    await navigateTo(
      {
        path: route.path,
        query,
      },
      { replace: true },
    );
  }

  /** Call from BranchPickerDropdown @update:model-value to persist the page filter in the URL. */
  function setPageBranchFilter(branchId: string, options?: { resetPage?: boolean }) {
    applyViewBranchId(branchId);
    void pushBranchFilterToRoute(options);
  }

  async function resetViewToActiveBranch() {
    syncViewToActiveBranch();

    if (!isOwner.value) {
      return;
    }

    if (!route.query.branchId) {
      return;
    }

    const query = { ...route.query };
    delete query.branchId;

    await navigateTo(
      {
        path: route.path,
        query,
      },
      { replace: true },
    );
  }

  function applyBranchFromRouteQuery() {
    if (!isOwner.value) {
      return;
    }

    const fromQuery = branchFilterFromQueryParam(route.query.branchId);
    if (fromQuery === null) {
      if (!viewingAllBranches.value) {
        syncViewToActiveBranch();
      }
      return;
    }

    applyViewBranchId(fromQuery);
  }

  /** Apply `?branchId=` before the first list fetch (reload-safe). */
  function syncViewFromRouteQuery() {
    if (!isOwner.value) {
      return;
    }

    const fromQuery = branchFilterFromQueryParam(route.query.branchId);
    if (fromQuery === null) {
      return;
    }

    if (fromQuery === ALL_BRANCHES_VALUE) {
      viewBranchId.value = ALL_BRANCHES_VALUE;
      viewingAllBranches.value = true;
      return;
    }

    viewBranchId.value = fromQuery;
    viewingAllBranches.value = false;
  }

  syncViewFromRouteQuery();

  watch(
    () => getCustomerSessionCacheSignature(session.value),
    async (next, prev) => {
      if (!prev || next === prev) {
        return;
      }

      viewBranchId.value = ALL_BRANCHES_VALUE;
      viewingAllBranches.value = false;

      if (!route.query.branchId) {
        return;
      }

      const query = { ...route.query };
      delete query.branchId;

      await navigateTo(
        {
          path: route.path,
          query,
        },
        { replace: true },
      );
    },
  );

  watch(
    () => ctx.activeBranchId.value,
    () => {
      if (!isOwner.value || viewingAllBranches.value) {
        return;
      }

      if (branchFilterFromQueryParam(route.query.branchId) !== null) {
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
        applyViewBranchId(employeeBranchId.value);
        return;
      }

      if (isOwner.value) {
        applyBranchFromRouteQuery();
      }
    },
    { immediate: true },
  );

  watch(
    () => route.query.branchId,
    () => {
      if (!isOwner.value) {
        return;
      }

      applyBranchFromRouteQuery();
    },
  );

  watch(employeeBranchId, (next) => {
    if (isEmployee.value && next) {
      applyViewBranchId(next);
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
    setPageBranchFilter,
    resetViewToActiveBranch,
    ensureBranchesLoaded: ctx.ensureBranchesLoaded,
  };
}
