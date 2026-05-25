<script setup lang="ts">
import type { BranchRecord, EmployeeRole } from '@gosource/api-client';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@gosource/ui';
import { Check, ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  email: string;
  role: EmployeeRole | '';
  branchId: string;
  branches: BranchRecord[];
  loading?: boolean;
  emailError?: string;
  roleError?: string;
  branchError?: string;
}>();

const emit = defineEmits<{
  'update:email': [value: string];
  'update:role': [value: EmployeeRole];
  'update:branchId': [value: string];
  submit: [];
}>();

const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
];

const branchSearch = ref('');

const selectedBranchLabel = computed(() => {
  const branch = props.branches.find((b) => b.id === props.branchId);
  if (!branch) {
    return '';
  }
  return branch.branchName;
});

const filteredBranches = computed(() => {
  const query = branchSearch.value.trim().toLowerCase();

  if (!query) {
    return props.branches;
  }

  return props.branches.filter((branch) => {
    const haystack = [branch.branchName, branch.branchCode].join(' ').toLowerCase();
    return haystack.includes(query);
  });
});

function selectBranch(branchId: string) {
  emit('update:branchId', branchId);
  branchSearch.value = '';
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Email address</span>
      <Input
        :model-value="props.email"
        type="email"
        placeholder="teammate@business.com"
        autocomplete="email"
        :disabled="props.loading"
        :invalid="Boolean(props.emailError)"
        @update:model-value="emit('update:email', $event)"
      />
      <p v-if="props.emailError" class="text-[12px] font-medium text-negative-500">
        {{ props.emailError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Select role</span>
      <DropdownMenu>
        <DropdownMenuTrigger as-child :disabled="props.loading">
          <button
            type="button"
            :class="[
              'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
              props.role ? 'text-grey-900' : 'text-grey-400',
              props.roleError
                ? 'border border-negative-500 focus:border-negative-500 focus:ring-4 focus:ring-negative-500/10'
                : 'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
            ]"
          >
            <span>{{ roleOptions.find((item) => item.value === props.role)?.label ?? 'Select role' }}</span>
            <ChevronDown class="size-4 shrink-0 text-grey-300" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent class="w-[var(--reka-dropdown-menu-trigger-width)]">
          <DropdownMenuItem
            v-for="option in roleOptions"
            :key="option.value"
            @select="emit('update:role', option.value)"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <span>{{ option.label }}</span>
              <Check v-if="props.role === option.value" class="size-4 text-primary-500" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p v-if="props.roleError" class="text-[12px] font-medium text-negative-500">
        {{ props.roleError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Select branch</span>
      <DropdownMenu>
        <DropdownMenuTrigger as-child :disabled="props.loading || props.branches.length === 0">
          <button
            type="button"
            :class="[
              'flex h-10 w-full items-center justify-between rounded-[10px] bg-grey-55 px-4 py-2.5 text-left text-[14px] shadow-none outline-none transition disabled:cursor-not-allowed disabled:border-grey-50 disabled:bg-grey-50 disabled:text-grey-300 disabled:opacity-100',
              selectedBranchLabel ? 'text-grey-900' : 'text-grey-400',
              props.branchError
                ? 'border border-negative-500 focus:border-negative-500 focus:ring-4 focus:ring-negative-500/10'
                : 'border border-border-input-default focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12',
            ]"
          >
            <span>{{ selectedBranchLabel || 'Select branch' }}</span>
            <ChevronDown class="size-4 shrink-0 text-grey-300" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent class="max-h-72 w-[var(--reka-dropdown-menu-trigger-width)] overflow-y-auto">
          <div class="px-2 pb-2 pt-1">
            <Input
              :model-value="branchSearch"
              placeholder="Search branch"
              class="h-9 bg-background-on-canvas"
              @update:model-value="branchSearch = $event"
              @keydown.stop
            />
          </div>

          <DropdownMenuItem
            v-for="branch in filteredBranches"
            :key="branch.id"
            @select="selectBranch(branch.id)"
          >
            <div class="flex w-full items-center justify-between gap-3">
              <span class="min-w-0 truncate">{{ branch.branchName }}</span>
              <Check v-if="props.branchId === branch.id" class="size-4 shrink-0 text-primary-500" />
            </div>
          </DropdownMenuItem>

          <div
            v-if="filteredBranches.length === 0"
            class="px-3 py-2 text-[13px] text-grey-300"
          >
            No branch found for "{{ branchSearch }}"
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <p v-if="props.branchError" class="text-[12px] font-medium text-negative-500">
        {{ props.branchError }}
      </p>
    </label>

    <Button size="medium" class="w-full" type="submit" :loading="props.loading">
      Send invite
    </Button>
  </form>
</template>
