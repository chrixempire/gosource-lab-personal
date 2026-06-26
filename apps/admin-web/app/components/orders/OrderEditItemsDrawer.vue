<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  toast,
} from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Check, ChevronDown, Minus, Plus, Search, Trash2 } from 'lucide-vue-next';
import AdminInvoicePreviewShell from '~/components/shared/AdminInvoicePreviewShell.vue';
import {
  parseOrderProductPickerResponse,
  type OrderProductPickerItem,
} from '~/lib/product-api';
import type { AdminOrderAdditionalItem } from '~/lib/order-details';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  mode: 'add' | 'edit';
  existingItems: AdminOrderAdditionalItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  add: [products: { product: string; unit: string; quantity: number }[]];
  update: [
    products: {
      cartId: string;
      productId: string;
      newQuantity: number;
      unit: string;
    }[],
  ];
}>();

type DraftItem = {
  cartId?: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  units: { key: string; price: number }[];
  selectedUnit: string;
  price: number;
  quantity: number;
  trackQuantity: boolean;
  stock: number;
};

const isEdit = computed(() => props.mode === 'edit');
const rows = ref<DraftItem[]>([]);

function toDraft(item: AdminOrderAdditionalItem): DraftItem {
  return {
    cartId: item.cartId,
    productId: item.productId,
    name: item.name,
    imageUrl: item.imageUrl,
    units: item.units.length ? item.units : [{ key: item.unit, price: item.unitPrice }],
    selectedUnit: item.unit,
    price: item.unitPrice,
    quantity: item.quantity,
    trackQuantity: item.trackQuantity,
    stock: item.stock,
  };
}

// (Re)initialise working rows whenever the drawer opens.
watch(
  () => [open.value, props.mode] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    rows.value = isEdit.value ? props.existingItems.map(toDraft) : [];
    searchQuery.value = '';
    searchResults.value = [];
  },
  { immediate: true },
);

/* ---------------------------------- search --------------------------------- */
const searchQuery = ref('');
const debouncedQuery = useDebounce(searchQuery, 350);
const searchResults = ref<OrderProductPickerItem[]>([]);
const searching = ref(false);

watch(debouncedQuery, async (value) => {
  const term = value.trim();
  if (!term) {
    searchResults.value = [];
    return;
  }
  searching.value = true;
  try {
    const payload = await $fetch<unknown>('/api/products/filtered', {
      query: { page: 1, limit: 20, name: term },
    });
    searchResults.value = parseOrderProductPickerResponse(payload);
  } catch {
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
});

const visibleResults = computed(() => {
  const taken = new Set([
    ...rows.value.map((row) => row.productId),
    ...props.existingItems.map((item) => item.productId),
  ]);
  return searchResults.value.filter((product) => !taken.has(product.id));
});

function selectProduct(product: OrderProductPickerItem) {
  const firstUnit = product.units[0];
  rows.value = [
    {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      units: product.units,
      selectedUnit: firstUnit?.key ?? 'unit',
      price: firstUnit?.price ?? 0,
      quantity: 1,
      trackQuantity: product.trackQuantity,
      stock: product.stock,
    },
    ...rows.value,
  ];
  searchQuery.value = '';
  searchResults.value = [];
}

/* ---------------------------------- editing -------------------------------- */
function setUnit(row: DraftItem, unitKey: string) {
  row.selectedUnit = unitKey;
  const found = row.units.find((unit) => unit.key === unitKey);
  if (found) row.price = found.price;
}

function setQuantity(row: DraftItem, value: number | string) {
  let next = Math.floor(Number(value));
  if (!Number.isFinite(next) || next < 1) next = 1;
  if (row.trackQuantity && row.stock > 0 && next > row.stock) {
    next = row.stock;
    toast.error('Quantity cannot exceed items in stock');
  }
  row.quantity = next;
}

function removeRow(index: number) {
  rows.value.splice(index, 1);
}

const runningTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.price * row.quantity, 0),
);

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

const canConfirm = computed(() =>
  isEdit.value ? props.existingItems.length > 0 : rows.value.length > 0,
);

function onConfirm() {
  if (!canConfirm.value) return;
  if (isEdit.value) {
    emit(
      'update',
      rows.value.map((row) => ({
        cartId: row.cartId ?? '',
        productId: row.productId,
        newQuantity: row.quantity,
        unit: row.selectedUnit,
      })),
    );
    return;
  }
  emit(
    'add',
    rows.value.map((row) => ({
      product: row.productId,
      unit: row.selectedUnit,
      quantity: row.quantity,
    })),
  );
}
</script>

