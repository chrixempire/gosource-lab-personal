<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import ProductItemForm from '~/components/inventory/ProductItemForm.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useProductMutations } from '~/composables/useProductMutations';
import {
  ADMIN_PAGE_ROUTES,
} from '~/lib/admin-routes';
import { parseCategoryOptions } from '~/lib/category-api';
import { unwrapInventoryData } from '~/lib/inventory-api';
import { parseOrderCustomersResponse } from '~/lib/order-api';
import {
  createEmptyProductItemFormValues,
  mapLegacyProductToFormValues,
  validateProductItemForm,
} from '~/lib/product-form';
import { mapLegacyUnits } from '~/lib/product-details';
import type { LegacyProductRow } from '~/types/inventory';

const route = useRoute();
const router = useRouter();
const productId = computed(() => String(route.params.id ?? ''));

const { updateHeader } = useAdminHeader();
const { updatingProductId, updateProduct } = useProductMutations();

const form = reactive(createEmptyProductItemFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = ref(false);
const formReady = ref(false);

const { data, pending, error, refresh } = await useFetch<unknown>(
  () => `/api/products/${productId.value}`,
  { watch: [productId] },
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

watch(
  [rawProduct, unitOptions],
  ([product, units]) => {
    if (!product || units.length === 0) {
      return;
    }

    Object.assign(form, mapLegacyProductToFormValues(product, units));
    formReady.value = true;
  },
  { immediate: true },
);

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }
  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
}

function cancelEdit() {
  goBack();
}

async function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateProductItemForm(form, { isEdit: true }));

  if (Object.keys(fieldErrors).length > 0 || !productId.value) {
    return;
  }

  submitting.value = true;
  try {
    await updateProduct(productId.value, form);
    await navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
  } catch {
    // toast in composable
  } finally {
    submitting.value = false;
  }
}

updateHeader({
  title: 'Edit item',
});

useHead({
  title: computed(() => (form.name ? `Edit ${form.name}` : 'Edit item')),
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <div
      class="flex flex-col gap-4 min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between"
    >
      <Button type="button" size="icon" variant="ghost" class="!size-10 shrink-0" @click="goBack">
        <ArrowLeft class="size-5" />
      </Button>

      <div class="flex items-center gap-3 self-start min-[960px]:ml-auto">
        <Button
          type="button"
          variant="secondary"
          size="medium"
          class="!w-fit"
          :disabled="submitting || pending"
          @click="cancelEdit"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-item-form"
          size="medium"
          class="!w-fit"
          :disabled="submitting || pending || !formReady"
          :loading="submitting"
        >
          Save changes
        </Button>
      </div>
    </div>

    <LoadErrorState
      v-if="!pending && (error || !rawProduct)"
      :error="error"
      not-found-title="Item not found"
      resource-label="item"
      @retry="refresh()"
    />

    <form
      v-else
      id="edit-item-form"
      class="flex w-full flex-col gap-6"
      @submit.prevent="onSubmit"
    >
      <ProductItemForm
        v-if="formReady"
        :form="form"
        :field-errors="fieldErrors"
        :category-options="categoryOptions"
        :unit-options="unitOptions"
        :customer-options="customerOptions"
        :is-edit="true"
        :submitting="submitting || updatingProductId === productId"
      />
      <div
        v-else
        class="rounded-[20px] border border-grey-50 bg-white p-8 text-center text-sm text-grey-300"
        aria-busy="true"
      >
        Loading item…
      </div>
    </form>
  </div>
</template>
