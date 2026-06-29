<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaginationBar,
  SearchField,
  StatCard,
  StatusTag,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
  toast,
} from "@gosource/ui";
import { useDebounce } from "@vueuse/core";
import { Check, ChevronDown, Ellipsis, LoaderCircle } from "lucide-vue-next";
import { useAdminHeader } from "~/composables/useAdminHeader";
import { useAdminListFetch } from "~/composables/useAdminListFetch";
import LoadErrorState from "~/components/shared/LoadErrorState.vue";

type FeedbackStatus = "new" | "reviewed" | "resolved";
type FeedbackRow = {
  id: string;
  message: string;
  category: string;
  businessName: string;
  email: string;
  page: string;
  status: FeedbackStatus;
  createdAt: string;
};

const STATUS_FILTERS: { value: "" | FeedbackStatus; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

const search = ref("");
const debouncedSearch = useDebounce(search, 400);
const statusFilter = ref<"" | FeedbackStatus>("");
const page = ref(1);
const pageSize = ref(10);

const apiQuery = computed(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
  status: statusFilter.value || undefined,
}));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>(
  "/api/feedback",
  // Disable the per-page cache so a post-action refresh() shows fresh rows
  // immediately instead of re-hydrating cached row VNodes (same as Messages).
  { query: apiQuery, pageCache: false },
);
const {
  data: statsData,
  pending: statsPending,
  refresh: refreshStats,
} = await useAdminListFetch<unknown>("/api/feedback/stats");

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" ? (value as Record<string, any>) : null;
}

const parsed = computed(() => {
  const root = asRecord(data.value);
  const body = asRecord(root?.data) ?? root;
  const list = Array.isArray(body?.feedback) ? body.feedback : [];
  const meta = asRecord(body?.meta) ?? {};
  const rows: FeedbackRow[] = list.map((raw: any) => ({
    id: String(raw?._id ?? raw?.id ?? ""),
    message: String(raw?.message ?? ""),
    category: String(raw?.category ?? "general"),
    businessName: String(raw?.businessName ?? ""),
    email: String(raw?.email ?? ""),
    page: String(raw?.page ?? ""),
    status: (String(raw?.status ?? "new") as FeedbackStatus) || "new",
    createdAt: String(raw?.createdAt ?? ""),
  }));
  return {
    rows,
    meta: {
      page: Number(meta.page) || 1,
      limit: Number(meta.limit) || pageSize.value,
      total: Number(meta.total) || rows.length,
      totalPages: Number(meta.totalPages) || 1,
      hasNext: Boolean(meta.hasNext),
      hasPrev: Boolean(meta.hasPrev),
    },
  };
});
const rows = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);
const tableLoading = computed(() => pending.value && rows.value.length === 0);

const lastStats = ref<{
  total: number;
  new: number;
  reviewed: number;
  resolved: number;
} | null>(null);
const stats = computed(() => {
  const root = asRecord(statsData.value);
  const body = asRecord(root?.data) ?? root;
  if (!body) return lastStats.value ?? { total: 0, new: 0, reviewed: 0, resolved: 0 };
  const next = {
    total: Number(body.total) || 0,
    new: Number(body.new) || 0,
    reviewed: Number(body.reviewed) || 0,
    resolved: Number(body.resolved) || 0,
  };
  lastStats.value = next;
  return next;
});
const statsLoading = computed(
  () => statsPending.value && statsData.value == null && lastStats.value == null,
);

const statusFilterLabel = computed(
  () =>
    STATUS_FILTERS.find((option) => option.value === statusFilter.value)?.label ??
    "All statuses",
);

const gridTemplate =
  "minmax(0,2.2fr) minmax(0,.7fr) minmax(0,1.1fr) minmax(0,.8fr) minmax(0,.9fr) 2.5rem";

function statusVariant(status: FeedbackStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "reviewed") return "info" as const;
  return "warning" as const;
}

function categoryLabel(category: string) {
  if (category === "bug") return "Bug";
  if (category === "feature") return "Feature";
  if (category === "other") return "Other";
  return "General";
}

function statusLabel(status: FeedbackStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Confirmation modal — stays open while the action runs and on failure;
// closes only on success, then refreshes the table + stats.
type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  run: () => Promise<void>;
};
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmError = ref<string | null>(null);
const confirmAction = ref<ConfirmAction | null>(null);

function onConfirmOpenChange(value: boolean) {
  if (confirmLoading.value) return;
  confirmOpen.value = value;
  if (!value) {
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
    confirmOpen.value = false;
    confirmAction.value = null;
  } catch (err: unknown) {
    confirmLoading.value = false;
    confirmError.value =
      (err as { data?: { message?: string } })?.data?.message ||
      (err as { message?: string })?.message ||
      "Could not update feedback. Please try again.";
  }
}

