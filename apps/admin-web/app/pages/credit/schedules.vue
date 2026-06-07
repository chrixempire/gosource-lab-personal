<script setup lang="ts">
import { SearchField, SegmentedControl, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import CreditRepaymentScheduleCardsGrid from '~/components/credit/CreditRepaymentScheduleCardsGrid.vue';
import CreditRepaymentSchedulesTable from '~/components/credit/CreditRepaymentSchedulesTable.vue';
import CreditScheduleFilterBar from '~/components/credit/CreditScheduleFilterBar.vue';
import CreditScheduleStatCards from '~/components/credit/CreditScheduleStatCards.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
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
import type { AdminRepaymentScheduleListItem, CreditScheduleListFilters } from '~/types/credit';

type SchedulePageView = 'schedules' | 'overdue';

const SCHEDULE_VIEW_OPTIONS = [
  { label: 'All schedules', value: 'schedules' },
  { label: 'Overdue', value: 'overdue' },
] as const;

const route = useRoute();
const router = useRouter();
const { updateHeader } = useAdminHeader();
const { routeView, effectiveView, isCompactViewport, setView } = useCollectionRouteState('table');

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

const scheduleFilters = ref<CreditScheduleListFilters>({
  page: 1,
  limit: 10,
  search: '',
  status: [],
  startDate: '',
  endDate: '',
});

const overdueFilters = ref({
  page: 1,
  limit: 10,
  search: '',
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
} = useFetch<unknown>('/api/credit/repayment-schedules', {
  query: scheduleApiQuery,
  watch: [scheduleApiQuery],
});

const {
  data: overdueData,
  pending: overduePending,
  error: overdueError,
  refresh: refreshOverdue,
} = useFetch<unknown>('/api/credit/repayment-schedules/overdue', {
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

watch(debouncedScheduleSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === scheduleFilters.value.search) return;
  scheduleFilters.value = { ...scheduleFilters.value, search: trimmed, page: 1 };
});

watch(debouncedOverdueSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === overdueFilters.value.search) return;
  overdueFilters.value = { ...overdueFilters.value, search: trimmed, page: 1 };
});

function setActiveView(view: SchedulePageView) {
  if (view === activeView.value) return;

  const nextQuery: Record<string, string> = {};
  if (route.query.view === 'cards' || route.query.view === 'table') {
    nextQuery.view = String(route.query.view);
  }
  if (view === 'overdue') {
    nextQuery.tab = 'overdue';
  }

  router.replace({ path: route.path, query: nextQuery });
}

function replaceScheduleFilters(next: Partial<CreditScheduleListFilters>) {
  scheduleFilters.value = { ...scheduleFilters.value, ...next };
}

function resetScheduleFilters() {
  scheduleFilters.value = {
    page: 1,
    limit: scheduleFilters.value.limit,
    search: '',
    status: [],
    startDate: '',
    endDate: '',
  };
  scheduleSearchQuery.value = '';
}

function replaceOverdueFilters(next: Partial<typeof overdueFilters.value>) {
  overdueFilters.value = { ...overdueFilters.value, ...next };
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
        @clear-all="resetScheduleFilters"
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
        @page="isOverdueView ? replaceOverdueFilters({ page: $event }) : replaceScheduleFilters({ page: $event })"
        @page-size="
          isOverdueView
            ? replaceOverdueFilters({ limit: $event, page: 1 })
            : replaceScheduleFilters({ limit: $event, page: 1 })
        "
        @view="onViewSchedule"
      />
      <CreditRepaymentSchedulesTable
        v-else
        :rows="rows"
        :meta="parsed.meta"
        :loading="pending"
        :show-days-overdue="isOverdueView"
        @page="isOverdueView ? replaceOverdueFilters({ page: $event }) : replaceScheduleFilters({ page: $event })"
        @page-size="
          isOverdueView
            ? replaceOverdueFilters({ limit: $event, page: 1 })
            : replaceScheduleFilters({ limit: $event, page: 1 })
        "
      />
    </template>
  </div>
</template>
