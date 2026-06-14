<script setup lang="ts">
import { Button, SearchField, toast } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { ArrowLeft, ClipboardList, Download, History } from 'lucide-vue-next';
import StoreCountCompleteDialog from '~/components/store-count/StoreCountCompleteDialog.vue';
import StoreCountHistoryDrawer from '~/components/store-count/StoreCountHistoryDrawer.vue';
import StoreCountTable from '~/components/store-count/StoreCountTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useAdminPaginatedListData } from '~/composables/useAdminPaginatedListData';
import { useAdminRequestFetch } from '~/composables/useAdminRequestFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useStoreCountMutations } from '~/composables/useStoreCountMutations';
import { useStoreCountSession } from '~/composables/useStoreCountSession';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { unwrapInventoryData } from '~/lib/inventory-api';
import { withRoutePaginationMeta } from '~/lib/list-pagination-meta';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import {
  buildStoreCountRows,
  fetchAllTrackableProductsForStoreCount,
  mapStockCountDetailToRows,
  mapStockCountRecordToRows,
  parseStockCountsListResponse,
} from '~/lib/store-count-api';
import { downloadStoreCountCsv } from '~/lib/store-count-export';
import type { LegacyProductRow } from '~/types/inventory';
import type { StoreCountHistoryItem, StoreCountProductRow } from '~/types/store-count';

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();
const {
  countedByProductId,
  changedRows,
  changedCount,
  setCountedQuantity,
  saveDraft,
  loadDraft,
  clearAfterSubmit,
} = useStoreCountSession();
const { submitting, completeStockCount } = useStoreCountMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const page = ref(1);
const limit = ref(10);
const historyOpen = ref(false);
const completeOpen = ref(false);
const historyPage = ref(1);
const historyRowsAccumulated = ref<StoreCountHistoryItem[]>([]);
const historyEntriesAccumulated = ref<Record<string, unknown>[]>([]);
const historyLoadingMore = ref(false);
const exporting = ref(false);
const historyRows = ref<StoreCountProductRow[]>([]);
const historyLoading = ref(false);

const selectedHistoryId = computed(() => {
  const history = route.query.history;
  return typeof history === 'string' && history.trim() ? history.trim() : null;
});

const isViewingHistory = computed(() => Boolean(selectedHistoryId.value));

const storeCountListKeyParts = computed(() => [
  page.value,
  limit.value,
  debouncedSearch.value.trim() || null,
  'trackQuantity',
]);

const apiFetch = useAdminRequestFetch();

const { data, pending, error, refresh } = await useAdminPaginatedListData(
  'store-count-products',
  storeCountListKeyParts,
  async () =>
    apiFetch<unknown>('/api/products/filtered', {
      query: {
        page: page.value,
        limit: limit.value,
        trackQuantity: 'true',
        name: debouncedSearch.value.trim() || undefined,
      },
    }),
);

const { data: historyData, pending: historyPending, refresh: refreshHistory } =
  await useAdminListFetch<unknown>('/api/products/stock-counts', {
    key: 'store-count-history',
    query: computed(() => ({ page: historyPage.value, limit: 20 })),
    watch: [historyPage],
  });

const parsedProducts = computed(() =>
  parseFilteredProductsResponse(data.value, page.value, limit.value),
);

const productRows = computed(() => {
  const body = unwrapInventoryData(data.value);
  const products = Array.isArray(body?.products) ? (body.products as LegacyProductRow[]) : [];
  return buildStoreCountRows(products, countedByProductId.value);
});

const tableRows = computed(() => {
  if (!isViewingHistory.value) {
    return productRows.value;
  }

  const start = (page.value - 1) * limit.value;
  return historyRows.value.slice(start, start + limit.value);
});

const meta = computed(() => {
  if (isViewingHistory.value) {
    const total = historyRows.value.length;
    return withRoutePaginationMeta(
      {
        page: page.value,
        limit: limit.value,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit.value)),
        hasNext: page.value * limit.value < total,
        hasPrev: page.value > 1,
      },
      page.value,
      limit.value,
    );
  }

  return withRoutePaginationMeta(parsedProducts.value.meta, page.value, limit.value);
});

const parsedHistory = computed(() =>
  parseStockCountsListResponse(historyData.value, historyPage.value, 20),
);

const rawStockCounts = computed(() => {
  const body = unwrapInventoryData(historyData.value);
  return Array.isArray(body?.stockCounts)
    ? (body.stockCounts as Record<string, unknown>[])
    : [];
});

watch(
  parsedHistory,
  (value) => {
    if (historyPage.value === 1) {
      historyRowsAccumulated.value = value.rows;
      return;
    }
    const existing = new Set(historyRowsAccumulated.value.map((row) => row.id));
    historyRowsAccumulated.value = [
      ...historyRowsAccumulated.value,
      ...value.rows.filter((row) => !existing.has(row.id)),
    ];
  },
  { immediate: true },
);

watch(
  rawStockCounts,
  (entries) => {
    if (historyPage.value === 1) {
      historyEntriesAccumulated.value = entries;
      return;
    }

    const existing = new Set(
      historyEntriesAccumulated.value.map((entry) => String(entry._id ?? entry.id ?? '')),
    );
    historyEntriesAccumulated.value = [
      ...historyEntriesAccumulated.value,
      ...entries.filter((entry) => !existing.has(String(entry._id ?? entry.id ?? ''))),
    ];
  },
  { immediate: true },
);

