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

interface NotificationListResponse {
  data?: {
    items?: NotificationItem[];
    unreadCount?: number;
    meta?: { hasNext?: boolean };
  };
}

interface UnreadCountResponse {
  data?: { unreadCount?: number };
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

  async function markRead(id: string) {
    const target = items.value.find((n) => n._id === id);
    if (!target || target.read) {
      return;
    }
    // Optimistic — flip locally, then persist.
    target.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await $fetch(`/api/proxy/notification/${id}/read`, { method: 'PATCH' });
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
      await $fetch('/api/proxy/notification/read-all', { method: 'PATCH' });
    } catch {
      // ignore; next poll reconciles
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
    fetchUnreadCount,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
  };
}
