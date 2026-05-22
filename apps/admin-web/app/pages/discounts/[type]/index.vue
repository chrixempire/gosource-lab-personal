<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import DiscountForm from '~/components/discounts/DiscountForm.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useDiscountMutations } from '~/composables/useDiscountMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { createEmptyDiscountFormValues, validateDiscountForm } from '~/lib/discount-form';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import { slugFromRouteParam } from '~/lib/discount-constants';

const route = useRoute();
const slug = computed(() => slugFromRouteParam(String(route.params.type ?? '')));

if (!slug.value) {
  await navigateTo(ADMIN_PAGE_ROUTES.DISCOUNTS);
}

const { createDiscount, busyDiscountId } = useDiscountMutations();
const form = reactive(createEmptyDiscountFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyDiscountId.value === 'create');

async function fetchProductIdsForCategory(categoryId: string) {
  const payload = await $fetch<unknown>('/api/products/filtered', {
    query: { page: 1, limit: 500, category: [categoryId] },
  });
  return parseFilteredProductsResponse(payload, 1, 500).rows.map((row) => row.id);
}

async function onSubmit() {
  if (!slug.value) return;

  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k]);
  Object.assign(fieldErrors, validateDiscountForm(form, slug.value));
  if (Object.keys(fieldErrors).length > 0) return;

  let productIdsInCategory: string[] | undefined;
  if (slug.value === 'amountOffCategory' && form.categoryId) {
    productIdsInCategory = await fetchProductIdsForCategory(form.categoryId);
    if (productIdsInCategory.length === 0) {
      fieldErrors.categoryId = 'No products found in this category';
      return;
    }
  }

  try {
    await createDiscount(slug.value, form, productIdsInCategory);
    await navigateTo(ADMIN_PAGE_ROUTES.DISCOUNTS);
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: 'Create discount' });
</script>

<template>
  <div v-if="slug" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="small"
        class="!w-fit"
        :left-icon="ArrowLeft"
        @click="navigateTo(ADMIN_PAGE_ROUTES.DISCOUNTS)"
      >
        Back
      </Button>
      <Button type="button" size="small" class="!w-fit" :loading="submitting" @click="onSubmit">
        Create discount
      </Button>
    </div>
    <DiscountForm v-model="form" v-model:field-errors="fieldErrors" :slug="slug" mode="create" />
  </div>
</template>
