<script setup lang="ts">
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PaginationBar,
  SearchField,
  TableBody,
  TableCell,
  TableFooter,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from "@gosource/ui";
import { useDebounce } from "@vueuse/core";
import { Check, ChevronDown, Star } from "lucide-vue-next";
import { useAdminListFetch } from "~/composables/useAdminListFetch";
import LoadErrorState from "~/components/shared/LoadErrorState.vue";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  businessName: string;
  email: string;
  orderReference: string;
  createdAt: string;
};

const RATING_FILTERS: { value: "" | number; label: string }[] = [
  { value: "", label: "All ratings" },
  { value: 5, label: "5 Very easy" },
  { value: 4, label: "4 Easy" },
  { value: 3, label: "3 Okay" },
  { value: 2, label: "2 Hard" },
  { value: 1, label: "1 Very hard" },
];

const search = ref("");
const debouncedSearch = useDebounce(search, 400);
const ratingFilter = ref<"" | number>("");
const page = ref(1);
const pageSize = ref(10);

const apiQuery = computed(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
  rating: ratingFilter.value || undefined,
}));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>(
  "/api/reviews",
  { query: apiQuery, pageCache: false },
);
const { data: statsData, pending: statsPending } =
  await useAdminListFetch<unknown>("/api/reviews/stats");

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" ? (value as Record<string, any>) : null;
}

