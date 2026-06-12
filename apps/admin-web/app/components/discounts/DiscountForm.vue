<script setup lang="ts">
import {
  Button,
  Checkbox,
  DatePickerField,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  RadioGroup,
  RadioGroupItem,
  SearchField,
  StatusTag,
} from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Check, ChevronDown, RotateCw, TicketPercent, Trash2, Truck } from 'lucide-vue-next';
import CreditFormattedNumberInput from '~/components/credit/CreditFormattedNumberInput.vue';
import InventorySearchableSelect from '~/components/inventory/InventorySearchableSelect.vue';
import { nairaToNumber } from '~/lib/credit-money';
import {
  DISCOUNT_AMOUNT_TYPE_OPTIONS,
  DISCOUNT_ROUTE_LABELS,
  DISCOUNT_TARGET_OPTIONS,
} from '~/lib/discount-constants';
import { parseCategoryOptions } from '~/lib/category-api';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import type { DiscountFormValues, DiscountRouteSlug } from '~/types/discounts';

const form = defineModel<DiscountFormValues>({ required: true });
const fieldErrors = defineModel<Record<string, string>>('fieldErrors', { default: () => ({}) });

const props = defineProps<{ slug: DiscountRouteSlug; mode: 'create' | 'edit' }>();

const productSearch = ref('');
const debouncedProductSearch = useDebounce(productSearch, 400);

const { data: categoriesPayload } = await useFetch<unknown>('/api/categories', {
  query: { page: 1, limit: 200 },
});

const categoryOptions = computed(() => parseCategoryOptions(categoriesPayload.value));

const productQuery = computed(() => ({
  page: 1,
  limit: 30,
  name: debouncedProductSearch.value.trim(),
  ...(form.value.categoryId ? { category: [form.value.categoryId] } : {}),
}));

const { data: productsPayload, pending: productsPending } = await useFetch<unknown>(
  '/api/products/filtered',
  { query: productQuery, watch: [productQuery] },
);

const productResults = computed(() =>
  parseFilteredProductsResponse(productsPayload.value, 1, 30).rows,
);

const selectedProducts = computed(() =>
  productResults.value.filter((p) => form.value.productIds.includes(p.id)),
);

const title = computed(() => DISCOUNT_ROUTE_LABELS[props.slug]);

function addProduct(id: string) {
  if (form.value.productIds.includes(id)) return;
  form.value.productIds = [...form.value.productIds, id];
  productSearch.value = '';
}

function removeProduct(id: string) {
  form.value.productIds = form.value.productIds.filter((entry) => entry !== id);
}

