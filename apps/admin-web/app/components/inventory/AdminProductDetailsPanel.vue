<script setup lang="ts">
import { StatusTag } from '@gosource/ui';
import { Info } from 'lucide-vue-next';
import {
  buildPricingQuantityPerUnitDescription,
  mapLegacyProductToFormValues,
} from '~/lib/product-form';
import {
  formatPurchaseUnitLabel,
  getCategoryLabel,
  mapLegacyProductToDetailsView,
} from '~/lib/product-details';
import type { CategoryOption, LegacyProductRow, ProductUnitOption } from '~/types/inventory';

const props = defineProps<{
  product: LegacyProductRow | null;
  unitOptions: ProductUnitOption[];
  categoryOptions: CategoryOption[];
  customerOptions: { id: string; label: string }[];
  loading?: boolean;
}>();

const detailsView = computed(() =>
  props.product ? mapLegacyProductToDetailsView(props.product) : null,
);

const formValues = computed(() =>
  props.product ? mapLegacyProductToFormValues(props.product, props.unitOptions) : null,
);

const categoryLabel = computed(() => {
  const categoryId = formValues.value?.category;
  if (!categoryId) {
    return props.product ? getCategoryLabel(props.product.category) : '—';
  }
  return (
    props.categoryOptions.find((option) => option.id === categoryId)?.label ??
    getCategoryLabel(props.product?.category)
  );
});

const purchaseUnitLabel = computed(() => {
  const slug = formValues.value?.purchaseUnit;
  if (!slug) {
    return props.product ? formatPurchaseUnitLabel(props.product) : '—';
  }
  return props.unitOptions.find((option) => option.slug === slug)?.label ?? slug;
});

const pricingQuantityPerUnitDescription = computed(() => {
  if (!formValues.value?.trackQuantity) {
    return '';
  }

  return buildPricingQuantityPerUnitDescription(
    formValues.value.purchaseUnit,
    props.unitOptions,
  );
});

function unitLabelForSlug(slug: string) {
  return props.unitOptions.find((option) => option.slug === slug)?.label ?? slug;
}

function customerLabelForId(id: string) {
  return props.customerOptions.find((option) => option.id === id)?.label ?? id;
}

const sectionClass = 'rounded-[20px] border border-grey-50 bg-white p-5 md:p-6';
const labelClass = 'text-xs font-medium uppercase tracking-wide text-grey-500';
const valueClass = 'mt-1 text-sm font-semibold text-grey-900';
</script>