function requestStatusChange(row: FeedbackRow, status: FeedbackStatus) {
  if (row.status === status) return;
  confirmAction.value = {
    title: `Mark as ${status}?`,
    description: `This feedback will be marked as ${status}.`,
    confirmLabel: `Mark as ${status}`,
    run: async () => {
      await $fetch(`/api/feedback/${row.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      toast.success("Feedback updated");
      await Promise.all([refresh(), refreshStats()]);
    },
  };
  confirmError.value = null;
  confirmOpen.value = true;
}

watch(debouncedSearch, () => {
  page.value = 1;
});
watch(statusFilter, () => {
  page.value = 1;
});

const { updateHeader } = useAdminHeader();
updateHeader({ title: "Feedback" });
</script>

<template>
  <ClientOnly>
    <div class="flex min-w-0 flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" :value="statsLoading ? '—' : stats.total.toLocaleString()" />
        <StatCard label="New" :value="statsLoading ? '—' : stats.new.toLocaleString()" />
        <StatCard label="Reviewed" :value="statsLoading ? '—' : stats.reviewed.toLocaleString()" />
        <StatCard label="Resolved" :value="statsLoading ? '—' : stats.resolved.toLocaleString()" />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="w-full max-w-md">
          <SearchField v-model="search" placeholder="Search feedback" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="flex h-10 min-w-[10rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-grey-50 bg-white px-3 text-sm text-grey-900 transition hover:border-primary-300 data-[state=open]:border-primary-400"
            >
              <span>{{ statusFilterLabel }}</span>
              <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[10rem]">
            <DropdownMenuItem
              v-for="opt in STATUS_FILTERS"
              :key="opt.value"
              @select="statusFilter = opt.value"
            >
              <div class="flex w-full items-center justify-between gap-3">
                <span>{{ opt.label }}</span>
                <Check v-if="statusFilter === opt.value" class="size-4 text-primary-500" />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LoadErrorState
        v-if="error && rows.length === 0 && !tableLoading"
        :error="error"
        load-failed-title="Unable to load feedback"
        resource-label="feedback"
        @retry="refresh()"
      />

      <TableShell
        v-else
        class="flex flex-col overflow-visible rounded-xl border border-grey-50 bg-white"
      >
        <TableHeader
          class="shrink-0 overflow-hidden rounded-t-xl border-b border-grey-50 bg-white"
        >
          <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
            <TableCell><span class="font-medium">Message</span></TableCell>
            <TableCell><span class="font-medium">Category</span></TableCell>
            <TableCell><span class="font-medium">From</span></TableCell>
            <TableCell><span class="font-medium">Status</span></TableCell>
            <TableCell><span class="font-medium">Date</span></TableCell>
            <TableCell />
          </TableHeadRow>
        </TableHeader>

        <div v-if="tableLoading" class="min-h-0 flex-1">
          <TableSkeleton
            :columns="Array(6).fill({ kind: 'line', lineClass: 'w-full' })"
            :grid-template-columns="gridTemplate"
            :row-count="10"
          />
        </div>

        <TableBody v-else class="!max-h-none !overflow-visible">
          <TableRow
            v-if="rows.length === 0"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <TableCell class="col-span-6 py-12 text-center text-sm text-grey-500">
              No feedback yet.
            </TableCell>
          </TableRow>

          <TableRow
            v-for="row in rows"
            v-else
            :key="row.id"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <TableCell>
              <p class="line-clamp-2 text-sm text-grey-800">{{ row.message }}</p>
              <p v-if="row.page" class="mt-0.5 truncate text-xs text-grey-400">
                {{ row.page }}
              </p>
            </TableCell>
            <TableCell>
              <span class="text-sm text-grey-700">{{ categoryLabel(row.category) }}</span>
            </TableCell>
            <TableCell>
              <p class="truncate text-sm text-grey-800">{{ row.businessName || "—" }}</p>
              <p v-if="row.email" class="truncate text-xs text-grey-400">{{ row.email }}</p>
            </TableCell>
            <TableCell>
              <StatusTag :variant="statusVariant(row.status)" size="medium">
                {{ statusLabel(row.status) }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <span class="text-sm text-grey-700">{{ formatDate(row.createdAt) }}</span>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="!size-9 !rounded-full !border !border-grey-50 !bg-white !p-0"
                    :disabled="confirmLoading"
                    aria-label="Feedback actions"
                  >
                    <LoaderCircle
                      v-if="confirmLoading"
                      class="size-4 animate-spin text-primary-500"
                    />
                    <Ellipsis v-else class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem
                    :disabled="row.status === 'new'"
                    @select="requestStatusChange(row, 'new')"
                  >
                    Mark as new
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :disabled="row.status === 'reviewed'"
                    @select="requestStatusChange(row, 'reviewed')"
                  >
                    Mark as reviewed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    :disabled="row.status === 'resolved'"
                    @select="requestStatusChange(row, 'resolved')"
                  >
                    Mark as resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>

        <TableFooter
          v-if="!tableLoading && meta.total > 0"
          class="border-x border-b border-grey-50"
        >
          <PaginationBar
            :page="meta.page"
            :page-size="meta.limit"
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
      </TableShell>

      <Dialog :open="confirmOpen" @update:open="onConfirmOpenChange">
        <DialogContent class="z-[100]">
          <DialogHeader>
            <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
              <DialogTitle>{{ confirmAction?.title }}</DialogTitle>
            </div>
            <DialogClose :disabled="confirmLoading" />
          </DialogHeader>

          <DialogBody class="flex flex-col gap-3">
            <p class="text-sm text-grey-text">{{ confirmAction?.description }}</p>
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
              variant="primary"
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
    </div>
  </ClientOnly>
</template>
