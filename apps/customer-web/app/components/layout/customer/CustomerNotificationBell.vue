<script setup lang="ts">
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { Bell, CheckCheck } from 'lucide-vue-next';
import { CUSTOMER_FLOATING_LAYER_Z } from '~/lib/customer-overlay-z';
import { useNotifications, type NotificationItem } from '~/composables/useNotifications';

const {
  items,
  unreadCount,
  loading,
  loaded,
  fetchList,
  markRead,
  markAllRead,
  startPolling,
  stopPolling,
} = useNotifications();

const open = ref(false);

onMounted(() => startPolling());
onBeforeUnmount(() => stopPolling());

// Load the list the first time the dropdown opens, and refresh on each open.
watch(open, (isOpen) => {
  if (isOpen) {
    void fetchList();
  }
});

const badgeLabel = computed(() =>
  unreadCount.value > 99 ? '99+' : String(unreadCount.value),
);

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
  await markRead(n._id);
  open.value = false;
  if (n.link) {
    await navigateTo(n.link);
  }
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="relative inline-flex size-10 items-center justify-center rounded-full border border-grey-50 bg-background-on-canvas text-grey-900 transition hover:bg-grey-55/60"
        aria-label="Notifications"
      >
        <Bell class="size-5" aria-hidden="true" />
        <span
          v-if="unreadCount > 0"
          class="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-negative-500 px-1 text-[10px] font-bold leading-none text-white"
        >
          {{ badgeLabel }}
        </span>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      :class="cn('w-[22rem] max-w-[calc(100vw-2rem)] p-0', CUSTOMER_FLOATING_LAYER_Z)"
    >
      <div class="flex items-center justify-between border-b border-grey-50 px-4 py-3">
        <p class="text-sm font-semibold text-grey-900">Notifications</p>
        <button
          v-if="unreadCount > 0"
          type="button"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:underline"
          @click="markAllRead"
        >
          <CheckCheck class="size-4" aria-hidden="true" />
          Mark all read
        </button>
      </div>

      <div class="max-h-[24rem] overflow-y-auto">
        <div
          v-if="loading && !items.length"
          class="px-4 py-10 text-center text-sm text-grey-300"
        >
          Loading…
        </div>

        <div
          v-else-if="loaded && !items.length"
          class="px-4 py-10 text-center text-sm text-grey-300"
        >
          You’re all caught up.
        </div>

        <ul v-else class="divide-y divide-grey-50">
          <li
            v-for="n in items"
            :key="n._id"
            role="button"
            tabindex="0"
            :class="[
              'flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-grey-55/60',
              n.read ? '' : 'bg-primary-50/40',
            ]"
            @click="onRowClick(n)"
            @keydown.enter.prevent="onRowClick(n)"
          >
            <span
              :class="[
                'mt-1.5 size-2 shrink-0 rounded-full',
                n.read ? 'bg-transparent' : 'bg-primary-500',
              ]"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-grey-900">{{ n.title }}</p>
              <p class="mt-0.5 line-clamp-2 text-xs text-grey-600">{{ n.message }}</p>
              <p class="mt-1 text-[11px] text-grey-300">{{ formatWhen(n.createdAt) }}</p>
            </div>
          </li>
        </ul>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
