<script setup lang="ts">
import AdminProductDetailHeader from '~/components/inventory/AdminProductDetailHeader.vue';
import AdminProductDetailsPanel from '~/components/inventory/AdminProductDetailsPanel.vue';
import ProductActionConfirmDialog from '~/components/inventory/ProductActionConfirmDialog.vue';
import ProductAddStockDialog from '~/components/inventory/ProductAddStockDialog.vue';
import ProductRemoveStockDialog from '~/components/inventory/ProductRemoveStockDialog.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useProductActionConfirm } from '~/composables/useProductActionConfirm';
import { useProductMutations } from '~/composables/useProductMutations';
import { useProductStockDialog } from '~/composables/useProductStockDialog';
import { parseFormattedNumber } from '~/lib/product-form';
import { ADMIN_PAGE_ROUTES, inventoryItemEditPath } from '~/lib/admin-routes';
import { parseCategoryOptions } from '~/lib/category-api';
import { unwrapInventoryData } from '~/lib/inventory-api';
import { parseOrderCustomersResponse } from '~/lib/order-api';
import { mapLegacyProductToFormValues } from '~/lib/product-form';
import {
  getProductStockUnitRaw,
  mapLegacyProductToDetailsView,
  mapLegacyUnits,
} from '~/lib/product-details';
import type { LegacyProductRow } from '~/types/inventory';

const route = useRoute();
const router = useRouter();
const productId = computed(() => String(route.params.id ?? ''));

const {
  updatingProductId,
  activateProduct,
  deactivateProduct,
  markProductInStock,
  markProductOutOfStock,
  addProductStock,
  removeProductStock,
} = useProductMutations();

const {
  open: stockDialogOpen,
  mode: stockDialogMode,
  target: stockTarget,
  openAddStock,
  openRemoveStock,
} = useProductStockDialog();

const {
  open: confirmOpen,
  action: confirmAction,
  productName: confirmProductName,
  requestConfirm,
} = useProductActionConfirm();