<template>
  <div
    v-if="loading || !formValues || !detailsView"
    class="flex w-full flex-col gap-6"
    aria-busy="true"
  >
    <section
      v-for="index in 4"
      :key="`product-details-skeleton-${index}`"
      :class="sectionClass"
    >
      <div class="h-5 w-40 animate-pulse rounded bg-grey-55" />
      <div class="mt-5 space-y-4">
        <div
          v-for="row in 3"
          :key="`product-details-skeleton-row-${index}-${row}`"
          class="h-4 w-full animate-pulse rounded bg-grey-55"
        />
      </div>
    </section>
  </div>

  <div v-else class="flex w-full flex-col gap-6">
    <section :class="sectionClass">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-base font-semibold text-grey-900">Product details</h2>
        <StatusTag :variant="detailsView.statusVariant">{{ detailsView.statusLabel }}</StatusTag>
      </div>
      <div class="mt-5 space-y-5">
        <div v-if="formValues.images.length > 0">
          <p :class="labelClass">Images</p>
          <div class="mt-2 flex flex-wrap gap-3">
            <div
              v-for="(image, index) in formValues.images"
              :key="image.id ?? image.src ?? index"
              class="size-20 overflow-hidden rounded-xl border border-grey-50 bg-grey-55"
            >
              <img :src="image.src" alt="" class="size-full object-cover">
            </div>
          </div>
        </div>

        <div>
          <p :class="labelClass">Name</p>
          <p :class="valueClass">{{ formValues.name }}</p>
        </div>

        <div>
          <p :class="labelClass">Description</p>
          <p :class="[valueClass, 'whitespace-pre-wrap']">{{ formValues.description }}</p>
        </div>

        <div v-if="formValues.brand">
          <p :class="labelClass">Brand</p>
          <p :class="valueClass">{{ formValues.brand }}</p>
        </div>

        <div>
          <p :class="labelClass">Category</p>
          <p :class="valueClass">{{ categoryLabel }}</p>
        </div>
      </div>
    </section>

    <section :class="sectionClass">
      <h2 class="text-base font-semibold text-grey-900">Stock inventory</h2>
      <div class="mt-5 space-y-4">
        <div>
          <p :class="labelClass">Track quantity</p>
          <p :class="valueClass">{{ formValues.trackQuantity ? 'Yes' : 'No' }}</p>
        </div>

        <template v-if="formValues.trackQuantity">
          <div>
            <p :class="labelClass">Unit</p>
            <p :class="valueClass">{{ purchaseUnitLabel }}</p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p :class="labelClass">Market price</p>
              <p :class="valueClass">{{ formValues.marketPrice || '—' }}</p>
            </div>
            <div>
              <p :class="labelClass">Quantity</p>
              <p :class="valueClass">{{ formValues.quantity || '—' }}</p>
            </div>
            <div>
              <p :class="labelClass">Total price</p>
              <p :class="valueClass">{{ formValues.totalPrice || '—' }}</p>
            </div>
          </div>

          <div v-if="formValues.setLowStockLevel">
            <p :class="labelClass">Low stock level</p>
            <p :class="valueClass">{{ formValues.stockLevel || '—' }}</p>
          </div>
        </template>

        <div v-else>
          <p :class="labelClass">Market price</p>
          <p :class="valueClass">{{ formValues.marketPrice || '—' }}</p>
        </div>

        <div>
          <p :class="labelClass">Stock status</p>
          <p :class="valueClass">{{ detailsView.inStock ? 'In stock' : 'Out of stock' }}</p>
        </div>
      </div>
    </section>

    <section :class="sectionClass">
      <h2 class="flex items-center gap-1.5 text-base font-semibold text-grey-900">
        Pricing
        <Info class="size-4 text-grey-400" />
      </h2>
      <p
        v-if="pricingQuantityPerUnitDescription"
        class="mt-2 text-sm leading-6 text-grey-600"
      >
        {{ pricingQuantityPerUnitDescription }}
      </p>
      <div class="mt-5 space-y-4">
        <div
          v-for="(row, index) in formValues.pricing"
          :key="`pricing-${index}`"
          class="grid grid-cols-1 gap-4 rounded-xl border border-grey-50 bg-grey-55/30 p-4 md:grid-cols-3"
        >
          <div>
            <p :class="labelClass">Unit</p>
            <p :class="valueClass">{{ unitLabelForSlug(row.unit) }}</p>
          </div>
          <div>
            <p :class="labelClass">Price per unit</p>
            <p :class="valueClass">{{ row.price || '—' }}</p>
          </div>
          <div v-if="formValues.trackQuantity">
            <p :class="labelClass">Q/U</p>
            <p :class="valueClass">{{ row.quantityPerUnit || '—' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="formValues.specialPrices.length > 0" :class="sectionClass">
      <h2 class="flex items-center gap-1.5 text-base font-semibold text-grey-900">
        Special price
        <Info class="size-4 text-grey-400" />
      </h2>
      <div class="mt-5 space-y-4">
        <div
          v-for="(row, index) in formValues.specialPrices"
          :key="`special-${index}`"
          class="grid grid-cols-1 gap-4 rounded-xl border border-grey-50 bg-grey-55/30 p-4 md:grid-cols-2"
        >
          <div>
            <p :class="labelClass">Customer</p>
            <p :class="valueClass">{{ customerLabelForId(row.customerId) }}</p>
          </div>
          <div>
            <p :class="labelClass">New price</p>
            <p :class="valueClass">{{ row.newPrice || '—' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section :class="sectionClass">
      <h2 class="text-base font-semibold text-grey-900">Record</h2>
      <dl class="mt-4 divide-y divide-grey-50 text-sm">
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-grey-300">Created</dt>
          <dd class="font-semibold text-grey-900">{{ detailsView.createdLabel }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5">
          <dt class="text-grey-300">Updated</dt>
          <dd class="font-semibold text-grey-900">{{ detailsView.updatedLabel }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
