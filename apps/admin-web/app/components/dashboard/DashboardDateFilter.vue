<script setup lang="ts">
import { Check, ChevronDown } from 'lucide-vue-next';
import {
  Button,
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

const selectedLabel = computed(
  () =>
    DASHBOARD_DATE_PRESETS.find((preset) => preset.value === model.value.filterType)?.label ??
    'Today',
);

function selectPreset(filterType: DashboardDateFilterValue['filterType']) {
  model.value = { filterType };
}

function isSelected(filterType: DashboardDateFilterValue['filterType']) {
  return model.value.filterType === filterType;
}
</script>

<template>
  <div class="w-full min-[1000px]:w-fit">
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
  </div>
</template>