const { data, pending, error, status, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/products/${productId.value}`,
  {
    watch: [productId],
    key: computed(() => `admin-product-detail:${productId.value}`),
  },
);

const { data: unitsPayload } = await useFetch<unknown>('/api/products/units');
const { data: categoriesPayload } = await useFetch<unknown>('/api/categories', {
  query: { page: 1, limit: 200 },
});
const { data: customersPayload } = await useFetch<unknown>('/api/orders/customers', {
  query: { page: 1, limit: 200 },
});

const unitOptions = computed(() => mapLegacyUnits(unitsPayload.value));
const categoryOptions = computed(() => parseCategoryOptions(categoriesPayload.value));
const customerOptions = computed(() => parseOrderCustomersResponse(customersPayload.value));

const rawProduct = computed(() => {
  const body = unwrapInventoryData(data.value);
  if (!body || typeof body !== 'object') {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record._id) {
    return record as LegacyProductRow;
  }

  const nested = record.product;
  return nested && typeof nested === 'object' ? (nested as LegacyProductRow) : null;
});

const detailsView = computed(() =>
  rawProduct.value ? mapLegacyProductToDetailsView(rawProduct.value) : null,
);

const formValues = computed(() =>
  rawProduct.value && unitOptions.value.length > 0
    ? mapLegacyProductToFormValues(rawProduct.value, unitOptions.value)
    : null,
);

const actionsDisabled = computed(() => updatingProductId.value === productId.value);

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }
  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
}

function goToEdit() {
  if (!productId.value) {
    return;
  }
  void navigateTo(inventoryItemEditPath(productId.value));
}

async function runMutation(action: () => Promise<void>) {
  if (!productId.value) {
    return;
  }

  try {
    await action();
    await refresh();
  } catch (error) {
    // toast in composable
    throw error;
  }
}

function onMarkInStock() {
  if (!detailsView.value) {
    return;
  }
  requestConfirm('in-stock', { id: productId.value, name: detailsView.value.name });
}

function onMarkOutOfStock() {
  if (!detailsView.value) {
    return;
  }
  requestConfirm('out-of-stock', { id: productId.value, name: detailsView.value.name });
}

function onActivate() {
  if (!detailsView.value) {
    return;
  }
  requestConfirm('activate', { id: productId.value, name: detailsView.value.name });
}

function onDeactivate() {
  if (!detailsView.value) {
    return;
  }
  requestConfirm('deactivate', { id: productId.value, name: detailsView.value.name });
}

function onAddStock() {
  if (!detailsView.value || !rawProduct.value) {
    return;
  }

  const marketPrice =
    parseFormattedNumber(formValues.value?.marketPrice ?? '') ??
    rawProduct.value.marketPrice;

  openAddStock({
    id: productId.value,
    name: detailsView.value.name,
    unit: getProductStockUnitRaw(rawProduct.value),
    marketPrice: marketPrice ?? undefined,
  });
}

function onRemoveStock() {
  if (!detailsView.value || !rawProduct.value) {
    return;
  }

  openRemoveStock({
    id: productId.value,
    name: detailsView.value.name,
    unit: getProductStockUnitRaw(rawProduct.value),
  });
}

async function onSubmitAddStock(body: Parameters<typeof addProductStock>[1]) {
  if (!productId.value) {
    return;
  }

  try {
    await addProductStock(productId.value, body);
    await refresh();
    stockDialogOpen.value = false;
  } catch {
    // toast in composable
  }
}

async function onSubmitRemoveStock(body: Parameters<typeof removeProductStock>[1]) {
  if (!productId.value) {
    return;
  }

  try {
    await removeProductStock(productId.value, body);
    await refresh();
    stockDialogOpen.value = false;
  } catch {
    // toast in composable
  }
}

async function onConfirmAction() {
  if (!productId.value || !confirmAction.value) {
    return;
  }

  const action = confirmAction.value;

  try {
    switch (action) {
      case 'activate':
        await runMutation(() => activateProduct(productId.value));
        break;
      case 'deactivate':
        await runMutation(() => deactivateProduct(productId.value));
        break;
      case 'in-stock':
        await runMutation(() => markProductInStock(productId.value));
        break;
      case 'out-of-stock':
        await runMutation(() => markProductOutOfStock(productId.value));
        break;
    }

    confirmOpen.value = false;
  } catch {
    // toast in composable
  }
}

useHead({
  title: computed(() =>
    detailsView.value ? `${detailsView.value.name} · Inventory` : 'Item details',
  ),
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <AdminProductDetailHeader
      :view="detailsView"
      :loading="pending"
      :actions-disabled="actionsDisabled"
      @back="goBack"
      @edit="goToEdit"
      @add-stock="onAddStock"
      @remove-stock="onRemoveStock"
      @mark-in-stock="onMarkInStock"
      @mark-out-of-stock="onMarkOutOfStock"
      @activate="onActivate"
      @deactivate="onDeactivate"
    />

    <LoadErrorState
      v-if="!detailsView && (error || status === 'success')"
      :error="error"
      not-found-title="Item not found"
      resource-label="item"
      @retry="refresh()"
    />

    <AdminProductDetailsPanel
      v-else
      :product="rawProduct"
      :unit-options="unitOptions"
      :category-options="categoryOptions"
      :customer-options="customerOptions"
      :loading="pending"
    />

    <ProductAddStockDialog
      v-if="stockDialogMode === 'add' && stockDialogOpen"
      v-model:open="stockDialogOpen"
      :product-id="stockTarget?.id ?? null"
      :product-name="stockTarget?.name"
      :unit="stockTarget?.unit"
      :default-market-price="stockTarget?.marketPrice"
      :unit-options="unitOptions"
      :loading="actionsDisabled"
      @submit="onSubmitAddStock"
    />

    <ProductRemoveStockDialog
      v-if="stockDialogMode === 'remove' && stockDialogOpen"
      v-model:open="stockDialogOpen"
      :product-id="stockTarget?.id ?? null"
      :product-name="stockTarget?.name"
      :unit="stockTarget?.unit"
      :unit-options="unitOptions"
      :loading="actionsDisabled"
      @submit="onSubmitRemoveStock"
    />

    <ProductActionConfirmDialog
      v-model:open="confirmOpen"
      :action="confirmAction"
      :product-name="confirmProductName"
      :loading="actionsDisabled"
      @confirm="onConfirmAction"
    />
  </div>
</template>
