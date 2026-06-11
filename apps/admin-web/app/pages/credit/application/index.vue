<script setup lang="ts">
import { SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditApplicationCardsGrid from '~/components/credit/CreditApplicationCardsGrid.vue';
import CreditApplicationFilterBar from '~/components/credit/CreditApplicationFilterBar.vue';
import CreditApplicationStatCards from '~/components/credit/CreditApplicationStatCards.vue';
import CreditApplicationTable from '~/components/credit/CreditApplicationTable.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useCreditApplicationListFilters } from '~/composables/useCreditListFilters';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { creditApplicationPath, customerCreditHistoryPath } from '~/lib/admin-routes';
import { creditApplicationListFiltersToApiQuery } from '~/lib/credit-filters';
import { computeApplicationStats, parseCreditApplicationsListResponse } from '~/lib/credit-api';
import {
  CREDIT_LIST_SEARCH_CLASS,
  CREDIT_LIST_TOOLBAR_CLASS,
  CREDIT_LIST_VIEW_TOOLBAR_CLASS,
} from '~/lib/credit-page-layout';
import type { CreditWorkflowStatus } from '~/types/credit';

const { updateHeader } = useAdminHeader();
const { routeView, effectiveView, isCompactViewport, setView } = useCollectionRouteState('table');
const { filters, replaceFilters, resetFilters, setPage, setLimit } =
  useCreditApplicationListFilters();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 400);
const selectedIds = ref<string[]>([]);
const activeStat = ref<string | null>(null);

const apiQuery = computed(() => creditApplicationListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useAdminListFetch<unknown>('/api/credit/applications', {
  query: apiQuery,
  watch: [apiQuery],
});

const parsed = computed(() =>
  parseCreditApplicationsListResponse(data.value, filters.value.page, filters.value.limit),
);

const rows = computed(() => parsed.value.rows);

const stats = computed(() => computeApplicationStats(rows.value, parsed.value.meta.total));

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
  resetFilters();
  searchQuery.value = '';
  activeStat.value = null;
}

function onFilterStatus(status: string | null) {
  activeStat.value = status;
  if (status) {
    replaceFilters({
      status: [status as CreditWorkflowStatus],
      page: 1,
    });
  } else {
    replaceFilters({ status: [], page: 1 });
  }
}

function onView(row: { id: string }) {
  void navigateTo(creditApplicationPath(row.id));
}

function onViewCreditHistory(row: { businessId: string }) {
  if (!row.businessId) return;
  void navigateTo(customerCreditHistoryPath(row.businessId));
}

updateHeader({ title: 'Applications' });
useHead({ title: 'Credit applications' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <CreditApplicationStatCards
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
      <CreditApplicationFilterBar
        :filters="filters"
        @apply="replaceFilters"
        @clear-all="onClearAllFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && rows.length === 0"
      :error="error"
      load-failed-title="Unable to load applications"
      resource-label="credit applications"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && rows.length === 0"
      title="No applications found"
      description="Adjust your filters or check back when customers submit applications."
    />

    <template v-else>
      <CreditApplicationCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @view-credit-history="onViewCreditHistory"
      />
      <CreditApplicationTable
        v-else
        v-model:selected-ids="selectedIds"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        @page="setPage"
        @page-size="setLimit"
        @view="onView"
        @view-credit-history="onViewCreditHistory"
      />
    </template>
  </div>
</template>
