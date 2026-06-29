<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  RadioGroup,
  RadioGroupItem,
  SearchField,
  StatCard,
} from "@gosource/ui";
import { useDebounce, useIntervalFn } from "@vueuse/core";
import { Bell, Mail, Plus } from "lucide-vue-next";
import { useAdminHeader } from "~/composables/useAdminHeader";
import LoadErrorState from "~/components/shared/LoadErrorState.vue";
import MessageTable from "~/components/messages/MessageTable.vue";
import { useAdminListFetch } from "~/composables/useAdminListFetch";
import { useMessageMutations } from "~/composables/useMessageMutations";
import { ADMIN_PAGE_ROUTES, messageAlertEditPath } from "~/lib/admin-routes";
import { parseMessagesResponse, parseMessageStats } from "~/lib/message-api";
import type { AdminMessageRow, AdminMessageType } from "~/types/messages";

type SortKey = "message" | "type" | "status" | "createdAt";

const search = ref("");
const debouncedSearch = useDebounce(search, 400);
const selectedIds = ref<string[]>([]);
const sortKey = ref<SortKey>("createdAt");
const sortOrder = ref<"asc" | "desc">("desc");
const page = ref(1);
const pageSize = ref(10);
const sendDialogOpen = ref(false);
const selectedMessageType = ref<AdminMessageType | null>(null);
const {
  busyMessageId,
  runMessageAction,
  deleteMessage: removeMessage,
} = useMessageMutations();

const apiQuery = computed(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
  sortBy: sortKey.value,
  sortOrder: sortOrder.value,
}));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>(
  "/api/messages",
  {
    query: apiQuery,
    // Delivery polling already keeps this page fresh. Avoid hydrating cached
    // row VNodes while a live response is updating the same table.
    pageCache: false,
  },
);
const {
  data: statsData,
  pending: statsPending,
  error: statsError,
  refresh: refreshStats,
} = await useAdminListFetch<unknown>("/api/messages/stats");

const parsed = computed(() =>
  parseMessagesResponse(data.value, page.value, pageSize.value),
);
const rows = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);
// Hold the last good stats so a transient empty payload during a refresh
// (or a fetch-key change) never blanks the cards to 0 until a full reload.
const lastStats = ref<ReturnType<typeof parseMessageStats> | null>(null);
const stats = computed(() => {
  if (statsData.value == null) {
    return lastStats.value ?? { total: 0, alerts: 0, emails: 0 };
  }
  const parsed = parseMessageStats(statsData.value);
  lastStats.value = parsed;
  return parsed;
});
const tableLoading = computed(() => pending.value && rows.value.length === 0);
// Show the skeleton only on the very first load (no data and nothing cached).
const statsLoading = computed(
  () =>
    statsPending.value && statsData.value == null && lastStats.value == null,
);
const hasPendingDeliveries = computed(() =>
  rows.value.some((row) => row.status === "pending"),
);
const { pause: pauseDeliveryRefresh, resume: resumeDeliveryRefresh } =
  useIntervalFn(() => refresh(), 5000, { immediate: false });

watch(
  hasPendingDeliveries,
  (hasPending) =>
    hasPending ? resumeDeliveryRefresh() : pauseDeliveryRefresh(),
  { immediate: true },
);

watch(debouncedSearch, () => {
  page.value = 1;
});

watch(
  () => meta.value.totalPages,
  (value) => {
    if (page.value > value) page.value = value;
  },
);

function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortOrder.value = "asc";
}

// Confirmation modal: stays open while the action runs and on failure;
// closes only when the endpoint succeeds.
type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  showRecipients?: boolean;
  run: () => Promise<void>;
};
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmError = ref<string | null>(null);
const confirmAction = ref<ConfirmAction | null>(null);
const confirmRecipients = ref<string[] | null>(null);
const confirmRecipientsLoading = ref(false);

function requestConfirm(action: ConfirmAction) {
  confirmAction.value = action;
  confirmError.value = null;
  confirmRecipients.value = null;
  confirmRecipientsLoading.value = false;
  confirmOpen.value = true;
}

