<script setup lang="ts">
import { Button, Checkbox, DatePickerField } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { hasActivePurchaseOrderFilters } from '~/lib/purchase-order-filters';
import { PO_PRODUCT_TYPE_OPTIONS, PO_STATUS_OPTIONS } from '~/lib/purchase-order-constants';
import type { PurchaseOrderListFilters } from '~/types/purchase-orders';

const props = defineProps<{
  filters: PurchaseOrderListFilters;
}>();

const emit = defineEmits<{
  apply: [next: Partial<PurchaseOrderListFilters>];
  clearAll: [];
}>();

const typeOpen = ref(false);
const statusOpen = ref(false);
const createdOpen = ref(false);
const expectedOpen = ref(false);

const draftProductType = ref<string[]>([]);
const draftStatus = ref<string[]>([]);
const draftStartDate = ref('');
const draftEndDate = ref('');
const draftExpectedFrom = ref('');
const draftExpectedTo = ref('');

function syncDraftFromProps() {
  draftProductType.value = [...props.filters.productType];
  draftStatus.value = [...props.filters.status];
  draftStartDate.value = props.filters.startDate;
  draftEndDate.value = props.filters.endDate;
  draftExpectedFrom.value = props.filters.expectedDateFrom;
  draftExpectedTo.value = props.filters.expectedDateTo;
}

watch(
  () => props.filters,
  () => syncDraftFromProps(),
  { deep: true, immediate: true },
);

function toggleDraftValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

const showClearAll = computed(() => hasActivePurchaseOrderFilters(props.filters));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="typeOpen"
      label="Product type"
      :active="filters.productType.length > 0"
      @open="syncDraftFromProps"
      @apply="emit('apply', { productType: [...draftProductType] as PurchaseOrderListFilters['productType'], page: 1 })"
      @clear="emit('apply', { productType: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in PO_PRODUCT_TYPE_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm text-grey-900"
        >
          <Checkbox
            :model-value="draftProductType.includes(option.value)"
            @update:model-value="draftProductType = toggleDraftValue(draftProductType, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="filters.status.length > 0"
      @open="syncDraftFromProps"
      @apply="emit('apply', { status: [...draftStatus] as PurchaseOrderListFilters['status'], page: 1 })"
      @clear="emit('apply', { status: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in PO_STATUS_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm text-grey-900"
        >
          <Checkbox
            :model-value="draftStatus.includes(option.value)"
            @update:model-value="draftStatus = toggleDraftValue(draftStatus, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="createdOpen"
      label="Created date"
      :active="Boolean(filters.startDate || filters.endDate)"
      @open="syncDraftFromProps"
      @apply="emit('apply', { startDate: draftStartDate, endDate: draftEndDate, page: 1 })"
      @clear="emit('apply', { startDate: '', endDate: '', page: 1 })"
    >
      <div class="flex flex-col gap-3">
        <DatePickerField v-model="draftStartDate" placeholder="Start date" />
        <DatePickerField v-model="draftEndDate" placeholder="End date" />
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="expectedOpen"
      label="Expected date"
      :active="Boolean(filters.expectedDateFrom || filters.expectedDateTo)"
      @open="syncDraftFromProps"
      @apply="
        emit('apply', {
          expectedDateFrom: draftExpectedFrom,
          expectedDateTo: draftExpectedTo,
          page: 1,
        })
      "
      @clear="emit('apply', { expectedDateFrom: '', expectedDateTo: '', page: 1 })"
    >
      <div class="flex flex-col gap-3">
        <DatePickerField v-model="draftExpectedFrom" placeholder="From" />
        <DatePickerField v-model="draftExpectedTo" placeholder="To" />
      </div>
    </OrderFilterPopover>

    <Button
      v-if="showClearAll"
      type="button"
      variant="ghost"
      size="small"
      class="!w-fit"
      @click="emit('clearAll')"
    >
      Clear all
    </Button>
  </div>
</template>
