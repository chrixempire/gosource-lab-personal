<script setup lang="ts">
import { Checkbox, DatePickerField } from '@gosource/ui';
import CreditFilterClearLink from '~/components/credit/CreditFilterClearLink.vue';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { CREDIT_REPAYMENT_METHOD_FILTER_OPTIONS } from '~/lib/credit-constants';
import type { CreditRepaymentListFilters } from '~/types/credit';

export type CreditRepaymentBusinessOption = {
  value: string;
  label: string;
};

const props = defineProps<{
  filters: CreditRepaymentListFilters;
  businessOptions: CreditRepaymentBusinessOption[];
}>();

const emit = defineEmits<{
  apply: [next: Partial<CreditRepaymentListFilters>];
  clearAll: [];
}>();

const businessOpen = ref(false);
const methodOpen = ref(false);
const dateOpen = ref(false);
const draftBusinessIds = ref<string[]>([]);
const draftMethod = ref<string[]>([]);
const draftStart = ref('');
const draftEnd = ref('');

function sync() {
  draftBusinessIds.value = [...props.filters.businessIds];
  draftMethod.value = [...props.filters.paymentMethod];
  draftStart.value = props.filters.startDate;
  draftEnd.value = props.filters.endDate;
}

watch(() => props.filters, sync, { deep: true, immediate: true });

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

const hasActive = computed(
  () =>
    props.filters.businessIds.length > 0 ||
    props.filters.paymentMethod.length > 0 ||
    Boolean(props.filters.startDate || props.filters.endDate),
);
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="businessOpen"
      label="Business name"
      :active="filters.businessIds.length > 0"
      panel-class="w-[min(22rem,calc(100vw-2rem))] p-0"
      @open="sync"
      @apply="emit('apply', { businessIds: [...draftBusinessIds], page: 1 })"
      @clear="emit('apply', { businessIds: [], page: 1 })"
    >
      <div v-if="businessOptions.length" class="flex flex-col gap-2">
        <label
          v-for="option in businessOptions"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftBusinessIds.includes(option.value)"
            @update:model-value="draftBusinessIds = toggle(draftBusinessIds, option.value)"
          />
          <span class="truncate">{{ option.label }}</span>
        </label>
      </div>
      <p v-else class="text-sm text-grey-500">No businesses available.</p>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="dateOpen"
      label="Date range"
      :active="Boolean(filters.startDate || filters.endDate)"
      @open="sync"
      @apply="emit('apply', { startDate: draftStart, endDate: draftEnd, page: 1 })"
      @clear="emit('apply', { startDate: '', endDate: '', page: 1 })"
    >
      <div class="flex flex-col gap-3">
        <DatePickerField v-model="draftStart" placeholder="From" />
        <DatePickerField v-model="draftEnd" placeholder="To" />
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="methodOpen"
      label="Repayment method"
      :active="filters.paymentMethod.length > 0"
      @open="sync"
      @apply="emit('apply', { paymentMethod: [...draftMethod], page: 1 })"
      @clear="emit('apply', { paymentMethod: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CREDIT_REPAYMENT_METHOD_FILTER_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftMethod.includes(option.value)"
            @update:model-value="draftMethod = toggle(draftMethod, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <CreditFilterClearLink :show="hasActive" @clear="emit('clearAll')" />
  </div>
</template>
