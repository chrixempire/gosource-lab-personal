<script setup lang="ts">
import { Button, Checkbox, RadioGroup, RadioGroupItem } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { hasActiveProductFilters } from '~/lib/product-filters';
import type { CategoryOption, ProductListFilters } from '~/types/inventory';

const props = defineProps<{
  filters: ProductListFilters;
  categories: CategoryOption[];
}>();

const emit = defineEmits<{
  apply: [next: Partial<ProductListFilters>];
  clearAll: [];
}>();

const categoryOpen = ref(false);
const statusOpen = ref(false);
const stockOpen = ref(false);

const draftCategory = ref<string[]>([]);
const draftStatus = ref('');
const draftStock = ref('');

const PRODUCT_STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
] as const;

const STOCK_OPTIONS = [
  { value: 'true', label: 'In stock' },
  { value: 'false', label: 'Out of stock' },
] as const;

function syncDraftFromProps() {
  draftCategory.value = [...props.filters.category];
  draftStatus.value = props.filters.productStatus[0] ?? '';
  draftStock.value = props.filters.inStock[0] ?? '';
}

watch(
  () => props.filters,
  () => syncDraftFromProps(),
  { deep: true, immediate: true },
);

function openCategory() {
  syncDraftFromProps();
  categoryOpen.value = true;
}

function openStatus() {
  syncDraftFromProps();
  statusOpen.value = true;
}

function openStock() {
  syncDraftFromProps();
  stockOpen.value = true;
}

function applyCategory() {
  emit('apply', { category: [...draftCategory.value], page: 1 });
}

function clearCategory() {
  draftCategory.value = [];
  emit('apply', { category: [], page: 1 });
}

function applyStatus() {
  emit('apply', {
    productStatus: draftStatus.value ? [draftStatus.value] : [],
    page: 1,
  });
}

function clearStatus() {
  draftStatus.value = '';
  emit('apply', { productStatus: [], page: 1 });
}

function applyStock() {
  emit('apply', {
    inStock: draftStock.value ? [draftStock.value] : [],
    page: 1,
  });
}

function clearStock() {
  draftStock.value = '';
  emit('apply', { inStock: [], page: 1 });
}

const categoryActive = computed(() => props.filters.category.length > 0);
const statusActive = computed(() => props.filters.productStatus.length > 0);
const stockActive = computed(() => props.filters.inStock.length > 0);
const showClearAll = computed(() => hasActiveProductFilters(props.filters));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="categoryOpen"
      label="Category"
      :active="categoryActive"
      panel-class="w-[min(22rem,calc(100vw-2rem))] p-0"
      @apply="applyCategory"
      @clear="clearCategory"
      @update:open="(value) => value && openCategory()"
    >
      <div class="flex max-h-56 flex-col gap-2 overflow-y-auto">
        <label
          v-for="category in categories"
          :key="category.id"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftCategory.includes(category.id)"
            @update:model-value="
              (checked) =>
                (draftCategory = checked
                  ? [...draftCategory, category.id]
                  : draftCategory.filter((entry) => entry !== category.id))
            "
          />
          <span class="truncate">{{ category.label }}</span>
        </label>
        <p v-if="categories.length === 0" class="text-sm text-grey-300">No categories found.</p>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="statusActive"
      @apply="applyStatus"
      @clear="clearStatus"
      @update:open="(value) => value && openStatus()"
    >
      <RadioGroup v-model="draftStatus" class="flex flex-col gap-2">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All statuses</span>
        </label>
        <label
          v-for="option in PRODUCT_STATUS_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="stockOpen"
      label="Stock"
      :active="stockActive"
      @apply="applyStock"
      @clear="clearStock"
      @update:open="(value) => value && openStock()"
    >
      <RadioGroup v-model="draftStock" class="flex flex-col gap-2">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All stock</span>
        </label>
        <label
          v-for="option in STOCK_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
    </OrderFilterPopover>

    <Button
      v-if="showClearAll"
      type="button"
      variant="link"
      size="small"
      class="!h-auto !w-auto !px-0 !py-1 !text-primary-500"
      @click="emit('clearAll')"
    >
      Clear all filters
    </Button>
  </div>
</template>
