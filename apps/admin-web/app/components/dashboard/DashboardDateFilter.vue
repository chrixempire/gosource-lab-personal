<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next';
import {
  Button,
  DatePickerField,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import {
  DASHBOARD_DATE_PRESETS,
  dashboardFilterMenuItemClass,
} from '~/lib/dashboard-date';
import type { DashboardDateFilterValue } from '~/types/dashboard';

const model = defineModel<DashboardDateFilterValue>({ required: true });

const { isLoading } = useDashboardLoading();

// True from the moment Apply is clicked until the dashboard sections finish
// refetching for the new range, so the button shows a spinner meanwhile.
const applying = ref(false);
watch(isLoading, (loading, wasLoading) => {
  if (wasLoading && !loading) {
    applying.value = false;
  }
});

// Whether the custom-range date pickers are visible. True when the committed
// filter is a custom range, or while the user is building one before applying.
const customOpen = ref(model.value.filterType === 'custom_range');
const draftStart = ref(model.value.startDate ?? '');
const draftEnd = ref(model.value.endDate ?? '');

watch(
  () => model.value,
  (value) => {
    customOpen.value = value.filterType === 'custom_range';
    draftStart.value = value.startDate ?? '';
    draftEnd.value = value.endDate ?? '';
  },
);

const rangeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});

function formatRangeDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : rangeFormatter.format(parsed);
}

const selectedLabel = computed(() => {
  if (
    model.value.filterType === 'custom_range' &&
    model.value.startDate &&
    model.value.endDate
  ) {
    return `${formatRangeDate(model.value.startDate)} – ${formatRangeDate(model.value.endDate)}`;
  }

  return (
    DASHBOARD_DATE_PRESETS.find((preset) => preset.value === model.value.filterType)?.label ??
    'Today'
  );
});

// ISO (YYYY-MM-DD) strings compare correctly with a lexicographic <=.
const canApplyCustom = computed(
  () => Boolean(draftStart.value && draftEnd.value && draftStart.value <= draftEnd.value),
);

function selectPreset(filterType: DashboardDateFilterValue['filterType']) {
  if (filterType === 'custom_range') {
    // Reveal the pickers but don't commit yet — the API rejects a range
    // without a valid start and end, so we wait for Apply.
    customOpen.value = true;
    return;
  }

  customOpen.value = false;
  model.value = { filterType };
}

function applyCustomRange() {
  if (!canApplyCustom.value) {
    return;
  }

  const next: DashboardDateFilterValue = {
    filterType: 'custom_range',
    startDate: draftStart.value,
    endDate: draftEnd.value,
  };

  // Re-applying the exact same range refetches nothing, so don't spin forever.
  const unchanged =
    model.value.filterType === next.filterType &&
    model.value.startDate === next.startDate &&
    model.value.endDate === next.endDate;
  if (unchanged) {
    return;
  }

  // Spin now; the isLoading watcher clears it once the sections finish loading
  // (the refetch begins a few ticks later, after the route query updates).
  applying.value = true;
  model.value = next;
}

function isSelected(filterType: DashboardDateFilterValue['filterType']) {
  if (filterType === 'custom_range') {
    return customOpen.value;
  }
  return model.value.filterType === filterType;
}
</script>

<template>
  <div class="flex w-full flex-col gap-2 min-[1000px]:w-fit min-[1000px]:flex-row min-[1000px]:items-center">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="primary"
          size="small"
          class="!w-fit shrink-0 whitespace-nowrap"
          :right-icon="ChevronDown"
        >
          {{ selectedLabel }}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="min-w-[12rem]">
        <DropdownMenuItem
          v-for="preset in DASHBOARD_DATE_PRESETS"
          :key="preset.value"
          :class="dashboardFilterMenuItemClass(isSelected(preset.value))"
          @select="selectPreset(preset.value)"
        >
          <span>{{ preset.label }}</span>
          <Check
            class="size-4 shrink-0 text-primary-500"
            :class="isSelected(preset.value) ? 'opacity-100' : 'opacity-0'"
            aria-hidden="true"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <div
      v-if="customOpen"
      class="flex w-full flex-col gap-2 min-[1000px]:w-fit min-[1000px]:flex-row min-[1000px]:items-center"
    >
      <DatePickerField
        v-model="draftStart"
        placeholder="Start date"
        class="min-[1000px]:w-40"
      />
      <DatePickerField
        v-model="draftEnd"
        placeholder="End date"
        class="min-[1000px]:w-40"
      />
      <Button
        variant="primary"
        size="small"
        class="!w-fit shrink-0"
        :disabled="!canApplyCustom"
        :loading="applying"
        @click="applyCustomRange"
      >
        Apply
      </Button>
    </div>
  </div>
</template>
