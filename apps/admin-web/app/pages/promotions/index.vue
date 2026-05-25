<script setup lang="ts">
import { Button, SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import PromotionActionDialog from '~/components/promotions/PromotionActionDialog.vue';
import PromotionCardsGrid from '~/components/promotions/PromotionCardsGrid.vue';
import PromotionFilterBar from '~/components/promotions/PromotionFilterBar.vue';
import PromotionStatCards from '~/components/promotions/PromotionStatCards.vue';
import PromotionTable from '~/components/promotions/PromotionTable.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePromotionListFilters } from '~/composables/usePromotionListFilters';
import { usePromotionMutations } from '~/composables/usePromotionMutations';
import { promotionCreatePath, promotionEditPath } from '~/lib/admin-routes';
import {
  filterPromotionsByStatus,
  parsePromotionsListResponse,
} from '~/lib/promotion-api';
import { promotionListFiltersToApiQuery } from '~/lib/promotion-filters';
import type { AdminPromotionListItem, PromotionActionMode } from '~/types/promotions';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = usePromotionListFilters();
const { routeView, effectiveView, isCompactViewport, setView } =
  useCollectionRouteState('table');
const {
  busyPromotionId,
  activatePromotion,
  deactivatePromotion,
  duplicatePromotion,
  deletePromotion,
} = usePromotionMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const selectedIds = ref<string[]>([]);
const actionOpen = ref(false);
const actionMode = ref<PromotionActionMode>('delete');
const activePromotion = ref<AdminPromotionListItem | null>(null);

const apiQuery = computed(() => promotionListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/promotions', {
  query: apiQuery,
  watch: [apiQuery],
});

const parsed = computed(() =>
  parsePromotionsListResponse(data.value, filters.value.page, filters.value.limit),
);

const filteredRows = computed(() =>
  filterPromotionsByStatus(parsed.value.rows, filters.value.status),
);

const stats = computed(() => parsed.value.stats);
const meta = computed(() => parsed.value.meta);

watch(
  () => filters.value.name,
  (v) => {
    if (v !== searchQuery.value) searchQuery.value = v;
  },
  { immediate: true },
);

watch(debouncedSearch, (v) => {
  const trimmed = v.trim();
  if (trimmed === filters.value.name) return;
  replaceFilters({ name: trimmed, page: 1 });
});

function onFilterStatus(status: string | null) {
  if (!status) {
    replaceFilters({ status: [], page: 1 });
    return;
  }
  const current = filters.value.status;
  const next = current.includes(status as (typeof current)[number])
    ? current.filter((s) => s !== status)
    : [...current, status as (typeof current)[number]];
  replaceFilters({ status: next, page: 1 });
}

function onEdit(promotion: AdminPromotionListItem) {
  void navigateTo(promotionEditPath(promotion.id));
}

function openAction(mode: PromotionActionMode, promotion: AdminPromotionListItem) {
  activePromotion.value = promotion;
  actionMode.value = mode;
  actionOpen.value = true;
}

async function onActionConfirm() {
  if (!activePromotion.value) return;
  const id = activePromotion.value.id;
  try {
    if (actionMode.value === 'delete') {
      await deletePromotion(id);
    } else if (actionMode.value === 'duplicate') {
      await duplicatePromotion(id);
    } else if (actionMode.value === 'activate') {
      await activatePromotion(id);
    } else {
      await deactivatePromotion(id);
    }
    actionOpen.value = false;
    activePromotion.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

updateHeader({ title: 'Promotions' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <p class="max-w-xl text-sm text-grey-600">
        Create themed product promotions with optional percentage discounts and date windows.
      </p>
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Plus"
        @click="navigateTo(promotionCreatePath())"
      >
        Create promotion
      </Button>
    </div>

    <PromotionStatCards :filters="filters" :stats="stats" @filter-status="onFilterStatus" />

    <div
      class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between"
    >
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search promotions"
          :disabled="pending && filteredRows.length === 0"
        />
      </div>
      <ViewToggle
        v-if="!isCompactViewport"
        :model-value="routeView"
        @update:model-value="setView"
      />
    </div>

    <PromotionFilterBar :filters="filters" @apply="replaceFilters" @clear-all="resetFilters" />

    <LoadErrorState
      v-if="error && filteredRows.length === 0"
      :error="error"
      load-failed-title="Unable to load promotions"
      resource-label="promotion list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && filteredRows.length === 0"
      title="No promotions found"
      description="Create a promotion or adjust your filters."
    >
      <Button type="button" size="small" @click="navigateTo(promotionCreatePath())">
        Create promotion
      </Button>
    </EmptyState>

    <template v-else>
      <PromotionCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :promotions="filteredRows"
        :meta="meta"
        :loading="pending"
        :busy-promotion-id="busyPromotionId"
        @page="setPage"
        @page-size="setLimit"
        @edit="onEdit"
        @duplicate="openAction('duplicate', $event)"
        @activate="openAction('activate', $event)"
        @deactivate="openAction('deactivate', $event)"
        @delete="openAction('delete', $event)"
      />
      <PromotionTable
        v-else
        v-model:selected-ids="selectedIds"
        :promotions="filteredRows"
        :meta="meta"
        :loading="pending"
        :busy-promotion-id="busyPromotionId"
        @page="setPage"
        @page-size="setLimit"
        @edit="onEdit"
        @duplicate="openAction('duplicate', $event)"
        @activate="openAction('activate', $event)"
        @deactivate="openAction('deactivate', $event)"
        @delete="openAction('delete', $event)"
      />
    </template>

    <PromotionActionDialog
      v-model:open="actionOpen"
      :mode="actionMode"
      :promotion-name="activePromotion?.name"
      :loading="Boolean(activePromotion && busyPromotionId === activePromotion.id)"
      @confirm="onActionConfirm"
    />
  </div>
</template>
