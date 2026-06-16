<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import ProductItemForm from '~/components/inventory/ProductItemForm.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useProductMutations } from '~/composables/useProductMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { parseCategoryOptions } from '~/lib/category-api';
import { parseOrderCustomersResponse } from '~/lib/order-api';
import {
  createEmptyProductItemFormValues,
  validateProductItemForm,
} from '~/lib/product-form';
import { mapLegacyUnits } from '~/lib/product-details';

const { updateHeader } = useAdminHeader();
const { createProduct } = useProductMutations();

const submitting = ref(false);
const form = reactive(createEmptyProductItemFormValues());
const fieldErrors = reactive<Record<string, string>>({});

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

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
}

async function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateProductItemForm(form, { isEdit: false }));

  if (Object.keys(fieldErrors).length > 0) {
    return;
  }

  submitting.value = true;
  try {
    await createProduct(form);
    await navigateTo(ADMIN_PAGE_ROUTES.INVENTORY);
  } catch {
    // toast in composable
  } finally {
    submitting.value = false;
  }
}

updateHeader({
  title: 'Add item',
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
          :disabled="submitting"
          @click="goBack"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-item-form"
          size="medium"
          class="!w-fit"
          :disabled="submitting"
          :loading="submitting"
        >
          Create item
        </Button>
      </div>
    </div>

    <form id="create-item-form" class="flex w-full flex-col gap-6" @submit.prevent="onSubmit">
      <ProductItemForm
        :form="form"
        :field-errors="fieldErrors"
        :category-options="categoryOptions"
        :unit-options="unitOptions"
        :customer-options="customerOptions"
        :submitting="submitting"
      />
    </form>
  </div>
</template>
