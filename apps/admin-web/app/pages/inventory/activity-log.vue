<script setup lang="ts">
import { SearchField } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import ActivityLogDetailPanel from '~/components/activity-log/ActivityLogDetailPanel.vue';
import ActivityLogFilterBar from '~/components/activity-log/ActivityLogFilterBar.vue';
import ActivityLogTable from '~/components/activity-log/ActivityLogTable.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useActivityLogFilters } from '~/composables/useActivityLogFilters';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { parseActivityLogListResponse } from '~/lib/activity-log-api';
import { ADMIN_LIST_CACHE_URLS } from '~/lib/admin-list-cache-urls';
import {
  INVENTORY_ACTIVITY_MODULE_OPTIONS,
  inventoryActivityLogApiQuery,
} from '~/lib/activity-log-filters';
import { invalidateAdminListCache } from '~/lib/invalidate-admin-list-cache';
import { withRoutePaginationMeta } from '~/lib/list-pagination-meta';
import type { AdminActivityLogItem } from '~/types/activity-log';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } =
  useActivityLogFilters();

updateHeader({
  title: 'Activity log',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);

const detailOpen = ref(false);
const selectedLog = ref<AdminActivityLogItem | null>(null);

const apiQuery = computed(() => inventoryActivityLogApiQuery(filters.value));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>(
  '/api/activity',
  {
    query: apiQuery,
    watch: [apiQuery],
    key: 'inventory-activity-log',
  },
);

const parsed = computed(() =>
  parseActivityLogListResponse(data.value, filters.value.page, filters.value.limit),
);

const meta = computed(() =>
  withRoutePaginationMeta(parsed.value.meta, filters.value.page, filters.value.limit),
);

watch(
  () => filters.value.search,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.search) {
    return;
  }
  replaceFilters({ search: trimmed, page: 1 });
});

// Pages aren't kept alive, so this runs on every navigation back to the page —
// refetch so a freshly logged activity shows without a manual reload.
onMounted(() => {
  invalidateAdminListCache(ADMIN_LIST_CACHE_URLS.activityLogs);
  void refresh();
});

function onClearAllFilters() {
  searchQuery.value = '';
  resetFilters();
}

function onRowClick(row: AdminActivityLogItem) {
  selectedLog.value = row;
  detailOpen.value = true;
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="flex flex-col gap-3">
      <SearchField
        v-model="searchQuery"
        class="w-full max-w-lg"
        placeholder="Search activity"
      />

      <ActivityLogFilterBar
        :filters="filters"
        :module-options="INVENTORY_ACTIVITY_MODULE_OPTIONS"
        @apply="replaceFilters"
        @clear-all="onClearAllFilters"
      />
    </div>

    <LoadErrorState
      v-if="error"
      :error="error"
      resource-label="activity log"
      @retry="refresh()"
    />

    <ActivityLogTable
      v-else
      :rows="parsed.rows"
      :meta="meta"
      :loading="pending"
      @page="setPage"
      @page-size="setLimit"
      @row-click="onRowClick"
    />

    <ActivityLogDetailPanel v-model:open="detailOpen" :log="selectedLog" />
  </div>
</template>
