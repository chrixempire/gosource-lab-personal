<script setup lang="ts">
import { Button, DatePickerField, RadioGroup, RadioGroupItem } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import {
  ACTIVITY_LOG_ACTION_OPTIONS,
  ACTIVITY_LOG_INITIATOR_OPTIONS,
  hasActiveActivityLogFilters,
} from '~/lib/activity-log-filters';
import type { ActivityLogListFilters } from '~/types/activity-log';

const props = defineProps<{
  filters: ActivityLogListFilters;
  /** When provided, renders a Module filter (e.g. inventory: Items/Categories/Purchase orders). */
  moduleOptions?: { value: string; label: string }[];
}>();

const emit = defineEmits<{
  apply: [next: Partial<ActivityLogListFilters>];
  clearAll: [];
}>();

const moduleOpen = ref(false);
const actionOpen = ref(false);
const initiatorOpen = ref(false);
const dateOpen = ref(false);

const draftModule = ref('');
const draftAction = ref('');
const draftInitiatorType = ref('');
const draftStartDate = ref('');
const draftEndDate = ref('');

function syncDraft() {
  draftModule.value = props.filters.module;
  draftAction.value = props.filters.action;
  draftInitiatorType.value = props.filters.initiatorType;
  draftStartDate.value = props.filters.startDate;
  draftEndDate.value = props.filters.endDate;
}

watch(() => props.filters, syncDraft, { deep: true, immediate: true });
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-if="moduleOptions && moduleOptions.length"
      v-model:open="moduleOpen"
      label="Module"
      :active="Boolean(filters.module)"
      @open="syncDraft"
      @apply="emit('apply', { module: draftModule, page: 1 })"
      @clear="emit('apply', { module: '', page: 1 })"
    >
      <RadioGroup v-model="draftModule" class="flex flex-col gap-1">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All modules</span>
        </label>
        <label
          v-for="option in moduleOptions"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="actionOpen"
      label="Action"
      :active="Boolean(filters.action)"
      @open="syncDraft"
      @apply="emit('apply', { action: draftAction as ActivityLogListFilters['action'], page: 1 })"
      @clear="emit('apply', { action: '', page: 1 })"
    >
      <RadioGroup v-model="draftAction" class="flex flex-col gap-1">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All actions</span>
        </label>
        <label
          v-for="option in ACTIVITY_LOG_ACTION_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="initiatorOpen"
      label="Actor"
      :active="Boolean(filters.initiatorType)"
      @open="syncDraft"
      @apply="
        emit('apply', {
          initiatorType: draftInitiatorType as ActivityLogListFilters['initiatorType'],
          page: 1,
        })
      "
      @clear="emit('apply', { initiatorType: '', page: 1 })"
    >
      <RadioGroup v-model="draftInitiatorType" class="flex flex-col gap-1">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All actors</span>
        </label>
        <label
          v-for="option in ACTIVITY_LOG_INITIATOR_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.value" />
          <span>{{ option.label }}</span>
        </label>
      </RadioGroup>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="dateOpen"
      label="Date"
      :active="Boolean(filters.startDate || filters.endDate)"
      @open="syncDraft"
      @apply="emit('apply', { startDate: draftStartDate, endDate: draftEndDate, page: 1 })"
      @clear="emit('apply', { startDate: '', endDate: '', page: 1 })"
    >
      <div class="grid gap-3">
        <DatePickerField v-model="draftStartDate" label="From" />
        <DatePickerField v-model="draftEndDate" label="To" />
      </div>
    </OrderFilterPopover>

    <Button
      v-if="hasActiveActivityLogFilters(filters)"
      type="button"
      variant="link"
      size="small"
      class="!h-auto shrink-0 !w-auto !px-0 !py-1 !text-primary-500"
      @click="emit('clearAll')"
    >
      Clear all filters
    </Button>
  </div>
</template>