async function loadConfirmRecipients(id: string) {
  confirmRecipients.value = null;
  confirmRecipientsLoading.value = true;
  try {
    const res = await $fetch<{ data?: { recipients?: string[] } }>(
      `/api/messages/${id}`,
    );
    const recipients = res?.data?.recipients;
    confirmRecipients.value = Array.isArray(recipients) ? recipients : [];
  } catch {
    confirmRecipients.value = [];
  } finally {
    confirmRecipientsLoading.value = false;
  }
}

function onConfirmOpenChange(open: boolean) {
  // Block dismissal while the action is in flight.
  if (confirmLoading.value) return;
  confirmOpen.value = open;
  if (!open) {
    confirmAction.value = null;
    confirmError.value = null;
  }
}

async function runConfirm() {
  if (!confirmAction.value) return;
  confirmLoading.value = true;
  confirmError.value = null;
  try {
    await confirmAction.value.run();
    confirmLoading.value = false;
    confirmOpen.value = false; // success → close
    confirmAction.value = null;
  } catch (err: unknown) {
    confirmLoading.value = false;
    const data = (err as { data?: { message?: string } })?.data;
    confirmError.value =
      data?.message ||
      (err as { message?: string })?.message ||
      "Something went wrong. Please try again.";
    // failure → modal stays open so the action can be retried
  }
}

function toggleStatus(row: AdminMessageRow) {
  if (row.type !== "alert") return;
  const activating = row.status !== "active";
  requestConfirm({
    title: activating ? "Activate alert?" : "Deactivate alert?",
    description: activating
      ? "This alert will become visible to customers."
      : "This alert will be hidden from customers.",
    confirmLabel: activating ? "Activate" : "Deactivate",
    run: async () => {
      await runMessageAction(row.id, activating ? "activate" : "deactivate");
      await refresh();
    },
  });
}

function resendMessage(row: AdminMessageRow) {
  requestConfirm({
    title: "Resend email?",
    description: `Resend "${row.subject || row.message}" to its recipients.`,
    confirmLabel: "Resend",
    showRecipients: true,
    run: async () => {
      await runMessageAction(row.id, "resend");
      await refresh();
    },
  });
  void loadConfirmRecipients(row.id);
}

function editMessage(row: AdminMessageRow) {
  void navigateTo(messageAlertEditPath(row.id));
}

function deleteMessage(id: string) {
  requestConfirm({
    title: "Delete message?",
    description: "This permanently deletes the message and cannot be undone.",
    confirmLabel: "Delete",
    destructive: true,
    run: async () => {
      await removeMessage(id);
      selectedIds.value = selectedIds.value.filter(
        (selectedId) => selectedId !== id,
      );
      await Promise.all([refresh(), refreshStats()]);
    },
  });
}

function openSendDialog() {
  selectedMessageType.value = null;
  sendDialogOpen.value = true;
}

function continueToMessageForm() {
  if (!selectedMessageType.value) return;
  sendDialogOpen.value = false;
  void navigateTo(
    selectedMessageType.value === "alert"
      ? ADMIN_PAGE_ROUTES.MESSAGE_ALERT_CREATE
      : ADMIN_PAGE_ROUTES.MESSAGE_EMAIL_CREATE,
  );
}

const { updateHeader } = useAdminHeader();
updateHeader({ title: "Messages" });
</script>