const parsed = computed(() => {
  const body = asRecord(asRecord(data.value)?.data) ?? asRecord(data.value);
  const list = Array.isArray(body?.reviews) ? body.reviews : [];
  const meta = asRecord(body?.meta) ?? {};
  const rows: ReviewRow[] = list.map((raw: any) => ({
    id: String(raw?._id ?? raw?.id ?? ""),
    rating: Number(raw?.rating) || 0,
    comment: String(raw?.comment ?? ""),
    businessName: String(raw?.businessName ?? ""),
    email: String(raw?.email ?? ""),
    orderReference: String(
      asRecord(raw?.order)?.reference ?? raw?.orderReference ?? "",
    ),
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
  average: number;
  distribution: Record<number, number>;
} | null>(null);
const stats = computed(() => {
  const body = asRecord(asRecord(statsData.value)?.data) ?? asRecord(statsData.value);
  if (!body)
    return lastStats.value ?? { total: 0, average: 0, distribution: {} as Record<number, number> };
  const dist = asRecord(body.distribution) ?? {};
  const next = {
    total: Number(body.total) || 0,
    average: Number(body.average) || 0,
    distribution: {
      1: Number(dist[1]) || 0,
      2: Number(dist[2]) || 0,
      3: Number(dist[3]) || 0,
      4: Number(dist[4]) || 0,
      5: Number(dist[5]) || 0,
    } as Record<number, number>,
  };
  lastStats.value = next;
  return next;
});
const statsLoading = computed(
  () => statsPending.value && statsData.value == null && lastStats.value == null,
);
function distPercent(star: number) {
  const total = stats.value.total;
  if (!total) return 0;
  return Math.round(((stats.value.distribution[star] ?? 0) / total) * 100);
}

const ratingFilterLabel = computed(
  () =>
    RATING_FILTERS.find((option) => option.value === ratingFilter.value)?.label ??
    "All ratings",
);

const gridTemplate =
  "minmax(0,1fr) minmax(0,2fr) minmax(0,.9fr) minmax(0,1.2fr) minmax(0,1fr)";

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

const detailOpen = ref(false);
const selected = ref<ReviewRow | null>(null);
function openDetail(row: ReviewRow) {
  selected.value = row;
  detailOpen.value = true;
}

watch(debouncedSearch, () => {
  page.value = 1;
});
watch(ratingFilter, () => {
  page.value = 1;
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-grey-50 bg-white p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-grey-500">
          Average rating
        </p>
        <div class="mt-2 flex items-end gap-2">
          <span class="text-3xl font-bold text-grey-900">
            {{ statsLoading ? "—" : stats.average.toFixed(1) }}
          </span>
          <span class="pb-1 text-sm text-grey-400">/ 5</span>
          <Star class="mb-1.5 size-5 fill-[#f7b23b] text-[#f7b23b]" />
        </div>
        <p class="mt-1 text-xs text-grey-400">
          {{ statsLoading ? "" : `${stats.total.toLocaleString()} review(s)` }}
        </p>
      </div>

      <div class="rounded-xl border border-grey-50 bg-white p-4 lg:col-span-2">
        <p class="text-xs font-medium uppercase tracking-wide text-grey-500">
          Distribution
        </p>
        <div class="mt-2 space-y-1.5">
          <div
            v-for="star in [5, 4, 3, 2, 1]"
            :key="star"
            class="flex items-center gap-2 text-sm"
          >
            <span class="flex shrink-0 items-center gap-1.5 text-grey-600">
              <span class="w-3 text-right tabular-nums">{{ star }}</span>
              <span class="inline-flex items-center gap-0.5">
                <Star
                  v-for="i in 5"
                  :key="i"
                  class="size-3"
                  :class="
                    i <= star
                      ? 'fill-[#f7b23b] text-[#f7b23b]'
                      : 'fill-white text-grey-300'
                  "
                />
              </span>
            </span>
            <div class="h-2 flex-1 overflow-hidden rounded-full bg-grey-55">
              <div
                class="h-full rounded-full bg-primary-500 transition-all"
                :style="{ width: `${distPercent(star)}%` }"
              />
            </div>
            <span class="w-10 text-right text-xs tabular-nums text-grey-500">
              {{ stats.distribution[star] ?? 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="w-full max-w-md">
        <SearchField v-model="search" placeholder="Search reviews" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="flex h-10 min-w-[10rem] cursor-pointer items-center justify-between gap-2 rounded-xl border border-grey-50 bg-white px-3 text-sm text-grey-900 transition hover:border-primary-300 data-[state=open]:border-primary-400"
          >
            <span>{{ ratingFilterLabel }}</span>
            <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-[12rem]">
          <DropdownMenuItem
            v-for="opt in RATING_FILTERS"
            :key="String(opt.value)"
            @select="ratingFilter = opt.value"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <span>{{ opt.label }}</span>
              <Check v-if="ratingFilter === opt.value" class="size-4 text-primary-500" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <LoadErrorState
      v-if="error && rows.length === 0 && !tableLoading"
      :error="error"
      load-failed-title="Unable to load reviews"
      resource-label="reviews"
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
          <TableCell><span class="font-medium">Rating</span></TableCell>
          <TableCell><span class="font-medium">Comment</span></TableCell>
          <TableCell><span class="font-medium">Order</span></TableCell>
          <TableCell><span class="font-medium">From</span></TableCell>
          <TableCell><span class="font-medium">Date</span></TableCell>
        </TableHeadRow>
      </TableHeader>

      <div v-if="tableLoading" class="min-h-0 flex-1">
        <TableSkeleton
          :columns="Array(5).fill({ kind: 'line', lineClass: 'w-full' })"
          :grid-template-columns="gridTemplate"
          :row-count="10"
        />
      </div>

      <TableBody v-else class="!max-h-none !overflow-visible">
        <TableRow
          v-if="rows.length === 0"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <TableCell class="col-span-5 py-12 text-center text-sm text-grey-500">
            No reviews yet.
          </TableCell>
        </TableRow>

        <TableRow
          v-for="row in rows"
          v-else
          :key="row.id"
          class="cursor-pointer transition hover:bg-grey-25"
          :style="{ gridTemplateColumns: gridTemplate }"
          @click="openDetail(row)"
        >
          <TableCell>
            <span
              class="inline-flex items-center gap-1.5"
              :aria-label="`${row.rating} out of 5`"
            >
              <span class="inline-flex items-center gap-0.5">
                <Star
                  v-for="star in 5"
                  :key="star"
                  class="size-4"
                  :class="
                    star <= row.rating
                      ? 'fill-[#f7b23b] text-[#f7b23b]'
                      : 'fill-white text-grey-300'
                  "
                />
              </span>
              <span class="text-sm font-semibold text-grey-800">{{ row.rating }}/5</span>
            </span>
          </TableCell>
          <TableCell>
            <p class="line-clamp-2 text-sm text-grey-700">{{ row.comment || "—" }}</p>
          </TableCell>
          <TableCell>
            <span class="text-sm text-grey-700">{{ row.orderReference || "—" }}</span>
          </TableCell>
          <TableCell>
            <p class="truncate text-sm text-grey-800">{{ row.businessName || "—" }}</p>
            <p v-if="row.email" class="truncate text-xs text-grey-400">{{ row.email }}</p>
          </TableCell>
          <TableCell>
            <span class="text-sm text-grey-700">{{ formatDate(row.createdAt) }}</span>
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

    <Dialog v-model:open="detailOpen">
      <DialogContent class="z-[100] max-w-lg">
        <DialogHeader>
          <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
            <DialogTitle>Review details</DialogTitle>
          </div>
          <DialogClose />
        </DialogHeader>

        <DialogBody v-if="selected" class="space-y-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-grey-500">Rating</p>
            <span class="mt-1 inline-flex items-center gap-1.5">
              <span class="inline-flex items-center gap-0.5">
                <Star
                  v-for="star in 5"
                  :key="star"
                  class="size-4"
                  :class="
                    star <= selected.rating
                      ? 'fill-[#f7b23b] text-[#f7b23b]'
                      : 'fill-white text-grey-300'
                  "
                />
              </span>
              <span class="text-sm font-semibold text-grey-800">{{ selected.rating }}/5</span>
            </span>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-grey-500">Comment</p>
            <p class="mt-1 whitespace-pre-wrap break-words text-sm text-grey-900">
              {{ selected.comment || "—" }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-grey-500">Order</p>
              <p class="mt-1 break-words text-sm text-grey-800">{{ selected.orderReference || "—" }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-grey-500">Date</p>
              <p class="mt-1 text-sm text-grey-800">{{ formatDate(selected.createdAt) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs font-medium uppercase tracking-wide text-grey-500">From</p>
              <p class="mt-1 break-words text-sm text-grey-800">{{ selected.businessName || "—" }}</p>
              <p v-if="selected.email" class="break-words text-xs text-grey-400">{{ selected.email }}</p>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  </div>
</template>
