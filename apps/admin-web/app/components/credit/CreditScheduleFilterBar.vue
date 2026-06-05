<script setup lang="ts">
import { Checkbox, DatePickerField } from '@gosource/ui';
import CreditFilterClearLink from '~/components/credit/CreditFilterClearLink.vue';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { CREDIT_SCHEDULE_STATUS_FILTER_OPTIONS } from '~/lib/credit-constants';
import type { CreditScheduleListFilters } from '~/types/credit';

const props = defineProps<{ filters: CreditScheduleListFilters }>();
const emit = defineEmits<{
  apply: [next: Partial<CreditScheduleListFilters>];
  clearAll: [];
}>();

const statusOpen = ref(false);
const dateOpen = ref(false);
const draftStatus = ref<string[]>([]);
const draftStart = ref('');
const draftEnd = ref('');

function sync() {
  draftStatus.value = [...props.filters.status];
  draftStart.value = props.filters.startDate;
  draftEnd.value = props.filters.endDate;
}

watch(() => props.filters, sync, { deep: true, immediate: true });

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

const hasActive = computed(
  () =>
    props.filters.status.length > 0 ||
    Boolean(props.filters.startDate || props.filters.endDate),
);
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="filters.status.length > 0"
      @open="sync"
      @apply="emit('apply', { status: [...draftStatus] as CreditScheduleListFilters['status'], page: 1 })"
      @clear="emit('apply', { status: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CREDIT_SCHEDULE_STATUS_FILTER_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftStatus.includes(option.value)"
            @update:model-value="draftStatus = toggle(draftStatus, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="dateOpen"
      label="Due date"
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

    <CreditFilterClearLink :show="hasActive" @clear="emit('clearAll')" />
  </div>
</template>
