<script setup lang="ts">
import type { BranchRecord } from '@gosource/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';

/** Empty string means no branch filter (all branches). */
const ALL_BRANCHES_VALUE = '';

const props = defineProps<{
  modelValue: string;
  branches: BranchRecord[];
  disabled?: boolean;
  /** While branches are being fetched for the first time or refresh. */
  loading?: boolean;
  /** Super-admin views: first option loads data for every branch. */
  showAllBranchesOption?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [branchId: string];
}>();

const search = ref('');

const selectedBranch = computed(() => props.branches.find((b) => b.id === props.modelValue));

const triggerLabel = computed(() => {
  if (props.loading) {
    return 'Loading branches…';
  }
  if (!props.branches.length) {
    return 'No branches available';
  }
  if (props.showAllBranchesOption && props.modelValue === ALL_BRANCHES_VALUE) {
    return 'All branches';
  }
  const branch = selectedBranch.value;
  if (!branch) {
    return props.showAllBranchesOption ? 'All branches' : 'Select branch';
  }
  return `${branch.branchName}${branch.isHeadquarter ? ' (Headquarter)' : ''}`;
});

const filteredBranches = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return props.branches;
  }
  return props.branches.filter((b) => b.branchName.toLowerCase().includes(query));
});

function selectBranch(branchId: string) {
  emit('update:modelValue', branchId);
  search.value = '';
}
</script>

<template>
  <label class="block space-y-2">
    <span class="text-[13px] font-semibold text-grey-text">Branch</span>
    <DropdownMenu>
      <DropdownMenuTrigger as-child :disabled="disabled || loading || !branches.length">
        <button
          type="button"
          :class="[
            'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
            selectedBranch ||
            (showAllBranchesOption && modelValue === ALL_BRANCHES_VALUE) ||
            !branches.length
              ? 'text-grey-900'
              : 'text-grey-400',
            'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
          ]"
        >
          <span class="min-w-0 truncate">{{ triggerLabel }}</span>
          <ChevronDown class="size-4 shrink-0 text-grey-300" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-y-auto">
        <div class="px-2 pb-2 pt-1">
          <Input
            :model-value="search"
            placeholder="Search branch"
            class="h-9 bg-background-on-canvas"
            @update:model-value="search = $event"
            @keydown.stop
          />
        </div>

        <DropdownMenuItem
          v-if="showAllBranchesOption"
          @select="selectBranch(ALL_BRANCHES_VALUE)"
        >
          <div class="flex w-full min-w-0 items-center justify-between gap-3">
            <span class="min-w-0 truncate">All branches</span>
            <Check
              v-if="modelValue === ALL_BRANCHES_VALUE"
              class="size-4 shrink-0 text-primary-500"
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          v-for="branch in filteredBranches"
          :key="branch.id"
          @select="selectBranch(branch.id)"
        >
          <div class="flex w-full min-w-0 items-center justify-between gap-3">
            <span class="min-w-0 truncate">
              {{ branch.branchName }}{{ branch.isHeadquarter ? ' (Headquarter)' : '' }}
            </span>
            <Check v-if="modelValue === branch.id" class="size-4 shrink-0 text-primary-500" />
          </div>
        </DropdownMenuItem>

        <div
          v-if="filteredBranches.length === 0"
          class="px-3 py-2 text-[13px] text-grey-300"
        >
          No branch matches "{{ search }}"
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </label>
</template>
