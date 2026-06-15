import { useEventListener } from '@vueuse/core';

const DEFAULT_FOCUS_STALE_MS = 30_000;

export type ClientListRevalidationOptions = {
  enabled?: boolean;
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
  /** When set, mount/focus skip refresh until cache is at least this old. */
  staleAfterMs?: number;
};

type ClientListRevalidationDeps = {
  whenReady: () => Promise<void>;
  getLastFetchedAt: () => number | null;
  refresh: () => void | Promise<unknown>;
  hydrate?: () => void;
};

function isCacheStale(lastFetchedAt: number | null, staleAfterMs: number) {
  if (!lastFetchedAt) {
    return true;
  }

  return Date.now() - lastFetchedAt >= staleAfterMs;
}

/**
 * Keeps list/table data fresh: show cache instantly, then background-refresh on
 * mount and when the user returns to the browser tab.
 */
export function useClientListRevalidation(
  options: ClientListRevalidationOptions,
  deps: ClientListRevalidationDeps,
) {
  if (!import.meta.client) {
    return;
  }

  const {
    enabled = true,
    revalidateOnMount = true,
    revalidateOnFocus = true,
    staleAfterMs,
  } = options;

  if (!enabled) {
    return;
  }

  const mountStaleMs = typeof staleAfterMs === 'number' ? staleAfterMs : 0;
  const focusStaleMs =
    typeof staleAfterMs === 'number' ? staleAfterMs : DEFAULT_FOCUS_STALE_MS;

  async function runRefresh() {
    await deps.whenReady();
    await deps.refresh();
  }

  function shouldRefresh(staleMs: number) {
    return isCacheStale(deps.getLastFetchedAt(), staleMs);
  }

  onMounted(() => {
    deps.hydrate?.();

    if (revalidateOnMount && shouldRefresh(mountStaleMs)) {
      void runRefresh();
    }
  });

  if (revalidateOnFocus) {
    useEventListener(document, 'visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      if (shouldRefresh(focusStaleMs)) {
        void runRefresh();
      }
    });
  }
}