async function applySelectedHistory(id: string | null) {
  if (!id) {
    historyRows.value = [];
    historyLoading.value = false;
    return;
  }

  const cachedEntry = historyEntriesAccumulated.value.find(
    (entry) => String(entry._id ?? entry.id ?? '') === id,
  );

  if (cachedEntry) {
    historyRows.value = mapStockCountRecordToRows(cachedEntry);
    historyLoading.value = false;
    return;
  }

  historyLoading.value = true;

  try {
    const payload = await apiFetch<unknown>(`/api/products/stock-counts/${id}`);
    historyRows.value = mapStockCountDetailToRows(payload);
  } catch (fetchError) {
    historyRows.value = [];
    toast.error(
      fetchError instanceof Error ? fetchError.message : 'Unable to load stock count history',
    );
  } finally {
    historyLoading.value = false;
  }
}

watch(
  selectedHistoryId,
  async (id) => {
    page.value = 1;
    await applySelectedHistory(id);
  },
  { immediate: true },
);

const sessionStatus = computed<'pending' | 'completed' | null>(() => {
  if (isViewingHistory.value) {
    return 'completed';
  }
  if (changedCount.value > 0) {
    return 'pending';
  }
  return null;
});

function onSaveDraft() {
  saveDraft();
  toast.success('Progress saved');
}

async function onExportCsv() {
  if (exporting.value) {
    return;
  }

  exporting.value = true;

  try {
    const rows = isViewingHistory.value
      ? historyRows.value
      : buildStoreCountRows(
          await fetchAllTrackableProductsForStoreCount({
            name: debouncedSearch.value.trim() || undefined,
          }),
          countedByProductId.value,
        );

    if (rows.length === 0) {
      toast.error('No items to export');
      return;
    }

    downloadStoreCountCsv(rows);
  } catch (fetchError) {
    toast.error(
      fetchError instanceof Error ? fetchError.message : 'Unable to export store count',
    );
  } finally {
    exporting.value = false;
  }
}

async function onCompleteCount() {
  if (changedRows.value.length === 0) {
    return;
  }

  try {
    await completeStockCount({ countedProducts: changedRows.value });
    clearAfterSubmit();
    completeOpen.value = false;
    await Promise.all([refresh(), refreshHistory()]);
    historyPage.value = 1;
  } catch {
    // toast in composable
  }
}

function onSelectHistory(id: string) {
  const nextQuery = { ...route.query, history: id };
  delete nextQuery.page;
  void router.push({ path: ADMIN_PAGE_ROUTES.INVENTORY_STORE_COUNT, query: nextQuery });
}

function onReturnToLiveCount() {
  const { history, ...rest } = route.query;
  page.value = 1;
  void router.push({ path: ADMIN_PAGE_ROUTES.INVENTORY_STORE_COUNT, query: rest });
}

function onBack() {
  if (isViewingHistory.value) {
    onReturnToLiveCount();
    return;
  }

  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
}

async function onLoadMoreHistory() {
  if (!parsedHistory.value.meta.hasNext || historyLoadingMore.value) {
    return;
  }

  historyLoadingMore.value = true;
  historyPage.value += 1;
  await refreshHistory();
  historyLoadingMore.value = false;
}

function onCountedQuantityChange(productId: string, quantity: number) {
  setCountedQuantity(productId, quantity);
}

function onPageChange(nextPage: number) {
  page.value = nextPage;
}

function onPageSizeChange(nextLimit: number) {
  limit.value = nextLimit;
  page.value = 1;
}

onMounted(() => {
  loadDraft();
});

watch(
  sessionStatus,
  (status) => {
    updateHeader({
      title: 'Store count',
      description:
        status === 'pending'
          ? 'Pending count in progress'
          : status === 'completed'
            ? 'Viewing a completed count'
            : null,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
      <Button
        type="button"
        variant="ghost"
        size="small"
        class="!w-fit"
        :left-icon="ArrowLeft"
        @click="onBack"
      >
        {{ isViewingHistory ? 'Back to live count' : 'Back to items' }}
      </Button>

      <div class="flex flex-wrap items-center gap-2 self-start min-[900px]:self-auto">
        <Button
          v-if="changedCount > 0 && !isViewingHistory"
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit"
          @click="onSaveDraft"
        >
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit"
          :left-icon="History"
          @click="historyOpen = true"
        >
          Count history
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit"
          :left-icon="Download"
          :loading="exporting"
          @click="onExportCsv"
        >
          Export CSV
        </Button>
        <Button
          v-if="changedCount > 0 && !isViewingHistory"
          type="button"
          size="small"
          class="!w-fit"
          :left-icon="ClipboardList"
          @click="completeOpen = true"
        >
          Complete count ({{ changedCount }})
        </Button>
      </div>
    </div>

    <div class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between">
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search items"
          :disabled="isViewingHistory || (pending && productRows.length === 0)"
        />
      </div>
    </div>

    <LoadErrorState
      v-if="!isViewingHistory && error && productRows.length === 0"
      :error="error"
      load-failed-title="Unable to load items"
      resource-label="store count list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="!isViewingHistory && !pending && productRows.length === 0"
      title="No trackable items found"
      description="Only products with quantity tracking enabled appear in store count."
    />

    <StoreCountTable
      v-else
      :rows="tableRows"
      :meta="meta"
      :loading="isViewingHistory ? historyLoading : pending"
      :readonly="isViewingHistory"
      @page="onPageChange"
      @page-size="onPageSizeChange"
      @update:counted-quantity="onCountedQuantityChange"
    />

    <StoreCountCompleteDialog
      v-model:open="completeOpen"
      :count="changedCount"
      :loading="submitting"
      @confirm="onCompleteCount"
    />

    <StoreCountHistoryDrawer
      v-model:open="historyOpen"
      :history="historyRowsAccumulated"
      :meta="parsedHistory.meta"
      :loading="historyPending && historyRowsAccumulated.length === 0"
      :loading-more="historyLoadingMore"
      :selected-id="selectedHistoryId"
      @select="onSelectHistory"
      @load-more="onLoadMoreHistory"
    />
  </div>
</template>
