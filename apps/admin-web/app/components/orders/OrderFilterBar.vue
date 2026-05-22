<script setup lang="ts">
import { Button, Checkbox, DatePickerField, Input, RadioGroup, RadioGroupItem } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import {
  ORDER_PAYMENT_METHOD_OPTIONS,
  ORDER_PAYMENT_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from '~/lib/order-constants';
import { hasActiveOrderFilters } from '~/lib/order-filters';
import { parseOrderCustomersResponse } from '~/lib/order-api';
import type { OrderListFilters } from '~/types/orders';

const props = defineProps<{
  filters: OrderListFilters;
}>();

const emit = defineEmits<{
  apply: [filters: Partial<OrderListFilters>];
  clearAll: [];
}>();

const amountOpen = ref(false);
const customerOpen = ref(false);
const paymentMethodOpen = ref(false);
const paymentStatusOpen = ref(false);
const statusOpen = ref(false);
const dateOpen = ref(false);

const draftAmountMin = ref<string>('');
const draftAmountMax = ref<string>('');
const draftBusiness = ref('');
const draftPaymentMethod = ref<string[]>([]);
const draftPaymentStatus = ref<string[]>([]);
const draftStatus = ref<string[]>([]);
const draftStartDate = ref('');
const draftEndDate = ref('');

const { data: customersPayload } = await useFetch<unknown>('/api/orders/customers', {
  query: { page: 1, limit: 100 },
});

const customerOptions = computed(() => parseOrderCustomersResponse(customersPayload.value));

function syncDraftFromProps() {
  draftAmountMin.value =
    props.filters.amountMin != null ? String(props.filters.amountMin) : '';
  draftAmountMax.value =
    props.filters.amountMax != null ? String(props.filters.amountMax) : '';
  draftBusiness.value = props.filters.business;
  draftPaymentMethod.value = [...props.filters.paymentMethod];
  draftPaymentStatus.value = [...props.filters.paymentStatus];
  draftStatus.value = [...props.filters.status];
  draftStartDate.value = props.filters.startDate;
  draftEndDate.value = props.filters.endDate;
}

watch(
  () => props.filters,
  () => syncDraftFromProps(),
  { deep: true, immediate: true },
);

function openAmount() {
  syncDraftFromProps();
  amountOpen.value = true;
}
function openCustomer() {
  syncDraftFromProps();
  customerOpen.value = true;
}
function openPaymentMethod() {
  syncDraftFromProps();
  paymentMethodOpen.value = true;
}
function openPaymentStatus() {
  syncDraftFromProps();
  paymentStatusOpen.value = true;
}
function openStatus() {
  syncDraftFromProps();
  statusOpen.value = true;
}
function openDate() {
  syncDraftFromProps();
  dateOpen.value = true;
}

function applyAmount() {
  const min = draftAmountMin.value.trim() ? Number(draftAmountMin.value) : null;
  const max = draftAmountMax.value.trim() ? Number(draftAmountMax.value) : null;
  emit('apply', {
    amountMin: Number.isFinite(min) ? min : null,
    amountMax: Number.isFinite(max) ? max : null,
    page: 1,
  });
}

function clearAmount() {
  draftAmountMin.value = '';
  draftAmountMax.value = '';
  emit('apply', { amountMin: null, amountMax: null, page: 1 });
}

function applyCustomer() {
  emit('apply', { business: draftBusiness.value, page: 1 });
}

function clearCustomer() {
  draftBusiness.value = '';
  emit('apply', { business: '', page: 1 });
}

function applyPaymentMethod() {
  emit('apply', { paymentMethod: [...draftPaymentMethod.value], page: 1 });
}

function clearPaymentMethod() {
  draftPaymentMethod.value = [];
  emit('apply', { paymentMethod: [], page: 1 });
}

function applyPaymentStatus() {
  emit('apply', { paymentStatus: [...draftPaymentStatus.value], page: 1 });
}

function clearPaymentStatus() {
  draftPaymentStatus.value = [];
  emit('apply', { paymentStatus: [], page: 1 });
}

function applyStatus() {
  emit('apply', { status: [...draftStatus.value], page: 1 });
}

function clearStatus() {
  draftStatus.value = [];
  emit('apply', { status: [], page: 1 });
}

function applyDate() {
  emit('apply', {
    startDate: draftStartDate.value,
    endDate: draftEndDate.value,
    page: 1,
  });
}

function clearDate() {
  draftStartDate.value = '';
  draftEndDate.value = '';
  emit('apply', { startDate: '', endDate: '', page: 1 });
}

const amountActive = computed(
  () => props.filters.amountMin != null || props.filters.amountMax != null,
);
const customerActive = computed(() => Boolean(props.filters.business));
const paymentMethodActive = computed(() => props.filters.paymentMethod.length > 0);
const paymentStatusActive = computed(() => props.filters.paymentStatus.length > 0);
const statusActive = computed(() => props.filters.status.length > 0);
const dateActive = computed(() => Boolean(props.filters.startDate || props.filters.endDate));
const showClearAll = computed(() => hasActiveOrderFilters(props.filters));
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="amountOpen"
      label="Amount"
      :active="amountActive"
      @apply="applyAmount"
      @clear="clearAmount"
      @update:open="(value) => value && openAmount()"
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
      v-model:open="customerOpen"
      label="Customer"
      :active="customerActive"
      panel-class="w-[min(22rem,calc(100vw-2rem))] p-0"
      @apply="applyCustomer"
      @clear="clearCustomer"
      @update:open="(value) => value && openCustomer()"
    >
      <RadioGroup v-model="draftBusiness" class="flex flex-col gap-2">
        <label
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem value="" />
          <span>All customers</span>
        </label>
        <label
          v-for="option in customerOptions"
          :key="option.id"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <RadioGroupItem :value="option.id" />
          <span class="truncate">{{ option.label }}</span>
        </label>
        <p v-if="customerOptions.length === 0" class="text-sm text-grey-300">
          No customers found.
        </p>
      </RadioGroup>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="paymentMethodOpen"
      label="Payment method"
      :active="paymentMethodActive"
      @apply="applyPaymentMethod"
      @clear="clearPaymentMethod"
      @update:open="(value) => value && openPaymentMethod()"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in ORDER_PAYMENT_METHOD_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftPaymentMethod.includes(option.value)"
            @update:model-value="
              (checked) =>
                (draftPaymentMethod = checked
                  ? [...draftPaymentMethod, option.value]
                  : draftPaymentMethod.filter((entry) => entry !== option.value))
            "
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="paymentStatusOpen"
      label="Payment status"
      :active="paymentStatusActive"
      @apply="applyPaymentStatus"
      @clear="clearPaymentStatus"
      @update:open="(value) => value && openPaymentStatus()"
    >
      <div class="flex flex-col gap-2">
        <label
          v-for="option in ORDER_PAYMENT_STATUS_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftPaymentStatus.includes(option.value)"
            @update:model-value="
              (checked) =>
                (draftPaymentStatus = checked
                  ? [...draftPaymentStatus, option.value]
                  : draftPaymentStatus.filter((entry) => entry !== option.value))
            "
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Order status"
      :active="statusActive"
      @apply="applyStatus"
      @clear="clearStatus"
      @update:open="(value) => value && openStatus()"
    >
      <div class="flex max-h-56 flex-col gap-2 overflow-y-auto">
        <label
          v-for="option in ORDER_STATUS_OPTIONS"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-grey-800 hover:bg-primary-50/60"
        >
          <Checkbox
            :model-value="draftStatus.includes(option.value)"
            @update:model-value="
              (checked) =>
                (draftStatus = checked
                  ? [...draftStatus, option.value]
                  : draftStatus.filter((entry) => entry !== option.value))
            "
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </OrderFilterPopover>

    <OrderFilterPopover
      v-model:open="dateOpen"
      label="Date"
      :active="dateActive"
      @apply="applyDate"
      @clear="clearDate"
      @update:open="(value) => value && openDate()"
    >
      <div class="grid gap-3">
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">From</span>
          <DatePickerField v-model="draftStartDate" placeholder="Start date" />
        </label>
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">To</span>
          <DatePickerField v-model="draftEndDate" placeholder="End date" />
        </label>
      </div>
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
