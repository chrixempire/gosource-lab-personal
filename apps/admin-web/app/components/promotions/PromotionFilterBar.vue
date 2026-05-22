<script setup lang="ts">
import { Button, Checkbox, DatePickerField } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { PROMOTION_FILTER_STATUS_OPTIONS } from '~/lib/promotion-constants';
import { hasActivePromotionFilters } from '~/lib/promotion-filters';
import type { PromotionListFilters, PromotionStatus } from '~/types/promotions';

const props = defineProps<{ filters: PromotionListFilters }>();
const emit = defineEmits<{
  apply: [next: Partial<PromotionListFilters>];
  clearAll: [];
}>();

const statusOpen = ref(false);
const createdOpen = ref(false);
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
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="filters.status.length > 0"
      @open="sync"
      @apply="emit('apply', { status: [...draftStatus] as PromotionStatus[], page: 1 })"
      @clear="emit('apply', { status: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in PROMOTION_FILTER_STATUS_OPTIONS"
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

    <Button
      v-if="hasActivePromotionFilters(filters)"
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
