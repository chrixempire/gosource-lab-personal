<script setup lang="ts">
import { Checkbox, DatePickerField } from '@gosource/ui';
import CreditFilterClearLink from '~/components/credit/CreditFilterClearLink.vue';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import {
  CREDIT_CUSTOMER_HISTORY_REQUEST_TYPE_OPTIONS,
  CREDIT_CUSTOMER_HISTORY_STATUS_FILTER_OPTIONS,
  CREDIT_CUSTOMER_HISTORY_TENURE_OPTIONS,
} from '~/lib/credit-constants';
import type { CustomerCreditHistoryFilters } from '~/lib/credit-filters';

const props = defineProps<{
  filters: CustomerCreditHistoryFilters;
}>();

const emit = defineEmits<{
  apply: [next: Partial<CustomerCreditHistoryFilters>];
  clearAll: [];
}>();

const requestTypeOpen = ref(false);
const tenureOpen = ref(false);
const statusOpen = ref(false);
const dateOpen = ref(false);

const draftRequestType = ref<string[]>([]);
const draftTenure = ref<string[]>([]);
const draftStatus = ref<string[]>([]);
const draftStartDate = ref('');
const draftEndDate = ref('');

function syncDrafts() {
  draftRequestType.value = [...props.filters.requestType];
  draftTenure.value = [...props.filters.tenure];
  draftStatus.value = [...props.filters.status];
  draftStartDate.value = props.filters.startDate;
  draftEndDate.value = props.filters.endDate;
}

watch(() => props.filters, syncDrafts, { deep: true, immediate: true });

function toggle(values: string[], next: string) {
  return values.includes(next) ? values.filter((value) => value !== next) : [...values, next];
}

const hasActive = computed(
  () =>
    props.filters.requestType.length > 0 ||
    props.filters.tenure.length > 0 ||
    props.filters.status.length > 0 ||
    Boolean(props.filters.startDate || props.filters.endDate),
);
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="requestTypeOpen"
      label="Request type"
      :active="filters.requestType.length > 0"
      @update:open="(value) => value && syncDrafts()"
      @apply="emit('apply', { requestType: [...draftRequestType] })"
      @clear="emit('apply', { requestType: [] })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CREDIT_CUSTOMER_HISTORY_REQUEST_TYPE_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftRequestType.includes(option.value)"
            @update:model-value="draftRequestType = toggle(draftRequestType, option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="tenureOpen"
      label="Tenure"
      :active="filters.tenure.length > 0"
      @update:open="(value) => value && syncDrafts()"
      @apply="emit('apply', { tenure: [...draftTenure] })"
      @clear="emit('apply', { tenure: [] })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CREDIT_CUSTOMER_HISTORY_TENURE_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftTenure.includes(option.value)"
            @update:model-value="draftTenure = toggle(draftTenure, option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="filters.status.length > 0"
      @update:open="(value) => value && syncDrafts()"
      @apply="emit('apply', { status: [...draftStatus] })"
      @clear="emit('apply', { status: [] })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CREDIT_CUSTOMER_HISTORY_STATUS_FILTER_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftStatus.includes(option.value)"
            @update:model-value="draftStatus = toggle(draftStatus, option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="dateOpen"
      label="Date applied"
      :active="Boolean(filters.startDate || filters.endDate)"
      @update:open="(value) => value && syncDrafts()"
      @apply="emit('apply', { startDate: draftStartDate, endDate: draftEndDate })"
      @clear="emit('apply', { startDate: '', endDate: '' })"
    >
      <div class="grid gap-3">
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">From</span>
          <DatePickerField v-model="draftStartDate" placeholder="Select date" />
        </label>
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">To</span>
          <DatePickerField v-model="draftEndDate" placeholder="Select date" />
        </label>
      </div>
    </OrderFilterPopover>

    <CreditFilterClearLink :show="hasActive" @clear="emit('clearAll')" />
  </div>
</template>
