<script setup lang="ts">
import { Button, Checkbox, Input } from '@gosource/ui';
import OrderFilterPopover from '~/components/orders/OrderFilterPopover.vue';
import { formatNairaAmountInput, parseNairaAmountInput } from '~/lib/wallet-display';
import {
  hasActiveRequestFilters,
  REQUEST_STATUS_OPTIONS,
  type RequestListFilters,
  type RequestStatusFilter,
} from '~/lib/request-list-filters';

const props = defineProps<{
  filters: RequestListFilters;
  search: string;
  branchId: string;
}>();

const emit = defineEmits<{
  apply: [filters: Partial<RequestListFilters>];
  clearAll: [];
}>();

const amountOpen = ref(false);
const statusOpen = ref(false);

const draftAmountMin = ref('');
const draftAmountMax = ref('');
const draftStatus = ref<RequestStatusFilter[]>([]);

function syncDraftFromProps() {
  draftAmountMin.value =
    props.filters.amountMin != null
      ? formatNairaAmountInput(String(props.filters.amountMin))
      : '';
  draftAmountMax.value =
    props.filters.amountMax != null
      ? formatNairaAmountInput(String(props.filters.amountMax))
      : '';
  draftStatus.value = [...props.filters.status];
}

function onDraftAmountMinInput(value: string) {
  draftAmountMin.value = formatNairaAmountInput(value);
}

function onDraftAmountMaxInput(value: string) {
  draftAmountMax.value = formatNairaAmountInput(value);
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

function openStatus() {
  syncDraftFromProps();
  statusOpen.value = true;
}

function applyAmount() {
  const minRaw = draftAmountMin.value.trim() ? parseNairaAmountInput(draftAmountMin.value) : Number.NaN;
  const maxRaw = draftAmountMax.value.trim() ? parseNairaAmountInput(draftAmountMax.value) : Number.NaN;
  emit('apply', {
    amountMin: Number.isFinite(minRaw) ? minRaw : null,
    amountMax: Number.isFinite(maxRaw) ? maxRaw : null,
  });
}

function clearAmount() {
  draftAmountMin.value = '';
  draftAmountMax.value = '';
  emit('apply', { amountMin: null, amountMax: null });
}

function applyStatus() {
  emit('apply', { status: [...draftStatus.value] });
}

function clearStatus() {
  draftStatus.value = [];
  emit('apply', { status: [] });
}

const amountActive = computed(
  () => props.filters.amountMin != null || props.filters.amountMax != null,
);
const statusActive = computed(() => props.filters.status.length > 0);
const selectedStatusCount = computed(() => props.filters.status.length);
const showClearAll = computed(() =>
  hasActiveRequestFilters({
    filters: props.filters,
    search: props.search,
    branchId: props.branchId,
  }),
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <OrderFilterPopover
      v-model:open="statusOpen"
      label="Request status"
      :active="statusActive"
      :badge-count="statusActive ? selectedStatusCount : 0"
      @apply="applyStatus"
      @clear="clearStatus"
      @update:open="(value) => value && openStatus()"
    >
      <div class="flex max-h-56 flex-col gap-2">
        <label
          v-for="option in REQUEST_STATUS_OPTIONS"
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
      v-model:open="amountOpen"
      label="Price"
      :active="amountActive"
      @apply="applyAmount"
      @clear="clearAmount"
      @update:open="(value) => value && openAmount()"
    >
      <div class="grid gap-3">
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">Minimum</span>
          <Input
            :model-value="draftAmountMin"
            inputmode="numeric"
            placeholder="0"
            @update:model-value="onDraftAmountMinInput"
          />
        </label>
        <label class="grid gap-1.5 text-sm text-grey-700">
          <span class="font-medium">Maximum</span>
          <Input
            :model-value="draftAmountMax"
            inputmode="numeric"
            placeholder="Any"
            @update:model-value="onDraftAmountMaxInput"
          />
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
