<script setup lang="ts">
import { SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditRequestCardsGrid from '~/components/credit/CreditRequestCardsGrid.vue';
import CreditRequestFilterBar from '~/components/credit/CreditRequestFilterBar.vue';
import CreditRequestStatCards from '~/components/credit/CreditRequestStatCards.vue';
import CreditRequestTable from '~/components/credit/CreditRequestTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { creditRequestPath, customerCreditHistoryPath } from '~/lib/admin-routes';
import { creditRequestListFiltersToApiQuery } from '~/lib/credit-filters';
import { parseCreditRequestStats, parseCreditRequestsListResponse } from '~/lib/credit-api';
import {
  CREDIT_LIST_SEARCH_CLASS,
  CREDIT_LIST_TOOLBAR_CLASS,
  CREDIT_LIST_VIEW_TOOLBAR_CLASS,
} from '~/lib/credit-page-layout';
import type { CreditRequestListFilters, CreditWorkflowStatus } from '~/types/credit';

const { updateHeader } = useAdminHeader();
const { routeView, effectiveView, isCompactViewport, setView } = useCollectionRouteState('table');

const filters = ref<CreditRequestListFilters>({
  page: 1,
  limit: 10,
  search: '',
  requestType: [],
  status: [],
  startDate: '',
  endDate: '',
});

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const selectedIds = ref<string[]>([]);
const activeStat = ref<string | null>(null);

const apiQuery = computed(() => creditRequestListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/credit/requests', {
  query: apiQuery,
  watch: [apiQuery],
});

const { data: statsData } = await useFetch<unknown>('/api/credit/requests/stats');

const parsed = computed(() =>
  parseCreditRequestsListResponse(data.value, filters.value.page, filters.value.limit),
);

const stats = computed(() => parseCreditRequestStats(statsData.value));

const rows = computed(() => parsed.value.rows);

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

function replaceFilters(next: Partial<CreditRequestListFilters>) {
  filters.value = { ...filters.value, ...next };
}

function resetFilters() {
  filters.value = {
    page: 1,
    limit: filters.value.limit,
    search: '',
    requestType: [],
    status: [],
    startDate: '',
    endDate: '',
  };
  searchQuery.value = '';
  activeStat.value = null;
}

function onFilterStatus(status: string | null) {
  activeStat.value = status;
  if (status) {
    replaceFilters({ status: [status as CreditWorkflowStatus], page: 1 });
  } else {
    replaceFilters({ status: [], page: 1 });
  }
}

function onView(row: { id: string }) {
  void navigateTo(creditRequestPath(row.id));
}

function onViewCreditHistory(row: { businessId: string }) {
  if (!row.businessId) return;
  void navigateTo(customerCreditHistoryPath(row.businessId));
}

updateHeader({ title: 'Credit requests' });
useHead({ title: 'Credit requests' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <CreditRequestStatCards
      :stats="stats"
      :active-status="activeStat"
      @filter-status="onFilterStatus"
    />

    <div :class="CREDIT_LIST_VIEW_TOOLBAR_CLASS">
      <SearchField
        v-model="searchQuery"
        placeholder="Search branches"
        :class="CREDIT_LIST_SEARCH_CLASS"
        :disabled="pending && rows.length === 0"
      />
      <ViewToggle
        :model-value="routeView"
        @update:model-value="setView"
      />
    </div>

    <div :class="CREDIT_LIST_TOOLBAR_CLASS">
      <CreditRequestFilterBar
        :filters="filters"
        @apply="replaceFilters"
        @clear-all="resetFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && rows.length === 0"
      :error="error"
      load-failed-title="Unable to load credit requests"
      resource-label="credit requests"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && rows.length === 0"
      title="No credit requests found"
      description="Adjust your filters or check back when customers submit requests."
    />

    <template v-else>
      <CreditRequestCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        @page="replaceFilters({ page: $event })"
        @page-size="replaceFilters({ limit: $event, page: 1 })"
        @view="onView"
        @view-credit-history="onViewCreditHistory"
      />
      <CreditRequestTable
        v-else
        v-model:selected-ids="selectedIds"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        @page="replaceFilters({ page: $event })"
        @page-size="replaceFilters({ limit: $event, page: 1 })"
        @view="onView"
        @view-credit-history="onViewCreditHistory"
      />
    </template>
  </div>
</template>
