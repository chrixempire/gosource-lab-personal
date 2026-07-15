<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaginationBar,
  toast,
} from '@gosource/ui';
import {
  Bell,
  CheckCheck,
  Ellipsis,
  Eye,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  X,
} from 'lucide-vue-next';
import {
  useNotifications,
  type NotificationItem,
  type NotificationListMeta,
} from '~/composables/useNotifications';
import { useCustomerSession } from '~/composables/useCustomerSession';

const {
  unreadCount,
  latestStreamed,
  fetchPage,
  fetchUnreadCount,
  apiMarkRead,
  apiMarkUnread,
  apiMarkAllRead,
  apiRemove,
  apiRemoveAllRead,
  apiBulkMarkRead,
  apiBulkMarkUnread,
  apiBulkRemove,
} = useNotifications();
const { whenReady } = useCustomerSession();

type Tab = 'all' | 'unread';
const PAGE_SIZE = 25;

const activeTab = ref<Tab>('all');
const page = ref(1);
const list = ref<NotificationItem[]>([]);
const meta = ref<NotificationListMeta>({});
const loading = ref(false);
const loaded = ref(false);

const selectedIds = ref<string[]>([]);
const bulkLoading = ref<'read' | 'unread' | 'delete' | null>(null);
const headerLoading = ref<'markAll' | 'clearRead' | null>(null);
const openMenuId = ref<string | null>(null);

const hasReadItems = computed(() => list.value.some((n) => n.read));
const selectedCount = computed(() => selectedIds.value.length);
const selectedItems = computed(() =>
  list.value.filter((n) => selectedIds.value.includes(n._id)),
);
const allSelected = computed(
  () => list.value.length > 0 && selectedIds.value.length === list.value.length,
);
const someSelected = computed(
  () => selectedIds.value.length > 0 && !allSelected.value,
);
const headerCheckboxValue = computed<boolean | 'indeterminate'>(() =>
  allSelected.value ? true : someSelected.value ? 'indeterminate' : false,
);
const selectedHasUnread = computed(() =>
  selectedItems.value.some((n) => !n.read),
);
const selectedHasRead = computed(() => selectedItems.value.some((n) => n.read));

function clearSelection() {
  selectedIds.value = [];
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchPage({
      page: page.value,
      limit: PAGE_SIZE,
      unreadOnly: activeTab.value === 'unread',
    });
    list.value = res.items;
    meta.value = res.meta;
    unreadCount.value = res.unreadCount;
    loaded.value = true;
    clearSelection();
  } catch {
    // leave the previous view in place
  } finally {
    loading.value = false;
  }
}

async function selectTab(tab: Tab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  await load();
}

async function onPageChange(next: number) {
  page.value = next;
  await load();
}

function toggleSelect(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id];
}

function toggleSelectAll() {
  selectedIds.value = allSelected.value ? [] : list.value.map((n) => n._id);
}

function formatWhen(iso?: string) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(then).toLocaleDateString();
}

async function onRowClick(n: NotificationItem) {
  // A row click only marks the notification read — it does not navigate. The
  // deep link (and full detail) live behind the ⋯ menu → View details → Open.
  if (n.read) return;
  n.read = true;
  unreadCount.value = Math.max(0, unreadCount.value - 1);
  try {
    await apiMarkRead(n._id);
    void fetchUnreadCount();
  } catch {
    // next load reconciles
  }
  if (activeTab.value === 'unread') {
    list.value = list.value.filter((item) => item._id !== n._id);
  }
}

/**
 * "View details" — mark the notification read and route to the resource it
 * refers to (e.g. the updated order). Notifications without a deep link just
 * get marked read.
 */
async function viewDetails(n: NotificationItem) {
  if (!n.read) {
    n.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await apiMarkRead(n._id);
      void fetchUnreadCount();
    } catch {
      // next load reconciles
    }
  }
  if (n.link) {
    await navigateTo(n.link);
  } else {
    toast.info('No details to open for this notification');
  }
}

