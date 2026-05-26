<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowLeft } from 'lucide-vue-next';
import DiscountForm from '~/components/discounts/DiscountForm.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useDiscountMutations } from '~/composables/useDiscountMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  createEmptyDiscountFormValues,
  mapCouponToFormValues,
  validateDiscountForm,
} from '~/lib/discount-form';
import { parseDiscountDetail } from '~/lib/discount-api';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import { slugFromRouteParam } from '~/lib/discount-constants';

const route = useRoute();
const discountId = computed(() => String(route.params.id ?? ''));
const slug = computed(() => slugFromRouteParam(String(route.params.type ?? '')));

if (!slug.value) {
  await navigateTo(ADMIN_PAGE_ROUTES.DISCOUNTS);
}

const { updateDiscount, busyDiscountId } = useDiscountMutations();
const form = reactive(createEmptyDiscountFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyDiscountId.value === discountId.value);

const { data, pending, error, refresh } = await useFetch<unknown>(
  () => `/api/coupons/${discountId.value}`,
  { watch: [discountId] },
);

watch(
  data,
  (payload) => {
    const detail = parseDiscountDetail(payload);
    if (detail) {
      Object.assign(form, mapCouponToFormValues(detail));
    }
  },
  { immediate: true },
);

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
  }

  try {
    await updateDiscount(discountId.value, slug.value, form, productIdsInCategory);
    await refresh();
    await navigateTo(ADMIN_PAGE_ROUTES.DISCOUNTS);
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: 'Edit discount' });
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
      <Button
        type="button"
        size="small"
        class="!w-fit"
        :loading="submitting"
        :disabled="pending"
        @click="onSubmit"
      >
        Save changes
      </Button>
    </div>
    <LoadErrorState
      v-if="!pending && error"
      :error="error"
      not-found-title="Discount not found"
      resource-label="discount"
      @retry="refresh()"
    />
    <DiscountForm
      v-else-if="!error"
      v-model="form"
      v-model:field-errors="fieldErrors"
      :slug="slug"
      mode="edit"
    />
  </div>
</template>
