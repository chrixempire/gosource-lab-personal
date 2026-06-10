<script setup lang="ts">
import { Button, SearchField, ViewToggle } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Plus } from 'lucide-vue-next';
import ProductActionConfirmDialog from '~/components/inventory/ProductActionConfirmDialog.vue';
import ProductAddStockDialog from '~/components/inventory/ProductAddStockDialog.vue';
import ProductRemoveStockDialog from '~/components/inventory/ProductRemoveStockDialog.vue';
import ProductCardsGrid from '~/components/inventory/ProductCardsGrid.vue';
import ProductFilterBar from '~/components/inventory/ProductFilterBar.vue';
import ProductTable from '~/components/inventory/ProductTable.vue';
import { useCollectionRouteState } from '~/composables/useCollectionRouteState';
import { useProductActionConfirm } from '~/composables/useProductActionConfirm';
import { useProductStockDialog } from '~/composables/useProductStockDialog';
import EmptyState from '~/components/shared/EmptyState.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import PageHeader from '~/components/shared/PageHeader.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useProductListFilters } from '~/composables/useProductListFilters';
import { useProductMutations } from '~/composables/useProductMutations';
import {
  ADMIN_PAGE_ROUTES,
  inventoryItemEditPath,
  inventoryItemPath,
} from '~/lib/admin-routes';
import { parseCategoryOptions } from '~/lib/category-api';
import { mapLegacyUnits } from '~/lib/product-details';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import { productListFiltersToApiQuery } from '~/lib/product-filters';
import type { AdminProductListItem } from '~/types/inventory';

const { updateHeader } = useAdminHeader();
const { filters, replaceFilters, resetFilters, setPage, setLimit } = useProductListFilters();
const {
  routeView,
  effectiveView,
  isCompactViewport,
  setView,
} = useCollectionRouteState('table');
const {
  updatingProductId,
  markProductInStock,
  markProductOutOfStock,
  activateProduct,
  deactivateProduct,
  addProductStock,
  removeProductStock,
} = useProductMutations();

const {
  open: confirmOpen,
  action: confirmAction,
  productId: confirmProductId,
  productName: confirmProductName,
  requestConfirm,
} = useProductActionConfirm();

const {
  open: stockDialogOpen,
  mode: stockDialogMode,
  target: stockTarget,
  openAddStock,
  openRemoveStock,
} = useProductStockDialog();

const selectedIds = ref<string[]>([]);
const searchQuery = ref('');
const debouncedSearch = useDebounce(searchQuery, 500);

const apiQuery = computed(() => productListFiltersToApiQuery(filters.value));

const { data, pending, error, refresh } = await useFetch<unknown>('/api/products/filtered', {
  query: apiQuery,
  watch: [apiQuery],
});

const { data: categoriesPayload } = await useFetch<unknown>('/api/categories', {
  query: { page: 1, limit: 200 },
});
const { data: unitsPayload } = await useFetch<unknown>('/api/products/units');

const categoryOptions = computed(() => parseCategoryOptions(categoriesPayload.value));
const unitOptions = computed(() => mapLegacyUnits(unitsPayload.value));

const parsed = computed(() =>
  parseFilteredProductsResponse(data.value, filters.value.page, filters.value.limit),
);

const products = computed(() => parsed.value.rows);
const meta = computed(() => parsed.value.meta);

watch(
  () => filters.value.name,
  (value) => {
    if (value !== searchQuery.value) {
      searchQuery.value = value;
    }
  },
  { immediate: true },
);

watch(debouncedSearch, (value) => {
  const trimmed = value.trim();
  if (trimmed === filters.value.name) {
    return;
  }
  replaceFilters({ name: trimmed, page: 1 });
});

function onApplyFilters(next: Partial<typeof filters.value>) {
  replaceFilters({ ...next, page: 1 });
}

function onRowClick(product: AdminProductListItem) {
  void navigateTo(inventoryItemPath(product.id));
}

function onMarkInStock(product: AdminProductListItem) {
  requestConfirm('in-stock', product);
}

function onMarkOutOfStock(product: AdminProductListItem) {
  requestConfirm('out-of-stock', product);
}

function onViewDetails(product: AdminProductListItem) {
  void navigateTo(inventoryItemPath(product.id));
}

function onEditItem(product: AdminProductListItem) {
  void navigateTo(inventoryItemEditPath(product.id));
}

function onActivate(product: AdminProductListItem) {
  requestConfirm('activate', product);
}

function onDeactivate(product: AdminProductListItem) {
  requestConfirm('deactivate', product);
}

function onAddStock(product: AdminProductListItem) {
  openAddStock({
    id: product.id,
    name: product.name,
    unit: product.purchaseUnit,
    marketPrice: product.marketPrice,
  });
}

function onRemoveStock(product: AdminProductListItem) {
  openRemoveStock({
    id: product.id,
    name: product.name,
    unit: product.purchaseUnit,
  });
}

async function onSubmitAddStock(body: Parameters<typeof addProductStock>[1]) {
  if (!stockTarget.value) {
    return;
  }

  try {
    await addProductStock(stockTarget.value.id, body);
    await refresh();
    stockDialogOpen.value = false;
  } catch {
    // toast in composable
  }
}