<template>
  <ClientOnly>
    <div class="flex min-w-0 flex-col gap-4">
      <div class="flex justify-end">
        <Button
          type="button"
          size="small"
          class="!w-fit"
          :left-icon="Plus"
          @click="openSendDialog"
        >
          Send message
        </Button>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total messages"
          :value="statsLoading ? '—' : stats.total.toLocaleString()"
        />
        <StatCard
          label="Alert messages"
          :value="statsLoading ? '—' : stats.alerts.toLocaleString()"
        />
        <StatCard
          label="Email messages"
          :value="statsLoading ? '—' : stats.emails.toLocaleString()"
        />
      </div>

      <LoadErrorState
        v-if="statsError"
        :error="statsError"
        compact
        resource-label="message statistics"
        @retry="refreshStats"
      />

      <div class="w-full max-w-md">
        <SearchField v-model="search" placeholder="Search messages" />
      </div>

      <!--

      Legacy table rendering has moved to MessageTable.
          class="overflow-hidden rounded-t-xl border-b border-grey-50 bg-white"
        >
          <TableHeadRow
            class="min-w-[850px]"
            :style="{
              gridTemplateColumns:
                '48px minmax(280px,2.4fr) minmax(100px,.7fr) minmax(110px,.8fr) minmax(170px,1fr) 56px',
            }"
          >
            <TableCell class="flex items-center">
              <MessageTableCheckbox
                :model-value="selectionState"
                label="Select all messages on this page"
                @update:model-value="toggleAll"
              />
            </TableCell>
            <TableCell>
              <button
                class="inline-flex items-center gap-1 font-medium"
                @click="setSort('message')"
              >
                Message
                <component
                  :is="sortOrder === 'asc' ? ArrowUp : ArrowDown"
                  v-if="sortKey === 'message'"
                  class="size-3.5"
                />
              </button>
            </TableCell>
            <TableCell>
              <button
                class="inline-flex items-center gap-1 font-medium"
                @click="setSort('type')"
              >
                Type
                <component
                  :is="sortOrder === 'asc' ? ArrowUp : ArrowDown"
                  v-if="sortKey === 'type'"
                  class="size-3.5"
                />
              </button>
            </TableCell>
            <TableCell>
              <button
                class="inline-flex items-center gap-1 font-medium"
                @click="setSort('status')"
              >
                Status
                <component
                  :is="sortOrder === 'asc' ? ArrowUp : ArrowDown"
                  v-if="sortKey === 'status'"
                  class="size-3.5"
                />
              </button>
            </TableCell>
            <TableCell>
              <button
                class="inline-flex items-center gap-1 font-medium"
                @click="setSort('createdAt')"
              >
                Date added
                <component
                  :is="sortOrder === 'asc' ? ArrowUp : ArrowDown"
                  v-if="sortKey === 'createdAt'"
                  class="size-3.5"
                />
              </button>
            </TableCell>
            <TableCell />
          </TableHeadRow>
        </TableHeader>

        <div v-if="showTableSkeleton" class="min-h-0 flex-1">
          <TableSkeleton
            :columns="[
              { kind: 'checkbox' },
              { kind: 'line', lineClass: 'h-4 w-full' },
              { kind: 'line', lineClass: 'h-4 w-full' },
              { kind: 'line', lineClass: 'h-6 w-20 rounded-full' },
              { kind: 'line', lineClass: 'h-4 w-36' },
              { kind: 'action', boxClass: 'size-9' },
            ]"
            grid-template-columns="48px minmax(280px,2.4fr) minmax(100px,.7fr) minmax(110px,.8fr) minmax(170px,1fr) 56px"
            :row-count="pageSize"
            row-class="min-w-[850px] min-h-[72px] bg-white"
            body-class="!max-h-none overflow-x-auto"
          />
        </div>
        <TableBody v-else class="!max-h-none min-h-72 overflow-x-auto">
          <LoadErrorState
            v-if="error && rows.length === 0"
            :error="error"
            compact
            resource-label="messages"
            @retry="refresh"
          />
          <div
            v-if="!error && rows.length === 0"
            class="flex min-h-72 flex-col items-center justify-center px-6 text-center"
          >
            <div
              class="flex size-12 items-center justify-center rounded-full bg-grey-55 text-grey-400"
            >
              <Mail class="size-5" />
            </div>
            <p class="mt-4 text-base font-semibold text-grey-900">
              No messages found
            </p>
            <p class="mt-1 max-w-md text-sm text-grey-400">
              {{
                search
                  ? "Try changing your search term."
                  : "Send a message to start communicating with customers."
              }}
            </p>
          </div>

          <TableRow
            v-for="row in rows"
            :key="row.id"
            class="min-w-[850px] bg-white"
            :style="{
              gridTemplateColumns:
                '48px minmax(280px,2.4fr) minmax(100px,.7fr) minmax(110px,.8fr) minmax(170px,1fr) 56px',
            }"
          >
            <TableCell class="flex items-center" @click.stop>
              <MessageTableCheckbox
                :model-value="selectedSet.has(row.id)"
                :label="`Select ${row.message}`"
                @update:model-value="toggleRow(row.id, $event)"
              />
            </TableCell>
            <TableCell>
              <p v-if="row.subject" class="text-sm font-semibold text-grey-900">
                {{ row.subject }}
              </p>
              <p class="line-clamp-2 text-sm text-grey-700">
                {{ row.message }}
              </p>
            </TableCell>
            <TableCell>
              <div class="inline-flex items-center gap-2 text-sm text-grey-700">
                <Mail
                  v-if="row.type === 'email'"
                  class="size-4 text-primary-500"
                />
                <Bell v-else class="size-4 text-warning-600" />
                {{ typeLabel(row.type) }}
              </div>
            </TableCell>
            <TableCell>
              <StatusTag :variant="statusVariant(row.status)" size="medium">
                {{ statusLabel(row.status) }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <p class="text-sm text-grey-700">
                {{ formatDate(row.createdAt) }}
              </p>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
                    aria-label="Message actions"
                  >
                    <Ellipsis class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-52">
                  <DropdownMenuItem
                    v-if="row.type === 'email'"
                    :disabled="
                      busyMessageId === row.id || row.status === 'pending'
                    "
                    @select="resendMessage(row)"
                  >
                    Resend message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-else
                    :disabled="busyMessageId === row.id"
                    @select="editMessage(row)"
                  >
                    Edit message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="row.type === 'alert'"
                    :disabled="busyMessageId === row.id"
                    @select="toggleStatus(row)"
                  >
                    {{
                      row.status === "active"
                        ? "Deactivate message"
                        : "Activate message"
                    }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-negative-500"
                    :disabled="
                      busyMessageId === row.id || row.status === 'pending'
                    "
                    @select="deleteMessage(row.id)"
                  >
                    Delete message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>

        <TableFooter v-if="!showTableSkeleton && rows.length > 0">
          <PaginationBar
            :page="page"
            :page-size="pageSize"
            :total-pages="meta.totalPages"
            :total-items="meta.total"
            :has-next-page="meta.hasNext"
            :has-prev-page="meta.hasPrev"
            @change="page = $event"
            @page-size-change="
              pageSize = $event;
              page = 1;
            "
          />
        </TableFooter>
      -->

      <LoadErrorState
        v-if="error && rows.length === 0 && !tableLoading"
        :error="error"
        load-failed-title="Unable to load messages"
        resource-label="message list"
        @retry="refresh()"
      />

      <MessageTable
        v-else
        v-model:selected-ids="selectedIds"
        :messages="rows"
        :meta="meta"
        :loading="tableLoading"
        :busy-message-id="busyMessageId"
        :sort-key="sortKey"
        :sort-order="sortOrder"
        :search-active="Boolean(search)"
        @page="page = $event"
        @page-size="
          pageSize = $event;
          page = 1;
        "
        @sort="setSort"
        @resend="resendMessage"
        @edit="editMessage"
        @toggle-status="toggleStatus"
        @delete="deleteMessage"
      />

      <Dialog :open="confirmOpen" @update:open="onConfirmOpenChange">
        <DialogContent class="z-[100]">
          <DialogHeader>
            <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
              <DialogTitle>{{ confirmAction?.title }}</DialogTitle>
            </div>
            <DialogClose class="shrink-0" :disabled="confirmLoading" />
          </DialogHeader>

          <DialogBody class="flex flex-col gap-3">
            <p class="text-sm text-grey-text">
              {{ confirmAction?.description }}
            </p>

            <div v-if="confirmAction?.showRecipients">
              <p
                class="text-xs font-medium uppercase tracking-wide text-grey-500"
              >
                Recipients
              </p>
              <p
                v-if="confirmRecipientsLoading"
                class="mt-1 text-sm text-grey-400"
              >
                Loading recipients…
              </p>
              <p
                v-else-if="confirmRecipients && confirmRecipients.length"
                class="mt-1 break-words text-sm text-grey-700"
              >
                {{ confirmRecipients.join(", ") }}
              </p>
              <p v-else class="mt-1 text-sm text-grey-400">
                No recipients found.
              </p>
            </div>

            <p
              v-if="confirmError"
              class="rounded-lg bg-negative-50 px-3 py-2 text-sm text-negative-600"
            >
              {{ confirmError }}
            </p>
          </DialogBody>

          <DialogFooter class="grid grid-cols-2 gap-3">
            <Button
              variant="neutral"
              size="medium"
              class="w-full"
              :disabled="confirmLoading"
              @click="onConfirmOpenChange(false)"
            >
              Cancel
            </Button>
            <Button
              :variant="confirmAction?.destructive ? 'destructive' : 'primary'"
              size="medium"
              class="w-full"
              :loading="confirmLoading"
              @click="runConfirm"
            >
              {{ confirmAction?.confirmLabel }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog v-model:open="sendDialogOpen">
        <DialogContent>
          <DialogHeader class="!flex-col !items-start !justify-start !gap-0.5">
            <DialogTitle class="!text-lg !font-semibold"
              >Send message</DialogTitle
            >
            <DialogDescription class="text-sm"
              >Choose message type</DialogDescription
            >
          </DialogHeader>
          <DialogBody>
            <RadioGroup
              v-model="selectedMessageType"
              class="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <div
                role="radio"
                tabindex="0"
                :aria-checked="selectedMessageType === 'alert'"
                class="relative cursor-pointer rounded-2xl border p-4 text-left transition hover:border-primary-300 hover:bg-primary-50/30"
                :class="
                  selectedMessageType === 'alert'
                    ? 'border-primary-500 bg-primary-50/60'
                    : 'border-grey-50 bg-white'
                "
                @click="selectedMessageType = 'alert'"
                @keydown.enter.prevent="selectedMessageType = 'alert'"
                @keydown.space.prevent="selectedMessageType = 'alert'"
              >
                <RadioGroupItem
                  value="alert"
                  aria-label="Alert message"
                  class="absolute right-4 top-4"
                  @click.stop
                />
                <span
                  class="flex size-10 items-center justify-center rounded-xl bg-warning-75 text-warning-700"
                >
                  <Bell class="size-5" />
                </span>
                <span class="mt-4 block text-sm font-semibold text-grey-900"
                  >Alert message</span
                >
                <span class="mt-1 block text-xs leading-5 text-grey-400"
                  >Display a timed in-app announcement to customers.</span
                >
              </div>
              <div
                role="radio"
                tabindex="0"
                :aria-checked="selectedMessageType === 'email'"
                class="relative cursor-pointer rounded-2xl border p-4 text-left transition hover:border-primary-300 hover:bg-primary-50/30"
                :class="
                  selectedMessageType === 'email'
                    ? 'border-primary-500 bg-primary-50/60'
                    : 'border-grey-50 bg-white'
                "
                @click="selectedMessageType = 'email'"
                @keydown.enter.prevent="selectedMessageType = 'email'"
                @keydown.space.prevent="selectedMessageType = 'email'"
              >
                <RadioGroupItem
                  value="email"
                  aria-label="Email message"
                  class="absolute right-4 top-4"
                  @click.stop
                />
                <span
                  class="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
                >
                  <Mail class="size-5" />
                </span>
                <span class="mt-4 block text-sm font-semibold text-grey-900"
                  >Email message</span
                >
                <span class="mt-1 block text-xs leading-5 text-grey-400"
                  >Send an email to selected customers or everyone.</span
                >
              </div>
            </RadioGroup>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              size="small"
              variant="outline"
              @click="sendDialogOpen = false"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="small"
              :disabled="!selectedMessageType"
              @click="continueToMessageForm"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </ClientOnly>
</template>
