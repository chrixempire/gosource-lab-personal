<script setup lang="ts">
import { SearchField, SegmentedControl, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditRepaymentScheduleCardsGrid from '~/components/credit/CreditRepaymentScheduleCardsGrid.vue';
import CreditRepaymentSchedulesTable from '~/components/credit/CreditRepaymentSchedulesTable.vue';
import CreditScheduleFilterBar from '~/components/credit/CreditScheduleFilterBar.vue';
import CreditScheduleStatCards from '~/components/credit/CreditScheduleStatCards.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useCreditScheduleListFilters } from '~/composables/useCreditListFilters';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { creditRequestPath } from '~/lib/admin-routes';
import { creditScheduleListFiltersToApiQuery } from '~/lib/credit-filters';
import {
  parseOverdueRepaymentSchedulesResponse,
  parseRepaymentSchedulesListResponse,
} from '~/lib/credit-api';
import {
  CREDIT_LIST_SEARCH_CLASS,
  CREDIT_LIST_VIEW_TOOLBAR_CLASS,
} from '~/lib/credit-page-layout';
import type { AdminRepaymentScheduleListItem } from '~/types/credit';

type SchedulePageView = 'schedules' | 'overdue';

const SCHEDULE_VIEW_OPTIONS = [
  { label: 'All schedules', value: 'schedules' },
  { label: 'Overdue', value: 'overdue' },
] as const;

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();
const { routeView, effectiveView, isCompactViewport, setView } = useCollectionRouteState('table');
const {
  filters: scheduleFilters,
  overdueFilters,
  replaceFilters: replaceScheduleFilters,
  replaceOverdueFilters,
  resetFilters: resetScheduleFilters,
  setPage: setSchedulePage,
  setLimit: setScheduleLimit,
  setOverduePage,
  setOverdueLimit,
} = useCreditScheduleListFilters();

const activeView = computed<SchedulePageView>(() => {
  if (route.query.tab === 'overdue' || route.query.view === 'overdue') {
    return 'overdue';
  }
  return 'schedules';
});

onMounted(() => {
  if (route.query.view === 'overdue' && route.query.tab !== 'overdue') {
    router.replace({
      path: route.path,
      query: { tab: 'overdue' },
    });
  }
});

const scheduleSearchQuery = ref('');
const overdueSearchQuery = ref('');
const debouncedScheduleSearch = useDebounce(scheduleSearchQuery, 400);
const debouncedOverdueSearch = useDebounce(overdueSearchQuery, 400);

const scheduleApiQuery = computed(() => creditScheduleListFiltersToApiQuery(scheduleFilters.value));
const overdueApiQuery = computed(() => ({
  page: overdueFilters.value.page,
  limit: overdueFilters.value.limit,
  ...(overdueFilters.value.search ? { search: overdueFilters.value.search } : {}),
}));

const {
  data: scheduleData,
  pending: schedulePending,
  error: scheduleError,
  refresh: refreshSchedules,
} = await useAdminListFetch<unknown>('/api/credit/repayment-schedules', {
  query: scheduleApiQuery,
  watch: [scheduleApiQuery],
});

const {
  data: overdueData,
  pending: overduePending,
  error: overdueError,
  refresh: refreshOverdue,
} = await useAdminListFetch<unknown>('/api/credit/repayment-schedules/overdue', {
  query: overdueApiQuery,
  watch: [overdueApiQuery],
});

const scheduleParsed = computed(() =>
  parseRepaymentSchedulesListResponse(
    scheduleData.value,
    scheduleFilters.value.page,
    scheduleFilters.value.limit,
  ),
);

const overdueParsed = computed(() =>
  parseOverdueRepaymentSchedulesResponse(
    overdueData.value,
    overdueFilters.value.page,
    overdueFilters.value.limit,
  ),
);

const isOverdueView = computed(() => activeView.value === 'overdue');
const parsed = computed(() => (isOverdueView.value ? overdueParsed.value : scheduleParsed.value));
const pending = computed(() => (isOverdueView.value ? overduePending.value : schedulePending.value));
const error = computed(() => (isOverdueView.value ? overdueError.value : scheduleError.value));
const rows = computed(() => parsed.value.rows);

const searchQuery = computed({
  get: () => (isOverdueView.value ? overdueSearchQuery.value : scheduleSearchQuery.value),
  set: (value: string) => {
    if (isOverdueView.value) {
      overdueSearchQuery.value = value;
    } else {
      scheduleSearchQuery.value = value;
    }
  },
});

watch(
  () => scheduleFilters.value.search,
  (value) => {
    if (value !== scheduleSearchQuery.value) scheduleSearchQuery.value = value;
  },
  { immediate: true },
);

watch(
  () => overdueFilters.value.search,
  (value) => {
    if (value !== overdueSearchQuery.value) overdueSearchQuery.value = value;
  },
  { immediate: true },
);

watch(debouncedScheduleSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === scheduleFilters.value.search) return;
  replaceScheduleFilters({ search: trimmed, page: 1 });
});