async function onSubmitRemoveStock(body: Parameters<typeof removeProductStock>[1]) {
  if (!stockTarget.value) {
    return;
  }

  try {
    await removeProductStock(stockTarget.value.id, body);
    await refresh();
    stockDialogOpen.value = false;
  } catch {
    // toast in composable
  }
}

async function onConfirmAction() {
  if (!confirmProductId.value || !confirmAction.value) {
    return;
  }

  const id = confirmProductId.value;
  const action = confirmAction.value;

  try {
    switch (action) {
      case 'activate':
        await activateProduct(id);
        break;
      case 'deactivate':
        await deactivateProduct(id);
        break;
      case 'in-stock':
        await markProductInStock(id);
        break;
      case 'out-of-stock':
        await markProductOutOfStock(id);
        break;
    }
    await refresh();
    confirmOpen.value = false;
  } catch {
    // toast in composable
  }
}

function onCreateItem() {
  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY_ITEM_CREATE);
}

updateHeader({
  title: 'Inventory',
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div class="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
      <PageHeader title="Items" />
      <Button
        type="button"
        size="small"
        class="!w-fit shrink-0 self-start"
        :left-icon="Plus"
        @click="onCreateItem"
      >
        Add item
      </Button>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-4 min-[1000px]:flex-row min-[1000px]:items-end min-[1000px]:justify-between">
        <div class="w-full min-[1000px]:max-w-md">
          <SearchField
            v-model="searchQuery"
            placeholder="Search by item name"
            :disabled="pending && products.length === 0"
          />
        </div>

        <div
          class="flex items-center gap-2"
          :class="pending && products.length === 0 ? 'pointer-events-none opacity-50' : undefined"
        >
          <ViewToggle
            :model-value="routeView"
            @update:model-value="setView"
          />
        </div>
      </div>

      <ProductFilterBar
        :filters="filters"
        :categories="categoryOptions"
        @apply="onApplyFilters"
        @clear-all="resetFilters"
      />
    </div>

    <LoadErrorState
      v-if="error && products.length === 0"
      :error="error"
      load-failed-title="Unable to load items"
      resource-label="inventory list"
      @retry="refresh()"
    />

    <EmptyState
      v-else-if="effectiveView === 'cards' && !pending && products.length === 0"
      title="No items found"
      description="Try adjusting your search or filters, or add a new item."
    >
      <Button type="button" size="small" class="!w-fit" :left-icon="Plus" @click="onCreateItem">
        Add item
      </Button>
    </EmptyState>

    <template v-else>
      <ProductCardsGrid
        v-if="effectiveView === 'cards'"
        :products="products"
        :meta="meta"
        :loading="pending"
        :updating-product-id="updatingProductId"
        @page="setPage"
        @page-size="setLimit"
        @row-click="onRowClick"
        @view-details="onViewDetails"
        @mark-in-stock="onMarkInStock"
        @mark-out-of-stock="onMarkOutOfStock"
        @edit="onEditItem"
        @add-stock="onAddStock"
        @remove-stock="onRemoveStock"
        @activate="onActivate"
        @deactivate="onDeactivate"
      />
      <ProductTable
        v-else
        v-model:selected-ids="selectedIds"
        :products="products"
        :meta="meta"
        :loading="pending"
        :updating-product-id="updatingProductId"
        @page="setPage"
        @page-size="setLimit"
        @row-click="onRowClick"
        @view-details="onViewDetails"
        @mark-in-stock="onMarkInStock"
        @mark-out-of-stock="onMarkOutOfStock"
        @edit="onEditItem"
        @add-stock="onAddStock"
        @remove-stock="onRemoveStock"
        @activate="onActivate"
        @deactivate="onDeactivate"
      />
    </template>

    <ProductAddStockDialog
      v-if="stockDialogMode === 'add' && stockDialogOpen"
      v-model:open="stockDialogOpen"
      :product-id="stockTarget?.id ?? null"
      :product-name="stockTarget?.name"
      :unit="stockTarget?.unit"
      :default-market-price="stockTarget?.marketPrice"
      :unit-options="unitOptions"
      :loading="Boolean(stockTarget && updatingProductId === stockTarget.id)"
      @submit="onSubmitAddStock"
    />

    <ProductRemoveStockDialog
      v-if="stockDialogMode === 'remove' && stockDialogOpen"
      v-model:open="stockDialogOpen"
      :product-id="stockTarget?.id ?? null"
      :product-name="stockTarget?.name"
      :unit="stockTarget?.unit"
      :unit-options="unitOptions"
      :loading="Boolean(stockTarget && updatingProductId === stockTarget.id)"
      @submit="onSubmitRemoveStock"
    />

    <ProductActionConfirmDialog
      v-model:open="confirmOpen"
      :action="confirmAction"
      :product-name="confirmProductName"
      :loading="Boolean(confirmProductId && updatingProductId === confirmProductId)"
      @confirm="onConfirmAction"
    />
  </div>
</template>