function generateCouponCode(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function regenerateCouponCode() {
  form.value.code = generateCouponCode();
}

const showAmountFields = computed(() => props.slug !== 'freeDelivery');
const showMinOrder = computed(
  () => props.slug === 'amountOffOrder' || props.slug === 'freeDelivery',
);

const amountPreview = computed(() => {
  if (props.slug === 'freeDelivery') {
    return 'Free delivery';
  }

  const amount = nairaToNumber(form.value.amount);
  if (!amount) {
    return 'Amount off';
  }

  return form.value.discountType === 'PERCENTAGE'
    ? `${amount}% off`
    : `${formatDashboardCurrency(amount)} off`;
});

const previewTitle = computed(() => DISCOUNT_ROUTE_LABELS[props.slug]);
const selectedCategoryOption = computed(
  () => categoryOptions.value.find((option) => option.id === form.value.categoryId) ?? null,
);
const selectedCategoryLabel = computed(() => selectedCategoryOption.value?.label ?? 'No category selected');
const selectedCategoryImage = computed(() => selectedCategoryOption.value?.imageUrl ?? null);
const selectedProductNames = computed(() =>
  selectedProducts.value.map((product) => product.name).slice(0, 3),
);
const previewProductImage = computed(() => selectedProducts.value[0]?.imageUrl ?? null);
const targetLabel = computed(() =>
  form.value.target === 'all'
    ? 'All customers'
    : form.value.target === 'new'
      ? 'New customers'
      : 'Returning customers',
);
const previewPrimaryLabel = computed(() =>
  props.slug === 'amountOffCategory'
    ? selectedCategoryLabel.value
    : selectedProductNames.value[0] || 'No products selected yet',
);
</script>

<template>
  <div class="space-y-6 lg:flex lg:items-start lg:gap-6 lg:space-y-0">
    <div class="min-w-0 flex-1 space-y-6">
      <p class="text-sm text-grey-600">
        {{ mode === 'create' ? 'Create' : 'Edit' }} — {{ title }}
      </p>

      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-grey-900">
          {{ slug === 'amountOffOrder' || slug === 'freeDelivery' ? 'Coupon details' : 'Discount details' }}
        </h2>
        <div class="mt-4 space-y-4">
          <div class="space-y-2">
            <p class="text-sm font-medium text-grey-900">Coupon code (optional)</p>
            <div class="flex items-center gap-2">
              <div class="min-w-0 flex-1">
                <Input
                  v-model="form.code"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                class="!size-11 shrink-0 !rounded-xl !border !border-primary-200 !text-primary-500 hover:!bg-primary-50"
                @click="regenerateCouponCode"
              >
                <RotateCw class="size-4" />
              </Button>
            </div>
          </div>

          <template v-if="showAmountFields">
            <div>
              <p class="mb-2 text-sm font-medium text-grey-900">
                Type of {{ slug === 'amountOffOrder' ? 'coupon' : 'discount' }}
              </p>
              <RadioGroup v-model="form.discountType" class="grid gap-3 sm:grid-cols-2">
                <label
                  v-for="option in DISCOUNT_AMOUNT_TYPE_OPTIONS"
                  :key="option.value"
                  class="flex cursor-pointer items-start gap-3 rounded-2xl border border-grey-50 p-3 transition-colors"
                  :class="form.discountType === option.value ? 'border-primary-200 bg-primary-50/40' : 'hover:border-grey-100 hover:bg-grey-25'"
                >
                  <RadioGroupItem :value="option.value" class="mt-0.5" />
                  <span>
                    <span class="block text-sm font-medium text-grey-900">{{ option.label }}</span>
                    <span class="mt-0.5 block text-xs text-grey-500">{{ option.snippet }}</span>
                  </span>
                </label>
              </RadioGroup>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-900">
                {{ form.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount' }}
              </p>
              <CreditFormattedNumberInput
                v-if="form.discountType === 'FIXED_AMOUNT'"
                v-model="form.amount"
                placeholder="0"
                :invalid="Boolean(fieldErrors.amount)"
              />
              <CreditFormattedNumberInput
                v-else
                v-model="form.amount"
                placeholder="0"
                :allow-decimal="true"
                inputmode="decimal"
                :invalid="Boolean(fieldErrors.amount)"
              />
            </div>
          </template>

          <div v-if="slug === 'amountOffCategory'">
            <p class="mb-2 text-sm font-medium text-grey-900">Category</p>
            <InventorySearchableSelect
              v-model="form.categoryId"
              :options="categoryOptions.map((c) => ({ value: c.id, label: c.label }))"
              placeholder="Select category"
              :invalid="Boolean(fieldErrors.categoryId)"
            />
            <p v-if="fieldErrors.categoryId" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.categoryId }}
            </p>
          </div>

          <div v-if="slug === 'amountOffProduct'">
            <p class="mb-2 text-sm font-medium text-grey-900">Items</p>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="flex h-11 w-full items-center justify-between rounded-xl border border-grey-75 bg-white px-3 text-left text-sm transition-colors hover:border-primary-200"
                  :class="fieldErrors.productIds ? 'border-negative-500' : ''"
                >
                  <span class="truncate text-grey-400">
                    {{
                      form.productIds.length > 0
                        ? `${form.productIds.length} product${form.productIds.length > 1 ? 's' : ''} selected`
                        : 'Search and choose products'
                    }}
                  </span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                class="w-[var(--reka-dropdown-menu-trigger-width)] overflow-hidden p-0"
              >
                <div class="border-b border-grey-50 p-2" @click.stop>
                  <SearchField v-model="productSearch" placeholder="Search products" />
                </div>
                <div class="max-h-64 overflow-y-auto p-1">
                  <p v-if="productsPending" class="px-3 py-4 text-sm text-grey-500">Searching…</p>
                  <DropdownMenuItem
                    v-for="product in productResults"
                    :key="product.id"
                    class="flex items-center justify-between gap-3"
                    @select="addProduct(product.id)"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-medium text-grey-900">
                        {{ product.name }}
                      </span>
                      <span class="block truncate text-xs text-grey-500">
                        {{ product.categoryLabel || 'Product' }}
                      </span>
                    </span>
                    <Check
                      v-if="form.productIds.includes(product.id)"
                      class="size-4 shrink-0 text-primary-500"
                    />
                  </DropdownMenuItem>
                  <p
                    v-if="!productsPending && productResults.length === 0"
                    class="px-3 py-4 text-center text-sm text-grey-500"
                  >
                    No products found
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <ul v-if="form.productIds.length" class="mt-3 space-y-2">
              <li
                v-for="product in selectedProducts"
                :key="product.id"
                class="flex items-center justify-between gap-3 rounded-xl border border-grey-50 px-3 py-2.5 text-sm"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div class="size-12 shrink-0 overflow-hidden rounded-xl border border-grey-75 bg-grey-25">
                    <img
                      v-if="product.imageUrl"
                      :src="product.imageUrl"
                      :alt="product.name"
                      class="size-full object-cover"
                    >
                    <div
                      v-else
                      class="flex size-full items-center justify-center text-xs font-semibold uppercase text-grey-400"
                    >
                      {{ product.name.slice(0, 1) }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-grey-900">{{ product.name }}</p>
                    <p class="truncate text-xs text-grey-500">{{ product.categoryLabel || 'Product' }}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  class="!size-8 shrink-0 text-negative-500 hover:!bg-negative-50"
                  @click="removeProduct(product.id)"
                >
                  <Trash2 class="size-4" />
                </Button>
              </li>
            </ul>
            <p v-if="fieldErrors.productIds" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.productIds }}
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-grey-900">Usage details</h2>
        <div class="mt-4 space-y-4">
          <div v-if="showMinOrder" class="space-y-2">
            <p class="text-sm font-medium text-grey-900">Minimum order amount (optional)</p>
            <CreditFormattedNumberInput
              v-model="form.minOrderAmount"
              placeholder="0"
            />
          </div>
          <p v-if="showMinOrder" class="-mt-2 text-xs text-grey-500">
            Once specified, this discount only applies when the order amount meets the minimum.
          </p>
          <div class="space-y-2">
            <p class="text-sm font-medium text-grey-900">Usage limit</p>
            <CreditFormattedNumberInput
              v-model="form.usageLimit"
              placeholder="0"
              :invalid="Boolean(fieldErrors.usageLimit)"
            />
          </div>
          <p class="-mt-2 text-xs text-grey-500">
            Enter the total number of times this discount can be used.
          </p>
          <div>
            <p class="mb-2 text-sm font-medium text-grey-900">Target</p>
            <RadioGroup v-model="form.target" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="option in DISCOUNT_TARGET_OPTIONS"
                :key="option.value"
                class="flex cursor-pointer items-start gap-3 rounded-2xl border border-grey-50 p-3 transition-colors"
                :class="form.target === option.value ? 'border-primary-200 bg-primary-50/40' : 'hover:border-grey-100 hover:bg-grey-25'"
              >
                <RadioGroupItem :value="option.value" class="mt-0.5" />
                <span class="block text-sm font-medium text-grey-900">{{ option.label }}</span>
              </label>
            </RadioGroup>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-900">Start date</p>
              <DatePickerField
                v-model="form.startDate"
                :invalid="Boolean(fieldErrors.startDate)"
              />
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-900">Start time</p>
              <Input v-model="form.startTime" type="time" />
            </div>
          </div>
          <label class="flex items-start gap-2 text-sm">
            <Checkbox v-model="form.hasExpiry" />
            <span>
              <span class="block font-medium text-grey-900">Set expiry date</span>
              <span class="mt-0.5 block text-xs text-grey-500">
                This indicates when the discount should stop running for customers.
              </span>
            </span>
          </label>
          <div v-if="form.hasExpiry" class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-900">End date</p>
              <DatePickerField v-model="form.endDate" />
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-grey-900">End time</p>
              <Input v-model="form.endTime" type="time" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <aside class="w-full shrink-0 lg:max-w-[360px]">
      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-grey-900">Discount preview</h2>
          <StatusTag
            size="medium"
            variant="success"
            class="!rounded-full !border-primary-100 !bg-primary-50 !text-primary-600"
          >
            {{ props.slug === 'freeDelivery' || props.slug === 'amountOffOrder' ? 'Coupon' : 'Discount' }}
          </StatusTag>
        </div>

        <div v-if="slug === 'amountOffOrder' || slug === 'freeDelivery'" class="mt-4 overflow-hidden rounded-2xl border border-grey-50 bg-white">
          <div class="flex min-h-[150px]">
            <div class="flex w-24 items-center justify-center bg-primary-500 text-white">
              <TicketPercent v-if="slug === 'amountOffOrder'" class="size-9" />
              <Truck v-else class="size-9" />
            </div>
            <div class="flex flex-1 flex-col justify-between bg-primary-500 p-4 text-white">
              <div>
                <p class="text-[11px] font-medium uppercase tracking-[0.16em] text-white/80">
                  {{ slug === 'amountOffOrder' ? 'Order coupon' : 'Delivery coupon' }}
                </p>
                <p class="mt-2 text-3xl font-semibold leading-none">
                  {{
                    slug === 'freeDelivery'
                      ? 'Free delivery'
                      : form.discountType === 'PERCENTAGE'
                        ? `${form.amount || 0}%`
                        : formatDashboardCurrency(nairaToNumber(form.amount))
                  }}
                </p>
                <p v-if="showMinOrder && nairaToNumber(form.minOrderAmount) > 0" class="mt-3 text-xs text-white/80">
                  For orders above {{ formatDashboardCurrency(nairaToNumber(form.minOrderAmount)) }}
                </p>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
                  {{ form.target === 'all' ? 'All customers' : form.target === 'new' ? 'New customers' : 'Returning customers' }}
                </span>
                <span class="text-xs text-white/80">
                  {{ form.usageLimit || 'No limit set' }} uses
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mt-4 overflow-hidden rounded-2xl border border-grey-50 bg-grey-25">
          <div class="relative min-h-[245px] overflow-hidden rounded-2xl bg-grey-25">
            <div class="absolute left-3 top-3 z-10 rounded-full bg-primary-500 px-2.5 py-1 text-xs font-medium text-white">
              {{ amountPreview }}
            </div>

            <img
              v-if="slug === 'amountOffCategory' && selectedCategoryImage"
              :src="selectedCategoryImage"
              :alt="selectedCategoryLabel"
              class="h-[245px] w-full object-cover"
            >
            <img
              v-else-if="slug === 'amountOffProduct' && previewProductImage"
              :src="previewProductImage"
              :alt="selectedProductNames[0] || 'Product preview'"
              class="h-[245px] w-full object-cover"
            >
            <div
              v-else
              class="flex h-[245px] w-full items-center justify-center bg-grey-55 px-6 text-center"
            >
              <div class="space-y-2">
                <p class="text-sm font-semibold text-grey-900">{{ previewTitle }}</p>
                <p class="text-xs text-grey-500">
                  {{
                    slug === 'amountOffCategory'
                      ? 'Select a category to preview it here'
                      : 'Select products to preview them here'
                  }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-wide text-grey-300">
                  {{ previewTitle }}
                </p>
                <p class="mt-1 truncate text-sm font-semibold text-grey-900">
                  {{ previewPrimaryLabel }}
                </p>
                <p
                  v-if="slug === 'amountOffProduct' && form.productIds.length > 1"
                  class="mt-1 text-xs text-grey-500"
                >
                  +{{ form.productIds.length - 1 }} more item{{ form.productIds.length - 1 > 1 ? 's' : '' }}
                </p>
              </div>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-grey-700 shadow-sm">
                {{ targetLabel }}
              </span>
            </div>

            <div class="rounded-2xl bg-white/80 p-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-1">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-grey-300">Starts</p>
                  <p class="text-sm font-medium text-grey-900">
                    {{ form.startDate || 'Select start date' }}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-grey-300">Limit</p>
                  <p class="text-sm font-medium text-grey-900">
                    {{ form.usageLimit || 'Set usage limit' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </aside>
  </div>
</template>
