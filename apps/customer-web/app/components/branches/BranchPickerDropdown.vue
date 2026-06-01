<script setup lang="ts">
import type { BranchRecord } from '@gosource/api-client';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';
import { ALL_BRANCHES_VALUE } from '~/lib/branch-picker';
import { insightFilterMenuItemClass } from '~/lib/insight-date-filter';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    branches: BranchRecord[];
    disabled?: boolean;
    loading?: boolean;
    showAllBranchesOption?: boolean;
    /** When true, only the green filter control is shown (default for page toolbars). */
    hideLabel?: boolean;
  }>(),
  {
    showAllBranchesOption: false,
    hideLabel: true,
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

const triggerDisabled = computed(
  () => props.disabled || props.loading || (!props.branches.length && !showAllOption.value),
);

function selectBranch(branchId: string) {
  emit('update:modelValue', branchId);
  search.value = '';
}

function isSelected(branchId: string) {
  return props.modelValue === branchId;
}
</script>

<template>
  <div :class="hideLabel ? undefined : 'block space-y-2'">
    <span
      v-if="!hideLabel"
      class="text-[13px] font-semibold text-grey-text"
    >
      Branch
    </span>
    <div class="w-full min-[720px]:w-fit">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="primary"
            size="small"
            class="!w-fit max-w-full shrink-0 whitespace-nowrap"
            :right-icon="ChevronDown"
            :disabled="triggerDisabled"
          >
            <span class="min-w-0 truncate">{{ triggerLabel }}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          class="flex max-h-[min(18rem,70vh)] min-w-[12rem] w-[var(--reka-dropdown-menu-trigger-width)] flex-col overflow-hidden p-0"
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

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            <DropdownMenuItem
              v-if="showAllOption"
              :class="insightFilterMenuItemClass(isSelected(ALL_BRANCHES_VALUE))"
              @select="selectBranch(ALL_BRANCHES_VALUE)"
            >
              <span class="min-w-0 truncate">All branches</span>
              <Check
                class="size-4 shrink-0 text-primary-500"
                :class="isSelected(ALL_BRANCHES_VALUE) ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
              />
            </DropdownMenuItem>

            <DropdownMenuItem
              v-for="branch in filteredBranches"
              :key="branch.id"
              :class="insightFilterMenuItemClass(isSelected(branch.id))"
              @select="selectBranch(branch.id)"
            >
              <span class="min-w-0 truncate">
                {{ branch.branchName }}{{ branch.isHeadquarter ? ' (Headquarter)' : '' }}
              </span>
              <Check
                class="size-4 shrink-0 text-primary-500"
                :class="isSelected(branch.id) ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
              />
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
    </div>
  </div>
</template>
