import { useCustomerSession } from '~/composables/useCustomerSession';

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

interface NotificationListResponse {
  data?: {
    items?: NotificationItem[];
    unreadCount?: number;
    meta?: NotificationListMeta;
  };
}

interface UnreadCountResponse {
  data?: { unreadCount?: number };
}

export interface NotificationPage {
  items: NotificationItem[];
  unreadCount: number;
  meta: NotificationListMeta;
}

const POLL_INTERVAL_MS = 30_000;

/**
 * Customer notification bell state: shared list + unread count, polled while a
 * session is active, with mark-read helpers. Polling (not SSE) is deliberate —
 * simpler and reliable; the backend also exposes an SSE stream for a later
 * upgrade.
 */
export function useNotifications() {
  const { hasSession } = useCustomerSession();

  const items = useState<NotificationItem[]>('customer-notifications', () => []);
  const unreadCount = useState<number>('customer-notifications-unread', () => 0);
  const loading = useState<boolean>('customer-notifications-loading', () => false);
  const loaded = useState<boolean>('customer-notifications-loaded', () => false);

  async function fetchUnreadCount() {
    if (!hasSession.value) {
      return;
    }
    try {
      const res = await $fetch<UnreadCountResponse>(
        '/api/proxy/notification/unread-count',
      );
      unreadCount.value = Number(res?.data?.unreadCount ?? 0);
    } catch {
      // ignore — badge just won't update this tick
    }
  }

  async function fetchList() {
    if (!hasSession.value) {
      return;
    }
    loading.value = true;
    try {
      const res = await $fetch<NotificationListResponse>('/api/proxy/notification', {
        query: { page: 1, limit: 20 },
      });
      items.value = res?.data?.items ?? [];
      unreadCount.value = Number(res?.data?.unreadCount ?? unreadCount.value);
      loaded.value = true;
    } catch {
      // keep whatever we had
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch one page of notifications WITHOUT touching the shared bell state, so a
   * full-page view (All / Unread, paginated) can keep its own list. Also used to
   * refresh the bell badge as a side effect via the returned unreadCount.
   */
  async function fetchPage(
    opts: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ): Promise<NotificationPage> {
    const res = await $fetch<NotificationListResponse>('/api/proxy/notification', {
      query: {
        page: opts.page ?? 1,
        limit: opts.limit ?? 20,
        ...(opts.unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
    return {
      items: res?.data?.items ?? [],
      unreadCount: Number(res?.data?.unreadCount ?? 0),
      meta: res?.data?.meta ?? {},
    };
  }

  // --- raw API actions (no state assumptions) — reused by the page view ---
  async function apiMarkRead(id: string) {
    await $fetch(`/api/proxy/notification/${id}/read`, { method: 'PATCH' });
  }
  async function apiMarkAllRead() {
    await $fetch('/api/proxy/notification/read-all', { method: 'PATCH' });
  }
  async function apiRemove(id: string) {
    await $fetch(`/api/proxy/notification/${id}`, { method: 'DELETE' });
  }
  async function apiRemoveAllRead() {
    await $fetch('/api/proxy/notification/read', { method: 'DELETE' });
  }

  async function markRead(id: string) {
    const target = items.value.find((n) => n._id === id);
    if (!target || target.read) {
      return;
    }
    // Optimistic — flip locally, then persist.
    target.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await apiMarkRead(id);
    } catch {
      // ignore; next poll reconciles
    }
  }

  async function markAllRead() {
    if (!unreadCount.value) {
      return;
    }
    items.value = items.value.map((n) => ({ ...n, read: true }));
    unreadCount.value = 0;
    try {
      await apiMarkAllRead();
    } catch {
      // ignore; next poll reconciles
    }
  }

  async function remove(id: string) {
    const target = items.value.find((n) => n._id === id);
    // Optimistic — drop locally, fixing the badge if it was unread.
    if (target && !target.read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
    items.value = items.value.filter((n) => n._id !== id);
    try {
      await apiRemove(id);
    } catch {
      // ignore; next poll/refetch reconciles
    }
  }

  async function removeAllRead() {
    items.value = items.value.filter((n) => !n.read);
    try {
      await apiRemoveAllRead();
    } catch {
      // ignore; next poll/refetch reconciles
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    if (!import.meta.client || timer) {
      return;
    }
    void fetchUnreadCount();
    timer = setInterval(() => void fetchUnreadCount(), POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    items,
    unreadCount,
    loading,
    loaded,
    fetchList,
    fetchPage,
    fetchUnreadCount,
    markRead,
    markAllRead,
    remove,
    removeAllRead,
    apiMarkRead,
    apiMarkAllRead,
    apiRemove,
    apiRemoveAllRead,
    startPolling,
    stopPolling,
  };
}
