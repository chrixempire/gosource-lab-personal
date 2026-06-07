<script setup lang="ts">
import { Button, SearchField, ViewToggle, toast } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import DiscountActivateDialog from '~/components/discounts/DiscountActivateDialog.vue';
import DiscountCardsGrid from '~/components/discounts/DiscountCardsGrid.vue';
import DiscountFilterBar from '~/components/discounts/DiscountFilterBar.vue';
import DiscountStatCards from '~/components/discounts/DiscountStatCards.vue';
import DiscountTable from '~/components/discounts/DiscountTable.vue';
import DiscountTypeDialog from '~/components/discounts/DiscountTypeDialog.vue';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useDiscountListFilters } from '~/composables/useDiscountListFilters';
import { useDiscountMutations } from '~/composables/useDiscountMutations';
import { discountEditPath } from '~/lib/admin-routes';
import {
  computeDiscountStats,
  filterDiscountsByStatus,
  filterDiscountsByType,
  parseDiscountsListResponse,
} from '~/lib/discount-api';
import { discountListFiltersToApiQuery } from '~/lib/discount-filters';
import { slugFromCouponCategory } from '~/lib/discount-routes';
import type { AdminDiscountListItem } from '~/types/discounts';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = useDiscountListFilters();
const { routeView, effectiveView, isCompactViewport, setView } =
  useCollectionRouteState('table');
const { busyDiscountId, activateDiscount, deactivateDiscount } = useDiscountMutations();

const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);
const selectedIds = ref<string[]>([]);
const copiedDiscountId = ref<string | null>(null);
let copyResetTimer: ReturnType<typeof setTimeout> | null = null;
const typeDialogOpen = ref(false);
const activateOpen = ref(false);
const activateMode = ref<'activate' | 'deactivate'>('deactivate');
const activeDiscount = ref<AdminDiscountListItem | null>(null);

const apiQuery = computed(() => discountListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/coupons', {
  query: apiQuery,
  watch: [apiQuery],
});

const parsed = computed(() =>
  parseDiscountsListResponse(data.value, filters.value.page, filters.value.limit),
);

const filteredRows = computed(() => {
  let rows = parsed.value.rows;
  rows = filterDiscountsByStatus(rows, filters.value.status);
  rows = filterDiscountsByType(rows, filters.value.discountType);
  if (filters.value.expiredDateFrom || filters.value.expiredDateTo) {
    rows = rows.filter((row) => {
      if (!row.expiryDate) return false;
      const expiry = new Date(row.expiryDate).getTime();
      if (filters.value.expiredDateFrom) {
            const from = new Date(filters.value.expiredDateFrom).getTime();
            if (expiry < from) return false;
          }
      if (filters.value.expiredDateTo) {
        const to = new Date(filters.value.expiredDateTo).getTime();
        if (expiry > to) return false;
      }
      return true;
    });
  }
  return rows;
});

const stats = computed(() => computeDiscountStats(parsed.value.rows));
const meta = computed(() => parsed.value.meta);

watch(
  () => filters.value.coupon,
  (v) => {
    if (v !== searchQuery.value) searchQuery.value = v;
  },
  { immediate: true },
);

watch(debouncedSearch, (v) => {
  const trimmed = v.trim();
  if (trimmed === filters.value.coupon) return;
  replaceFilters({ coupon: trimmed, page: 1 });
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

async function onCopy(discount: AdminDiscountListItem) {
  if (!discount.code || discount.code === '—') return;
  try {
    await navigator.clipboard.writeText(discount.code);
    copiedDiscountId.value = discount.id;
    if (copyResetTimer) {
      clearTimeout(copyResetTimer);
    }
    copyResetTimer = setTimeout(() => {
      if (copiedDiscountId.value === discount.id) {
        copiedDiscountId.value = null;
      }
    }, 1600);
    toast.success('Coupon code copied');
  } catch {
    toast.error('Unable to copy code');
  }
}

function onEdit(discount: AdminDiscountListItem) {
  void navigateTo(discountEditPath(slugFromCouponCategory(discount.category), discount.id));
}

function onActivateRequest(discount: AdminDiscountListItem) {
  activeDiscount.value = discount;
  activateMode.value = 'activate';
  activateOpen.value = true;
}

function onDeactivateRequest(discount: AdminDiscountListItem) {
  activeDiscount.value = discount;
  activateMode.value = 'deactivate';
  activateOpen.value = true;
}

async function onActivateConfirm() {
  if (!activeDiscount.value) return;
  try {
    if (activateMode.value === 'activate') {
      await activateDiscount(activeDiscount.value.id);
    } else {
      await deactivateDiscount(activeDiscount.value.id);
    }
    activateOpen.value = false;
    activeDiscount.value = null;
    await refresh();
  } catch {
    // toast in composable
  }
}

updateHeader({ title: 'Discounts' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between"
    >
      <p class="max-w-xl text-sm text-grey-600">
        Create and manage coupon discounts for categories, products, orders, and delivery.
      </p>
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="Plus"
        @click="typeDialogOpen = true"
      >
        Add discount
      </Button>
    </div>

    <DiscountStatCards :filters="filters" :stats="stats" @filter-status="onFilterStatus" />

    <div
      class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between"
    >
      <div class="w-full min-[1000px]:max-w-md">
        <SearchField
          v-model="searchQuery"
          placeholder="Search discounts"
          :disabled="pending && filteredRows.length === 0"
        />
      </div>
      <ViewToggle
        :model-value="routeView"
        @update:model-value="setView"
      />
    </div>

    <DiscountFilterBar :filters="filters" @apply="replaceFilters" @clear-all="resetFilters" />

    <LoadErrorState
      v-if="error && filteredRows.length === 0"
      :error="error"
      load-failed-title="Unable to load discounts"
      resource-label="discount list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && filteredRows.length === 0"
      title="No discounts found"
      description="Create a discount or adjust your filters."
    >
      <Button type="button" size="small" @click="typeDialogOpen = true">Add discount</Button>
    </EmptyState>

    <template v-else>
      <DiscountCardsGrid
        v-if="effectiveView === 'cards'"
        v-model:selected-ids="selectedIds"
        :discounts="filteredRows"
        :meta="meta"
        :loading="pending"
        :busy-discount-id="busyDiscountId"
        :copied-discount-id="copiedDiscountId"
        @page="setPage"
        @page-size="setLimit"
        @copy="onCopy"
        @edit="onEdit"
        @activate="onActivateRequest"
        @deactivate="onDeactivateRequest"
      />
      <DiscountTable
        v-else
        v-model:selected-ids="selectedIds"
        :discounts="filteredRows"
        :meta="meta"
        :loading="pending"
        :busy-discount-id="busyDiscountId"
        :copied-discount-id="copiedDiscountId"
        @page="setPage"
        @page-size="setLimit"
        @copy="onCopy"
        @edit="onEdit"
        @activate="onActivateRequest"
        @deactivate="onDeactivateRequest"
      />
    </template>

    <DiscountTypeDialog v-model:open="typeDialogOpen" />
    <DiscountActivateDialog
      v-model:open="activateOpen"
      :mode="activateMode"
      :loading="Boolean(activeDiscount && busyDiscountId === activeDiscount.id)"
      @confirm="onActivateConfirm"
    />
  </div>
</template>
