<script setup lang="ts">
import {
  Button,
  DatePickerField,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
} from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { LoaderCircle, Search, Trash2, X } from 'lucide-vue-next';
import PurchaseOrderInvoiceDrawer from '~/components/purchase-orders/PurchaseOrderInvoiceDrawer.vue';
import PurchaseOrderSupplierSelect from '~/components/purchase-orders/PurchaseOrderSupplierSelect.vue';
import {
  PRODUCT_ITEM_INPUT_CLASS,
  PRODUCT_ITEM_TEXTAREA_CLASS,
  PRODUCT_ITEM_SELECT_TRIGGER_CLASS,
} from '~/lib/product-form';
import { formatDashboardCurrency } from '~/lib/dashboard-date';
import { PO_PRODUCT_TYPE_OPTIONS } from '~/lib/purchase-order-constants';
import {
  billToFromSupplierOptions,
  buildPurchaseOrderInvoicePreview,
  parseSupplierOptions,
} from '~/lib/purchase-order-api';
import { parseFilteredProductsResponse } from '~/lib/product-api';
import { useAdminSession } from '~/composables/useAdminSession';
import type { PurchaseOrderFormValues, PurchaseOrderLineItem } from '~/types/purchase-orders';

const form = defineModel<PurchaseOrderFormValues>({ required: true });
const fieldErrors = defineModel<Record<string, string>>('fieldErrors', { default: () => ({}) });

const props = defineProps<{
  mode?: 'create' | 'edit';
  orderId?: string;
  initialBillToById?: Record<string, { name: string; email: string }>;
  initialOrderedByLabel?: string;
}>();

const { session } = useAdminSession();
const supplierContactCache = ref<Record<string, { name: string; email: string }>>({});

function registerSupplierContact(option: { id: string; label: string; email: string }) {
  supplierContactCache.value = {
    ...supplierContactCache.value,
    [option.id]: { name: option.label, email: option.email || '—' },
  };
}

const previewOpen = ref(false);
const productPickerOpen = ref(false);
const productSearch = ref('');
const debouncedProductSearch = useDebounce(productSearch, 350);

const productQuery = computed(() => ({
  page: 1,
  limit: 20,
  name: debouncedProductSearch.value.trim(),
}));

const { data: productsPayload, pending: productsPending } = await useFetch<unknown>(
  '/api/products/filtered',
  {
    query: productQuery,
    watch: [productQuery],
  },
);

const productResults = computed(() =>
  parseFilteredProductsResponse(productsPayload.value, 1, 20).rows.filter(
    (product) => !form.value.lineItems.some((item) => item.productId === product.id),
  ),
);

const subtotal = computed(() =>
  form.value.lineItems.reduce((sum, item) => sum + item.totalPrice, 0),
);

const total = computed(() => subtotal.value + parseFormattedNumber(form.value.logisticsAmount));

const supplierIdsKey = computed(() => form.value.suppliers.slice().sort().join(','));

const { data: supplierLookupPayload } = await useFetch<unknown>('/api/admins/search', {
  query: { page: 1, limit: 200, name: '' },
  watch: [supplierIdsKey],
});

const billTo = computed(() =>
  billToFromSupplierOptions(
    form.value.suppliers,
    parseSupplierOptions(supplierLookupPayload.value),
    {
      ...(props.initialBillToById ?? {}),
      ...supplierContactCache.value,
    },
  ),
);

const orderedByLabel = computed(() => {
  if (props.initialOrderedByLabel) {
    return props.initialOrderedByLabel;
  }

  const user = session.value?.data;
  if (!user) {
    return '—';
  }

  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email || '—';
});

