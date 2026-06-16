<script setup lang="ts">
import { Button, SearchField, toast } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { ArrowLeft, Download } from 'lucide-vue-next';
import DashboardDateFilter from '~/components/dashboard/DashboardDateFilter.vue';
import InventoryReportStatCards from '~/components/inventory-report/InventoryReportStatCards.vue';
import InventoryReportTable from '~/components/inventory-report/InventoryReportTable.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useInventoryReportFilters } from '~/composables/useInventoryReportFilters';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { toDashboardQueryParams } from '~/lib/dashboard-date';
import { downloadInventoryReportCsv } from '~/lib/inventory-report-export';
import {
  fetchAllInventoryMovementRows,
  parseInventoryMovementResponse,
} from '~/lib/inventory-report-api';
import { withRoutePaginationMeta } from '~/lib/list-pagination-meta';

const { updateHeader } = useAdminHeader();
const { dateFilter, page, limit, search, apiQuery, setPage, setLimit, setSearch } =
  useInventoryReportFilters();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const exporting = ref(false);

const { data, pending, error, refresh } = await useAdminListFetch<unknown>(
  '/api/products/inventory-movement',
  {
    key: 'inventory-movement-report',
    query: apiQuery,
    watch: [apiQuery],
  },
);

/** Lazy list fetch keeps `pending` false until the first request starts; treat missing data as loading too. */
const tableLoading = computed(() => pending.value || data.value == null);

const parsed = computed(() =>
  parseInventoryMovementResponse(data.value, page.value, limit.value),
);

const rows = computed(() => parsed.value.rows);
const summary = computed(() => parsed.value.summary);
const meta = computed(() =>
  withRoutePaginationMeta(parsed.value.meta, page.value, limit.value),
);

watch(
  search,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === search.value) {
    return;
  }
  setSearch(trimmed);
});

watch(
  () => dateFilter.value.filterType,
  (value, previous) => {
    if (previous !== undefined && value !== previous) {
      setPage(1);
    }
  },
);

async function onExportCsv() {
  if (exporting.value) {
    return;
  }

  if (meta.value.total === 0) {
    toast.error('No items to export');
    return;
  }

  exporting.value = true;

  try {
    const allRows = await fetchAllInventoryMovementRows({
      ...toDashboardQueryParams(dateFilter.value),
      ...(search.value ? { search: search.value } : {}),
    });

    if (allRows.length === 0) {
      toast.error('No items to export');
      return;
    }

    downloadInventoryReportCsv(allRows);
  } catch (fetchError) {
    toast.error(
      fetchError instanceof Error ? fetchError.message : 'Unable to export inventory report',
    );
  } finally {
    exporting.value = false;
  }
}

function onBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
}

updateHeader({ title: 'Inventory report' });
useHead({ title: 'Inventory report' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <Button
        type="button"
        variant="ghost"
        size="small"
        class="!w-fit"
        :left-icon="ArrowLeft"
        @click="onBack"
      >
        Back to items
      </Button>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <DashboardDateFilter v-model="dateFilter" />
        <Button
          type="button"
          variant="secondary"
          size="small"
          class="!w-fit shrink-0"
          :left-icon="Download"
          :disabled="exporting || meta.total === 0"
          @click="onExportCsv"
        >
          Download
        </Button>
      </div>
    </div>

    <LoadErrorState
      v-if="error"
      title="Unable to load inventory report"
      fallback-message="Check your permissions for inventory reports, then retry."
      @retry="refresh"
    />

    <template v-else>
      <InventoryReportStatCards :summary="summary" />

      <SearchField
        v-model="searchQuery"
        placeholder="Search items"
        class="max-w-[295px]"
      />

      <InventoryReportTable
        :rows="rows"
        :meta="meta"
        :loading="tableLoading"
        @page="setPage"
        @page-size="setLimit"
      />
    </template>
  </div>
</template>
