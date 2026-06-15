<script setup lang="ts">
// Activity log feature disabled — page moved to _activity-log (no route). Re-enable via admin-routes + rename folder.
import { SearchField } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import ActivityLogFilterBar from '~/components/activity-log/ActivityLogFilterBar.vue';
import ActivityLogTable from '~/components/activity-log/ActivityLogTable.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useActivityLogFilters } from '~/composables/useActivityLogFilters';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { parseActivityLogListResponse } from '~/lib/activity-log-api';
import { activityLogFiltersToApiQuery } from '~/lib/activity-log-filters';
import { withRoutePaginationMeta } from '~/lib/list-pagination-meta';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = useActivityLogFilters();

updateHeader({
  title: 'Activity log',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);

const apiQuery = computed(() => activityLogFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>('/api/activity', {
  query: apiQuery,
  watch: [apiQuery],
  key: 'admin-activity-log',
});

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

function onClearAllFilters() {
  searchQuery.value = '';
  resetFilters();
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
    />
  </div>
</template>