async function toggleReadOne(n: NotificationItem) {
  if (n.read) {
    n.read = false;
    unreadCount.value += 1;
    try {
      await apiMarkUnread(n._id);
      void fetchUnreadCount();
    } catch {
      // next load reconciles
    }
  } else {
    n.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await apiMarkRead(n._id);
      void fetchUnreadCount();
    } catch {
      // next load reconciles
    }
    if (activeTab.value === 'unread') {
      list.value = list.value.filter((item) => item._id !== n._id);
    }
  }
}

async function onDelete(n: NotificationItem) {
  const wasUnread = !n.read;
  list.value = list.value.filter((item) => item._id !== n._id);
  selectedIds.value = selectedIds.value.filter((id) => id !== n._id);
  if (wasUnread) {
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
  try {
    await apiRemove(n._id);
    void fetchUnreadCount();
    await load();
  } catch {
    toast.error('Could not delete notification');
    await load();
  }
}

async function bulkMarkRead() {
  if (bulkLoading.value) return;
  const ids = selectedItems.value.filter((n) => !n.read).map((n) => n._id);
  if (!ids.length) {
    clearSelection();
    return;
  }
  bulkLoading.value = 'read';
  try {
    await apiBulkMarkRead(ids);
    void fetchUnreadCount();
    await load();
    toast.success(`${ids.length} marked as read`);
  } catch {
    toast.error('Could not mark as read');
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkMarkUnread() {
  if (bulkLoading.value) return;
  const ids = selectedItems.value.filter((n) => n.read).map((n) => n._id);
  if (!ids.length) {
    clearSelection();
    return;
  }
  bulkLoading.value = 'unread';
  try {
    await apiBulkMarkUnread(ids);
    void fetchUnreadCount();
    await load();
    toast.success(`${ids.length} marked as unread`);
  } catch {
    toast.error('Could not mark as unread');
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkDelete() {
  if (bulkLoading.value) return;
  const ids = selectedItems.value.map((n) => n._id);
  if (!ids.length) return;
  // Deleting the whole page: step back a page so we don't land on an empty one.
  if (page.value > 1 && ids.length >= list.value.length) page.value -= 1;
  bulkLoading.value = 'delete';
  try {
    await apiBulkRemove(ids);
    void fetchUnreadCount();
    await load();
    toast.success(`${ids.length} deleted`);
  } catch {
    toast.error('Could not delete notifications');
    await load();
  } finally {
    bulkLoading.value = null;
  }
}

async function markAllRead() {
  if (headerLoading.value || !unreadCount.value) return;
  headerLoading.value = 'markAll';
  try {
    await apiMarkAllRead();
    void fetchUnreadCount();
    await load();
    toast.success('All notifications marked as read');
  } catch {
    toast.error('Could not mark all as read');
  } finally {
    headerLoading.value = null;
  }
}

async function clearRead() {
  if (headerLoading.value || !hasReadItems.value) return;
  headerLoading.value = 'clearRead';
  try {
    await apiRemoveAllRead();
    if (page.value > 1) page.value = 1;
    void fetchUnreadCount();
    await load();
    toast.success('Read notifications cleared');
  } catch {
    toast.error('Could not clear read notifications');
  } finally {
    headerLoading.value = null;
  }
}

/**
 * Merge a live (SSE-pushed) notification into the page's own list without a
 * reload. New notifications are always unread, so they belong in both tabs.
 */
function onStreamNotification(n: NotificationItem) {
  // Only page 1 shows the newest items; on later pages, leave ordering intact.
  if (page.value !== 1) {
    meta.value = { ...meta.value, total: (meta.value.total ?? 0) + 1 };
    return;
  }
  if (list.value.some((item) => item._id === n._id)) return;
  if (activeTab.value === 'unread' && n.read) return;

  const next = [n, ...list.value];
  const overflow = next.length > PAGE_SIZE;
  if (overflow) next.pop();
  list.value = next;
  const total = (meta.value.total ?? 0) + 1;
  meta.value = {
    ...meta.value,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    hasNext: (meta.value.hasNext ?? false) || overflow,
  };
}

watch(latestStreamed, (n) => {
  if (n) onStreamNotification(n);
});

onMounted(async () => {
  await whenReady();
  await load();
});
</script>

<template>
  <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-grey-500">
        {{ unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up.' }}
      </p>
      <div class="flex items-center gap-3">
        <button
          v-if="unreadCount > 0"
          type="button"
          :disabled="headerLoading !== null"
          class="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
          @click="markAllRead"
        >
          <Loader2 v-if="headerLoading === 'markAll'" class="size-4 animate-spin" aria-hidden="true" />
          <CheckCheck v-else class="size-4" aria-hidden="true" />
          Mark all read
        </button>
        <button
          v-if="hasReadItems"
          type="button"
          :disabled="headerLoading !== null"
          class="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-negative-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:no-underline"
          @click="clearRead"
        >
          <Loader2 v-if="headerLoading === 'clearRead'" class="size-4 animate-spin" aria-hidden="true" />
          <Trash2 v-else class="size-4" aria-hidden="true" />
          Clear read
        </button>
      </div>
    </div>

    <div class="mt-5 flex gap-2 border-b border-grey-50">
      <button
        v-for="tab in (['all', 'unread'] as const)"
        :key="tab"
        type="button"
        :class="[
          '-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium capitalize transition',
          activeTab === tab
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-grey-500 hover:text-grey-800',
        ]"
        @click="selectTab(tab)"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Bulk action bar -->
    <div
      v-if="selectedCount > 0"
      class="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-grey-50 px-3 py-2.5"
    >
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-1 rounded-md p-1 text-grey-500 hover:bg-grey-55 hover:text-grey-800"
        aria-label="Clear selection"
        @click="clearSelection"
      >
        <X class="size-4" aria-hidden="true" />
      </button>
      <span class="text-sm font-medium text-grey-800">
        {{ selectedCount }} selected
      </span>
      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <button
          v-if="selectedHasUnread"
          type="button"
          :disabled="bulkLoading !== null"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-grey-50 bg-background-on-canvas px-2.5 py-1.5 text-xs font-medium text-grey-800 transition hover:bg-grey-55/60 disabled:cursor-not-allowed disabled:opacity-60"
          @click="bulkMarkRead"
        >
          <Loader2 v-if="bulkLoading === 'read'" class="size-4 animate-spin" aria-hidden="true" />
          <MailOpen v-else class="size-4" aria-hidden="true" />
          Mark as read
        </button>
        <button
          v-if="selectedHasRead"
          type="button"
          :disabled="bulkLoading !== null"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-grey-50 bg-background-on-canvas px-2.5 py-1.5 text-xs font-medium text-grey-800 transition hover:bg-grey-55/60 disabled:cursor-not-allowed disabled:opacity-60"
          @click="bulkMarkUnread"
        >
          <Loader2 v-if="bulkLoading === 'unread'" class="size-4 animate-spin" aria-hidden="true" />
          <Mail v-else class="size-4" aria-hidden="true" />
          Mark as unread
        </button>
        <button
          type="button"
          :disabled="bulkLoading !== null"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-negative-100 bg-background-on-canvas px-2.5 py-1.5 text-xs font-medium text-negative-500 transition hover:bg-negative-50 disabled:cursor-not-allowed disabled:opacity-60"
          @click="bulkDelete"
        >
          <Loader2 v-if="bulkLoading === 'delete'" class="size-4 animate-spin" aria-hidden="true" />
          <Trash2 v-else class="size-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>

    <div class="mt-4 rounded-xl border border-grey-50">
      <ul
        v-if="loading && !list.length"
        class="divide-y divide-grey-50"
        aria-hidden="true"
      >
        <li
          v-for="i in 6"
          :key="i"
          class="flex items-start gap-3 px-4 py-3.5"
        >
          <div class="mt-0.5 size-4 shrink-0 animate-pulse rounded-[5px] bg-grey-50" />
          <div class="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-grey-50" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3.5 w-2/5 animate-pulse rounded-md bg-grey-50" />
            <div class="h-3 w-4/5 animate-pulse rounded-md bg-grey-50" />
            <div class="h-2.5 w-16 animate-pulse rounded-md bg-grey-50" />
          </div>
          <div class="size-7 shrink-0 animate-pulse rounded-md bg-grey-50" />
        </li>
      </ul>

      <div
        v-else-if="loaded && !list.length"
        class="flex flex-col items-center gap-2 px-4 py-16 text-center"
      >
        <Bell class="size-8 text-grey-200" aria-hidden="true" />
        <p class="text-sm text-grey-400">
          {{ activeTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}
        </p>
      </div>

      <template v-else>
        <!-- Select-all header -->
        <div
          class="flex items-center gap-3 border-b border-grey-50 px-4 py-2.5"
        >
          <Checkbox
            :model-value="headerCheckboxValue"
            aria-label="Select all notifications"
            @update:model-value="toggleSelectAll"
          />
          <span class="text-xs font-medium text-grey-400">
            {{ selectedCount > 0 ? `${selectedCount} selected` : 'Select all' }}
          </span>
        </div>

        <ul class="divide-y divide-grey-50">
          <li
            v-for="n in list"
            :key="n._id"
            :class="[
              'group flex items-start gap-3 px-4 py-3.5 transition hover:bg-grey-55/60',
              selectedIds.includes(n._id)
                ? 'bg-primary-50/60 dark:bg-primary-500/20'
                : n.read
                  ? ''
                  : 'bg-primary-50/40 dark:bg-primary-500/10',
            ]"
          >
            <div class="mt-0.5 shrink-0" @click.stop>
              <Checkbox
                :model-value="selectedIds.includes(n._id)"
                aria-label="Select notification"
                @update:model-value="() => toggleSelect(n._id)"
              />
            </div>

            <span
              :class="[
                'mt-1.5 size-2 shrink-0 rounded-full',
                n.read ? 'bg-transparent' : 'bg-primary-500',
              ]"
              aria-hidden="true"
            />

            <div
              role="button"
              tabindex="0"
              class="min-w-0 flex-1 cursor-pointer"
              @click="onRowClick(n)"
              @keydown.enter.prevent="onRowClick(n)"
            >
              <p class="truncate text-sm font-semibold text-grey-900">{{ n.title }}</p>
              <p class="mt-0.5 text-xs text-grey-600 dark:text-grey-300">{{ n.message }}</p>
              <p class="mt-1 text-[11px] text-grey-300">{{ formatWhen(n.createdAt) }}</p>
            </div>

            <!-- Per-row actions menu (kebab) — far right, revealed on hover/focus -->
            <div
              class="shrink-0 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 data-[open=true]:opacity-100"
              :data-open="openMenuId === n._id"
              @click.stop
            >
              <DropdownMenu @update:open="(o: boolean) => (openMenuId = o ? n._id : null)">
                <DropdownMenuTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-grey-400 transition hover:bg-grey-55 hover:text-grey-800"
                    aria-label="Notification actions"
                  >
                    <Ellipsis class="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-52">
                  <DropdownMenuItem class="gap-2.5" @select="viewDetails(n)">
                    <Eye class="size-4" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem class="gap-2.5" @select="toggleReadOne(n)">
                    <component :is="n.read ? Mail : MailOpen" class="size-4" />
                    {{ n.read ? 'Mark as unread' : 'Mark as read' }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="gap-2.5 text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
                    @select="onDelete(n)"
                  >
                    <Trash2 class="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <PaginationBar
      v-if="(meta.total ?? 0) > 0"
      plain
      class="mt-4"
      :page="meta.page ?? 1"
      :total-pages="meta.totalPages ?? 1"
      :total-items="meta.total ?? 0"
      :page-size="meta.limit ?? PAGE_SIZE"
      :has-next-page="meta.hasNext ?? false"
      :has-prev-page="meta.hasPrev ?? false"
      :disabled="loading"
      @change="onPageChange"
    />
  </div>
</template>
