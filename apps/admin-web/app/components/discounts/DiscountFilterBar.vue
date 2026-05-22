<script setup lang="ts">
import { Button, Checkbox, DatePickerField } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { DISCOUNT_FILTER_TYPE_OPTIONS } from '~/lib/discount-constants';
import { hasActiveDiscountFilters } from '~/lib/discount-filters';
import type { DiscountListFilters } from '~/types/discounts';

const props = defineProps<{ filters: DiscountListFilters }>();
const emit = defineEmits<{
  apply: [next: Partial<DiscountListFilters>];
  clearAll: [];
}>();

const typeOpen = ref(false);
const createdOpen = ref(false);
const expiredOpen = ref(false);
const draftType = ref<string[]>([]);
const draftStart = ref('');
const draftEnd = ref('');
const draftExpiredFrom = ref('');
const draftExpiredTo = ref('');

function sync() {
  draftType.value = [...props.filters.discountType];
  draftStart.value = props.filters.startDate;
  draftEnd.value = props.filters.endDate;
  draftExpiredFrom.value = props.filters.expiredDateFrom;
  draftExpiredTo.value = props.filters.expiredDateTo;
}

watch(() => props.filters, sync, { deep: true, immediate: true });

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="typeOpen"
      label="Discount type"
      :active="filters.discountType.length > 0"
      @open="sync"
      @apply="emit('apply', { discountType: [...draftType], page: 1 })"
      @clear="emit('apply', { discountType: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in DISCOUNT_FILTER_TYPE_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftType.includes(option.value)"
            @update:model-value="draftType = toggle(draftType, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="createdOpen"
      label="Date created"
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
      v-model:open="expiredOpen"
      label="Expiration date"
      :active="Boolean(filters.expiredDateFrom || filters.expiredDateTo)"
      @open="sync"
      @apply="
        emit('apply', {
          expiredDateFrom: draftExpiredFrom,
          expiredDateTo: draftExpiredTo,
          page: 1,
        })
      "
      @clear="emit('apply', { expiredDateFrom: '', expiredDateTo: '', page: 1 })"
    >
      <div class="flex flex-col gap-3">
        <DatePickerField v-model="draftExpiredFrom" placeholder="From" />
        <DatePickerField v-model="draftExpiredTo" placeholder="To" />
      </div>
    </OrderFilterPopover>

    <Button
      v-if="hasActiveDiscountFilters(filters)"
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
