<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import { PaginationBar, toast } from '@gosource/ui';
import { Bell, CheckCheck, Trash2 } from 'lucide-vue-next';
import {
  useNotifications,
  type NotificationItem,
  type NotificationListMeta,
} from '~/composables/useNotifications';
import { useCustomerSession } from '~/composables/useCustomerSession';

const {
  unreadCount,
  fetchPage,
  fetchUnreadCount,
  apiMarkRead,
  apiMarkAllRead,
  apiRemove,
  apiRemoveAllRead,
} = useNotifications();
const { whenReady } = useCustomerSession();

type Tab = 'all' | 'unread';
const PAGE_SIZE = 20;

const activeTab = ref<Tab>('all');
const page = ref(1);
const list = ref<NotificationItem[]>([]);
const meta = ref<NotificationListMeta>({});
const loading = ref(false);
const loaded = ref(false);

const hasReadItems = computed(() => list.value.some((n) => n.read));

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
  if (!n.read) {
    n.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await apiMarkRead(n._id);
      void fetchUnreadCount();
    } catch {
      // next load reconciles
    }
    // On the Unread tab a now-read item no longer belongs here.
    if (activeTab.value === 'unread') {
      list.value = list.value.filter((item) => item._id !== n._id);
    }
  }
  if (n.link) {
    await navigateTo(n.link);
  }
}

async function onDelete(n: NotificationItem) {
  const wasUnread = !n.read;
  list.value = list.value.filter((item) => item._id !== n._id);
  if (wasUnread) {
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
  try {
    await apiRemove(n._id);
    void fetchUnreadCount();
    // Refill the page (pull in the next item / correct the count).
    await load();
  } catch {
    toast.error('Could not delete notification');
    await load();
  }
}

async function markAllRead() {
  if (!unreadCount.value) return;
  try {
    await apiMarkAllRead();
    void fetchUnreadCount();
    await load();
    toast.success('All notifications marked as read');
  } catch {
    toast.error('Could not mark all as read');
  }
}

async function clearRead() {
  if (!hasReadItems.value) return;
  try {
    await apiRemoveAllRead();
    if (page.value > 1) page.value = 1;
    void fetchUnreadCount();
    await load();
    toast.success('Read notifications cleared');
  } catch {
    toast.error('Could not clear read notifications');
  }
}

onMounted(async () => {
  await whenReady();
  await load();
});
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-grey-900">Notifications</h1>
        <p class="mt-0.5 text-sm text-grey-500">
          {{ unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up.' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="unreadCount > 0"
          type="button"
          class="inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:underline"
          @click="markAllRead"
        >
          <CheckCheck class="size-4" aria-hidden="true" />
          Mark all read
        </button>
        <button
          v-if="hasReadItems"
          type="button"
          class="inline-flex items-center gap-1 text-sm font-medium text-negative-500 hover:underline"
          @click="clearRead"
        >
          <Trash2 class="size-4" aria-hidden="true" />
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
          '-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition',
          activeTab === tab
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-grey-500 hover:text-grey-800',
        ]"
        @click="selectTab(tab)"
      >
        {{ tab }}
      </button>
    </div>

    <div class="mt-4 rounded-xl border border-grey-50">
      <div
        v-if="loading && !list.length"
        class="px-4 py-16 text-center text-sm text-grey-300"
      >
        Loading…
      </div>

      <div
        v-else-if="loaded && !list.length"
        class="flex flex-col items-center gap-2 px-4 py-16 text-center"
      >
        <Bell class="size-8 text-grey-200" aria-hidden="true" />
        <p class="text-sm text-grey-400">
          {{ activeTab === 'unread' ? 'No unread notifications.' : 'No notifications yet.' }}
        </p>
      </div>

      <ul v-else class="divide-y divide-grey-50">
        <li
          v-for="n in list"
          :key="n._id"
          :class="[
            'group flex gap-3 px-4 py-3.5 transition hover:bg-grey-55/60',
            n.read ? '' : 'bg-primary-50/40',
          ]"
        >
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
            <p class="mt-0.5 text-xs text-grey-600">{{ n.message }}</p>
            <p class="mt-1 text-[11px] text-grey-300">{{ formatWhen(n.createdAt) }}</p>
          </div>
          <button
            type="button"
            class="self-start rounded-md p-1.5 text-grey-300 opacity-0 transition hover:bg-negative-50 hover:text-negative-500 focus:opacity-100 group-hover:opacity-100"
            aria-label="Delete notification"
            @click.stop="onDelete(n)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
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
