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
import { ALL_BRANCHES_VALUE } from '~/lib/branch-picker';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    branches: BranchRecord[];
    disabled?: boolean;
    /** While branches are being fetched for the first time or refresh. */
    loading?: boolean;
    /** Owner list pages: first option loads data for every branch. */
    showAllBranchesOption?: boolean;
  }>(),
  {
    showAllBranchesOption: false,
  },
);

const showAllOption = computed(() => props.showAllBranchesOption === true);

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
  if (showAllOption.value && props.modelValue === ALL_BRANCHES_VALUE) {
    return 'All branches';
  }
  const branch = selectedBranch.value;
  if (!branch) {
    return showAllOption.value ? 'All branches' : 'Select branch';
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
      <DropdownMenuTrigger
        as-child
        :disabled="disabled || loading || (!branches.length && !showAllOption)"
      >
        <button
          type="button"
          :class="[
            'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
            selectedBranch ||
            (showAllOption && modelValue === ALL_BRANCHES_VALUE) ||
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

      <DropdownMenuContent
        class="flex max-h-[min(18rem,70vh)] w-[var(--reka-dropdown-menu-trigger-width)] flex-col overflow-hidden p-0"
      >
        <div class="shrink-0 border-b border-grey-50 px-2 pb-2 pt-1">
          <Input
            :model-value="search"
            placeholder="Search branch"
            class="h-9 bg-background-on-canvas"
            @update:model-value="search = $event"
            @keydown.stop
          />
        </div>

        <div class="min-h-0 max-h-60 overflow-y-auto overscroll-contain py-1">
          <DropdownMenuItem
            v-if="showAllOption"
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </label>
</template>
