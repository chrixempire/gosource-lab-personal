<script setup lang="ts">
import { Checkbox, DatePickerField, Input } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';

export type CustomerWalletTabFilters = {
  amountMin: string;
  amountMax: string;
  status: string[];
  startDate: string;
  endDate: string;
};

const props = defineProps<{
  filters: CustomerWalletTabFilters;
}>();

const emit = defineEmits<{
  apply: [next: Partial<CustomerWalletTabFilters>];
  clearAll: [];
}>();

const amountOpen = ref(false);
const statusOpen = ref(false);
const dateOpen = ref(false);

const draftAmountMin = ref('');
const draftAmountMax = ref('');
const draftStatus = ref<string[]>([]);
const draftStartDate = ref('');
const draftEndDate = ref('');

const statusOptions = [
  { label: 'Successful', value: 'successful' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cancelled', value: 'cancelled' },
];

function syncDrafts() {
  draftAmountMin.value = props.filters.amountMin;
  draftAmountMax.value = props.filters.amountMax;
  draftStatus.value = [...props.filters.status];
  draftStartDate.value = props.filters.startDate;
  draftEndDate.value = props.filters.endDate;
}

watch(() => props.filters, syncDrafts, { deep: true, immediate: true });

function toggle(values: string[], next: string) {
  return values.includes(next) ? values.filter((value) => value !== next) : [...values, next];
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="amountOpen"
      label="Amount"
      :active="Boolean(filters.amountMin || filters.amountMax)"
      @update:open="(value) => value && syncDrafts()"
      @apply="emit('apply', { amountMin: draftAmountMin, amountMax: draftAmountMax })"
      @clear="emit('apply', { amountMin: '', amountMax: '' })"
    >
      <div class="grid gap-3">
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">Minimum</span>
          <Input v-model="draftAmountMin" type="number" min="0" placeholder="0" />
        </label>
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">Maximum</span>
          <Input v-model="draftAmountMax" type="number" min="0" placeholder="Any" />
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
          v-for="option in statusOptions"
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
      label="Date"
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

    <button
      v-if="filters.amountMin || filters.amountMax || filters.status.length || filters.startDate || filters.endDate"
      type="button"
      class="rounded-full px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
      @click="emit('clearAll')"
    >
      Clear all
    </button>
  </div>
</template>
