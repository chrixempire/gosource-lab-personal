<script setup lang="ts">
import { Button, Checkbox, DatePickerField, Input } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import {
  CUSTOMER_ACCOUNT_TYPES,
  CUSTOMER_CREDIT_OPTIONS,
  CUSTOMER_STATUS_OPTIONS,
} from '~/lib/customer-constants';
import { hasActiveCustomerFilters } from '~/lib/customer-filters';
import type { CustomerListFilters } from '~/types/customers';

const props = defineProps<{ filters: CustomerListFilters }>();
const emit = defineEmits<{
  apply: [next: Partial<CustomerListFilters>];
  clearAll: [];
}>();

const accountOpen = ref(false);
const statusOpen = ref(false);
const creditOpen = ref(false);
const spentOpen = ref(false);
const joinedOpen = ref(false);

const draftAccount = ref<string[]>([]);
const draftStatus = ref<string[]>([]);
const draftCredit = ref<string[]>([]);
const draftMin = ref('');
const draftMax = ref('');
const draftStart = ref('');
const draftEnd = ref('');

function sync() {
  draftAccount.value = [...props.filters.accountType];
  draftStatus.value = [...props.filters.status];
  draftCredit.value = [...props.filters.useCredit];
  draftMin.value = props.filters.amountMin;
  draftMax.value = props.filters.amountMax;
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
      v-model:open="accountOpen"
      label="Account type"
      :active="filters.accountType.length > 0"
      @open="sync"
      @apply="emit('apply', { accountType: [...draftAccount] as CustomerListFilters['accountType'], page: 1 })"
      @clear="emit('apply', { accountType: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CUSTOMER_ACCOUNT_TYPES"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftAccount.includes(option.value)"
            @update:model-value="draftAccount = toggle(draftAccount, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Status"
      :active="filters.status.length > 0"
      @open="sync"
      @apply="emit('apply', { status: [...draftStatus] as CustomerListFilters['status'], page: 1 })"
      @clear="emit('apply', { status: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CUSTOMER_STATUS_OPTIONS"
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
      v-model:open="creditOpen"
      label="Use credit"
      :active="filters.useCredit.length > 0"
      @open="sync"
      @apply="emit('apply', { useCredit: [...draftCredit] as CustomerListFilters['useCredit'], page: 1 })"
      @clear="emit('apply', { useCredit: [], page: 1 })"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in CUSTOMER_CREDIT_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="draftCredit.includes(option.value)"
            @update:model-value="draftCredit = toggle(draftCredit, option.value)"
          />
          {{ option.label }}
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="spentOpen"
      label="Total spent"
      :active="Boolean(filters.amountMin || filters.amountMax)"
      @open="sync"
      @apply="emit('apply', { amountMin: draftMin, amountMax: draftMax, page: 1 })"
      @clear="emit('apply', { amountMin: '', amountMax: '', page: 1 })"
    >
      <div class="flex flex-col gap-3">
        <Input v-model="draftMin" type="number" min="0" label="Min amount" />
        <Input v-model="draftMax" type="number" min="0" label="Max amount" />
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="joinedOpen"
      label="Date joined"
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
      v-if="hasActiveCustomerFilters(filters)"
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
