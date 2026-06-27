<script setup lang="ts">
import { SearchField } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import ActivityLogDetailPanel from '~/components/activity-log/ActivityLogDetailPanel.vue';
import ActivityLogFilterBar from '~/components/activity-log/ActivityLogFilterBar.vue';
import ActivityLogTable from '~/components/activity-log/ActivityLogTable.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useActivityLogFilters } from '~/composables/useActivityLogFilters';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useInfiniteActivityLog } from '~/composables/useInfiniteActivityLog';
import {
  GLOBAL_ACTIVITY_MODULE_OPTIONS,
  activityLogFiltersToApiQuery,
} from '~/lib/activity-log-filters';
import type { AdminActivityLogItem } from '~/types/activity-log';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters } = useActivityLogFilters();

updateHeader({
  title: 'Activity log',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);

const detailOpen = ref(false);
const selectedLog = ref<AdminActivityLogItem | null>(null);

// Global page — no module scoping; show every admin action, infinite-scroll.
const { rows, loading, loadingMore, hasMore, error, loadMore, refresh } =
  useInfiniteActivityLog(filters, activityLogFiltersToApiQuery);

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

// Pages aren't kept alive, so this runs on every navigation back — refetch so a
// freshly logged activity shows without a manual reload.
onMounted(() => {
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
        placeholder="Search all admin activity"
      />

      <ActivityLogFilterBar
        :filters="filters"
        :module-options="GLOBAL_ACTIVITY_MODULE_OPTIONS"
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
      :rows="rows"
      :loading="loading"
      :loading-more="loadingMore"
      :has-more="hasMore"
      @load-more="loadMore"
      @row-click="onRowClick"
    />

    <ActivityLogDetailPanel v-model:open="detailOpen" :log="selectedLog" />
  </div>
</template>