watch(debouncedOverdueSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === overdueFilters.value.search) return;
  replaceOverdueFilters({ search: trimmed, page: 1 });
});

function setActiveView(view: SchedulePageView) {
  if (view === activeView.value) return;

  const nextQuery = { ...route.query } as Record<string, string | string[] | undefined>;
  if (view === 'overdue') {
    nextQuery.tab = 'overdue';
  } else {
    delete nextQuery.tab;
  }

  router.replace({ path: route.path, query: nextQuery });
}

function onClearScheduleFilters() {
  resetScheduleFilters();
  scheduleSearchQuery.value = '';
  overdueSearchQuery.value = '';
}

function onViewSchedule(row: AdminRepaymentScheduleListItem) {
  if (row.creditRequestId) {
    void navigateTo(creditRequestPath(row.creditRequestId));
  }
}

function refreshActive() {
  if (isOverdueView.value) {
    void refreshOverdue();
  } else {
    void refreshSchedules();
  }
}

const pageTitle = computed(() =>
  activeView.value === 'overdue' ? 'Overdue repayments' : 'Repayment schedules',
);

watch(pageTitle, (title) => updateHeader({ title }), { immediate: true });
useHead(() => ({ title: pageTitle.value }));
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <SegmentedControl
        :model-value="activeView"
        :options="[...SCHEDULE_VIEW_OPTIONS]"
        class="w-full sm:w-auto"
        @update:model-value="setActiveView($event as SchedulePageView)"
      />
    </div>

    <CreditScheduleStatCards
      :variant="activeView"
      :schedules-summary="scheduleParsed.summary"
      :overdue-summary="overdueParsed.summary"
    />

    <div class="flex flex-col gap-4">
      <div :class="CREDIT_LIST_VIEW_TOOLBAR_CLASS">
        <SearchField
          v-model="searchQuery"
          :placeholder="
            isOverdueView ? 'Search overdue repayments' : 'Search reference or notes'
          "
          :class="CREDIT_LIST_SEARCH_CLASS"
          :disabled="pending && rows.length === 0"
        />
        <ViewToggle
          :model-value="routeView"
          @update:model-value="setView"
        />
      </div>

      <CreditScheduleFilterBar
        v-if="!isOverdueView"
        :filters="scheduleFilters"
        @apply="replaceScheduleFilters"
        @clear-all="onClearScheduleFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && rows.length === 0"
      :error="error"
      :load-failed-title="
        isOverdueView ? 'Unable to load overdue repayments' : 'Unable to load repayment schedules'
      "
      :resource-label="isOverdueView ? 'overdue repayments' : 'repayment schedules'"
      @retry="refreshActive()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && rows.length === 0"
      :title="isOverdueView ? 'No overdue repayments' : 'No schedules found'"
      :description="
        isOverdueView
          ? 'All repayment schedules are current for the selected filters.'
          : 'Adjust your filters or check back when installments are generated.'
      "
    />

    <template v-else>
      <CreditRepaymentScheduleCardsGrid
        v-if="effectiveView === 'cards'"
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        :show-days-overdue="isOverdueView"
        @page="isOverdueView ? setOverduePage($event) : setSchedulePage($event)"
        @page-size="isOverdueView ? setOverdueLimit($event) : setScheduleLimit($event)"
        @view="onViewSchedule"
      />
      <CreditRepaymentSchedulesTable
        v-else
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        :show-days-overdue="isOverdueView"
        @page="isOverdueView ? setOverduePage($event) : setSchedulePage($event)"
        @page-size="isOverdueView ? setOverdueLimit($event) : setScheduleLimit($event)"
      />
    </template>
  </div>
</template>