const preview = computed(() =>
  buildPurchaseOrderInvoicePreview(
    {
      _id: props.orderId ?? 'preview',
      expectedDate: form.value.expectedDate,
      note: form.value.note,
      logisticsAmount: parseFormattedNumber(form.value.logisticsAmount),
      products: form.value.lineItems.map((item) => ({
        product: { name: item.name, _id: item.productId },
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
    },
    {
      billTo: billTo.value,
      orderedByLabel: orderedByLabel.value,
      referenceLabel: props.orderId ? undefined : '#DRAFT',
    },
  ),
);

function parseFormattedNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEditableNumber(value: number | string | null | undefined) {
  const amount = parseFormattedNumber(value);
  if (amount <= 0) {
    return '0';
  }

  return amount.toLocaleString('en-NG');
}

function setLogisticsAmount(value: string) {
  form.value.logisticsAmount = formatEditableNumber(value);
}

function addProduct(product: {
  id: string;
  name: string;
  categoryLabel: string;
  imageUrl: string | null;
  marketPrice: number;
}) {
  const quantity = 1;
  const unitPrice = product.marketPrice;
  const line: PurchaseOrderLineItem = {
    productId: product.id,
    name: product.name,
    categoryLabel: product.categoryLabel,
    imageUrl: product.imageUrl,
    quantity,
    quantityReceived: 0,
    unitPrice,
    totalPrice: unitPrice * quantity,
  };

  form.value.lineItems = [...form.value.lineItems, line];
  productPickerOpen.value = false;
  productSearch.value = '';
}

function removeLine(index: number) {
  form.value.lineItems = form.value.lineItems.filter((_, itemIndex) => itemIndex !== index);
}

function updateLineQuantity(index: number, value: string) {
  const item = form.value.lineItems[index];
  if (!item) {
    return;
  }

  const quantity = Math.max(1, Math.round(parseFormattedNumber(value)) || 1);
  item.quantity = quantity;
  item.totalPrice = quantity * item.unitPrice;
}

function updateLineUnitPrice(index: number, value: string) {
  const item = form.value.lineItems[index];
  if (!item) {
    return;
  }

  const unitPrice = Math.max(0, parseFormattedNumber(value));
  item.unitPrice = unitPrice;
  item.totalPrice = unitPrice * item.quantity;
}

function clearProductSearch() {
  productSearch.value = '';
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-6">
      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold text-grey-900">Order details</h2>
        <div class="mt-4 space-y-4">
          <div>
            <p class="mb-2 text-sm font-medium text-grey-900">
              Product type <span class="text-negative-500">*</span>
            </p>
            <RadioGroup v-model="form.productType" class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="option in PO_PRODUCT_TYPE_OPTIONS"
                :key="option.value"
                class="flex cursor-pointer items-start gap-3 rounded-xl border border-grey-50 p-3"
                :class="form.productType === option.value ? 'border-primary-200 bg-primary-50/40' : ''"
              >
                <RadioGroupItem :value="option.value" class="mt-0.5" />
                <span>
                  <span class="block text-sm font-medium text-grey-900">{{ option.label }}</span>
                  <span class="mt-0.5 block text-xs text-grey-500">{{ option.snippet }}</span>
                </span>
              </label>
            </RadioGroup>
            <p v-if="fieldErrors.productType" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.productType }}
            </p>
          </div>

          <div>
            <p class="mb-2 text-sm font-medium text-grey-900">
              Suppliers <span class="text-negative-500">*</span>
            </p>
            <PurchaseOrderSupplierSelect
              v-model="form.suppliers"
              :invalid="Boolean(fieldErrors.suppliers)"
              @register-contact="registerSupplierContact"
            />
            <p v-if="fieldErrors.suppliers" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.suppliers }}
            </p>
          </div>

          <DatePickerField
            v-model="form.expectedDate"
            label="Expected date"
            :invalid="Boolean(fieldErrors.expectedDate)"
          />
          <p v-if="fieldErrors.expectedDate" class="text-xs text-negative-500">
            {{ fieldErrors.expectedDate }}
          </p>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-900">Note (optional)</label>
            <textarea
              v-model="form.note"
              rows="3"
              :class="PRODUCT_ITEM_TEXTAREA_CLASS"
              placeholder="Add a note for suppliers"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-900">
              Logistic amount
            </label>
            <Input
              :model-value="form.logisticsAmount"
              inputmode="decimal"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              @update:model-value="setLogisticsAmount"
            />
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-grey-900">Items</h2>
            <p v-if="fieldErrors.lineItems" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.lineItems }}
            </p>
          </div>

          <Popover v-model:open="productPickerOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                :class="[PRODUCT_ITEM_SELECT_TRIGGER_CLASS, 'min-w-[240px] sm:min-w-[280px]']"
              >
                <span :class="productSearch ? 'text-grey-900' : 'text-grey-400'">
                  {{ productSearch || 'Search products to add' }}
                </span>
                <Search class="size-4 shrink-0 text-grey-300" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              side="bottom"
              :side-offset="8"
              class="w-[var(--reka-popover-trigger-width)] p-0"
            >
              <div class="border-b border-grey-50 p-2">
                <div class="relative w-full">
                  <Search
                    class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-grey-400"
                  />
                  <Input
                    :model-value="productSearch"
                    placeholder="Search products to add"
                    :class="['pl-10', productSearch && 'pr-10']"
                    @update:model-value="productSearch = $event"
                  />
                  <button
                    v-if="productSearch"
                    type="button"
                    class="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-grey-400 transition-colors hover:bg-grey-55 hover:text-grey-700"
                    :aria-label="productsPending ? 'Searching products' : 'Clear search'"
                    @click="!productsPending && clearProductSearch()"
                  >
                    <LoaderCircle v-if="productsPending" class="size-4 animate-spin text-primary-500" />
                    <X v-else class="size-4" />
                  </button>
                </div>
              </div>

              <div class="max-h-72 overflow-y-auto p-1">
                <button
                  v-for="product in productResults"
                  :key="product.id"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-grey-55"
                  @click="addProduct(product)"
                >
                  <div
                    v-if="product.imageUrl"
                    class="size-10 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
                  >
                    <img
                      :src="product.imageUrl"
                      :alt="product.name"
                      class="size-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-grey-50 bg-grey-55 text-xs font-semibold text-grey-300"
                  >
                    {{ product.name.slice(0, 1).toUpperCase() }}
                  </div>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-grey-900">
                      {{ product.name }}
                    </span>
                    <span class="block truncate text-xs text-grey-500">
                      {{ product.categoryLabel }}
                    </span>
                  </span>
                  <span class="text-xs font-medium text-grey-700">
                    {{ formatDashboardCurrency(product.marketPrice) }}
                  </span>
                </button>

                <p
                  v-if="!productsPending && productSearch && productResults.length === 0"
                  class="px-3 py-4 text-center text-sm text-grey-500"
                >
                  No products found
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div class="mt-4">
          <TableShell class="overflow-hidden">
            <TableHeader>
              <TableHeadRow class="grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px]">
                <TableCell>Item</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total</TableCell>
                <TableCell />
              </TableHeadRow>
            </TableHeader>

            <TableBody class="!max-h-none !overflow-visible">
              <TableRow
                v-for="(item, index) in form.lineItems"
                :key="item.productId"
                class="grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px]"
              >
                <TableCell>
                  <div class="flex items-center gap-3">
                    <div
                      v-if="item.imageUrl"
                      class="size-11 shrink-0 overflow-hidden rounded-lg border border-grey-50 bg-grey-55"
                    >
                      <img :src="item.imageUrl" :alt="item.name" class="size-full object-cover" />
                    </div>
                    <div
                      v-else
                      class="flex size-11 shrink-0 items-center justify-center rounded-lg border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-300"
                    >
                      {{ item.name.slice(0, 1).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-grey-900">{{ item.name }}</p>
                      <p class="truncate text-xs text-grey-500">{{ item.categoryLabel }}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Input
                    :model-value="formatEditableNumber(item.unitPrice)"
                    inputmode="decimal"
                    :class="PRODUCT_ITEM_INPUT_CLASS"
                    @update:model-value="updateLineUnitPrice(index, $event)"
                  />
                </TableCell>

                <TableCell>
                  <Input
                    :model-value="String(item.quantity)"
                    inputmode="numeric"
                    :class="PRODUCT_ITEM_INPUT_CLASS"
                    @update:model-value="updateLineQuantity(index, $event)"
                  />
                </TableCell>

                <TableCell>
                  <div class="flex h-10 items-center text-sm font-semibold text-grey-900">
                    {{ formatDashboardCurrency(item.totalPrice) }}
                  </div>
                </TableCell>

                <TableCell class="flex items-center justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    class="!size-9 text-negative-500 hover:!bg-negative-50 hover:!text-negative-600"
                    aria-label="Remove item"
                    @click="removeLine(index)"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow v-if="form.lineItems.length === 0" class="grid-cols-1">
                <TableCell class="py-8 text-center text-sm text-grey-500">
                  Add products to build this purchase order.
                </TableCell>
              </TableRow>
            </TableBody>
          </TableShell>
        </div>
      </section>
    </div>

    <aside class="h-fit rounded-2xl border border-grey-50 bg-white p-5 shadow-sm xl:sticky xl:top-4">
      <h2 class="text-lg font-semibold text-grey-900">Summary</h2>
      <div class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-grey-600">Subtotal</span>
          <span class="font-medium text-grey-900">{{ formatDashboardCurrency(subtotal) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-grey-600">Logistic amount</span>
          <span class="font-medium text-grey-900">
            {{ formatDashboardCurrency(parseFormattedNumber(form.logisticsAmount)) }}
          </span>
        </div>
        <div class="flex justify-between border-t border-grey-50 pt-2">
          <span class="font-semibold text-grey-900">Total</span>
          <span class="font-semibold text-grey-900">{{ formatDashboardCurrency(total) }}</span>
        </div>
      </div>
      <Button type="button" variant="secondary" class="mt-4 w-full" @click="previewOpen = true">
        Preview invoice
      </Button>
    </aside>

    <PurchaseOrderInvoiceDrawer v-model:open="previewOpen" :preview="preview" />
  </div>
</template>