<template>
  <AdminInvoicePreviewShell
    v-model:open="open"
    :title="isEdit ? 'Edit items' : 'Add items'"
  >
    <div class="flex min-h-full flex-col">
      <div class="flex-1 space-y-4 p-4 sm:p-5">
        <!-- Product search (add mode only) -->
        <div v-if="!isEdit" class="relative">
          <div class="relative">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grey-300"
            />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="Search items to add"
              class="!h-10 !pl-9"
            />
          </div>

          <div
            v-if="searchQuery.trim()"
            class="mt-1 max-h-64 overflow-y-auto rounded-lg border border-grey-50 bg-white shadow-sm"
          >
            <p v-if="searching" class="px-4 py-3 text-sm text-grey-400">Searching…</p>
            <button
              v-for="product in visibleResults"
              v-else
              :key="product.id"
              type="button"
              class="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-grey-900 hover:bg-primary-50/60"
              @click="selectProduct(product)"
            >
              <span class="truncate font-medium">{{ product.name }}</span>
              <span class="shrink-0 text-xs text-grey-400">
                {{ formatNaira(product.units[0]?.price ?? 0) }}
              </span>
            </button>
            <p
              v-if="!searching && visibleResults.length === 0"
              class="px-4 py-3 text-sm text-grey-400"
            >
              No matching items
            </p>
          </div>
        </div>

        <!-- Empty state (add mode, nothing selected) -->
        <div
          v-if="!isEdit && rows.length === 0"
          class="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-grey-50 px-6 py-12 text-center"
        >
          <p class="text-sm font-semibold text-grey-900">
            Search to find items to add
          </p>
          <p class="max-w-xs text-xs text-grey-400">
            Start typing to find items from your inventory and adjust quantities
            as needed.
          </p>
        </div>

        <!-- Working rows -->
        <div
          v-for="(row, index) in rows"
          :key="row.cartId ?? row.productId"
          class="rounded-lg border border-grey-50 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-grey-900">{{ row.name }}</p>
              <p class="mt-0.5 text-xs text-grey-400">
                {{ formatNaira(row.price) }} · {{ formatNaira(row.price * row.quantity) }} total
              </p>
            </div>
            <button
              type="button"
              class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-grey-300 hover:bg-grey-55 hover:text-negative-500"
              aria-label="Remove item"
              @click="removeRow(index)"
            >
              <Trash2 class="size-4" />
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-3">
            <DropdownMenu v-if="row.units.length > 1">
              <DropdownMenuTrigger as-child>
                <button
                  type="button"
                  class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-grey-50 bg-white px-3 text-sm font-medium text-grey-900 hover:border-grey-100"
                  :aria-label="`Unit for ${row.name}`"
                >
                  <span>{{ row.selectedUnit }} · {{ formatNaira(row.price) }}</span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="z-[130] w-52">
                <DropdownMenuItem
                  v-for="unit in row.units"
                  :key="unit.key"
                  class="cursor-pointer justify-between gap-3"
                  @select="setUnit(row, unit.key)"
                >
                  <span>{{ unit.key }} · {{ formatNaira(unit.price) }}</span>
                  <Check
                    v-if="unit.key === row.selectedUnit"
                    class="size-4 shrink-0 text-primary-500"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span
              v-else
              class="inline-flex h-9 items-center rounded-lg bg-grey-55 px-3 text-sm font-medium text-grey-700"
            >
              {{ row.selectedUnit }}
            </span>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-grey-55 text-grey-700 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="row.quantity <= 1"
                aria-label="Decrease quantity"
                @click="setQuantity(row, row.quantity - 1)"
              >
                <Minus class="size-3.5" />
              </button>
              <Input
                :model-value="String(row.quantity)"
                type="text"
                inputmode="numeric"
                class="!h-8 w-16 text-center [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                :aria-label="`Quantity for ${row.name}`"
                @update:model-value="setQuantity(row, $event)"
              />
              <button
                type="button"
                class="flex size-7 cursor-pointer items-center justify-center rounded-full bg-grey-55 text-grey-700"
                aria-label="Increase quantity"
                @click="setQuantity(row, row.quantity + 1)"
              >
                <Plus class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <p
          v-if="isEdit && rows.length === 0"
          class="rounded-lg border border-dashed border-grey-50 px-6 py-8 text-center text-sm text-grey-400"
        >
          All added items removed. Confirm to save.
        </p>
      </div>

      <!-- Sticky footer: running total + confirm -->
      <div class="sticky bottom-0 space-y-3 border-t border-grey-50 bg-white p-4 sm:p-5">
        <div
          class="flex items-center justify-between rounded-lg bg-grey-55 px-4 py-3 text-sm"
        >
          <span class="font-medium text-grey-700">
            {{ isEdit ? 'Total' : `${rows.length} item${rows.length === 1 ? '' : 's'} added` }}
          </span>
          <span class="font-semibold text-grey-900">{{ formatNaira(runningTotal) }}</span>
        </div>
        <div class="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="medium"
            class="!w-auto min-w-[6rem]"
            :disabled="loading"
            @click="open = false"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="medium"
            class="!w-auto min-w-[6rem]"
            :loading="loading"
            :disabled="!canConfirm || loading"
            @click="onConfirm"
          >
            {{ isEdit ? 'Save changes' : 'Add to order' }}
          </Button>
        </div>
      </div>
    </div>
  </AdminInvoicePreviewShell>
</template>
