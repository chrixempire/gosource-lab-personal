<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@gosource/ui';
import { Check, ChevronDown, Store } from 'lucide-vue-next';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

const props = defineProps<{
  session: CustomerMeResponse | null;
}>();

const emit = defineEmits<{
  mobileNavClose: [];
}>();

const {
  branches,
  activeBranchId,
  activeBranch,
  canSwitchBranch,
  branchFetchLoading,
  isReady,
  setActiveBranch,
  ensureBranchesLoaded,
} = useBusinessBranchContext();

const search = ref('');

const showSwitcher = computed(
  () => isBusinessOwnerSession(props.session) && canSwitchBranch.value,
);

const triggerLabel = computed(() => {
  if (branchFetchLoading.value && !isReady.value) {
    return 'Loading branches…';
  }

  if (!activeBranch.value) {
    return 'Select branch';
  }

  const name = activeBranch.value.branchName;
  return activeBranch.value.isHeadquarter ? `${name} (Headquarter)` : name;
});

const filteredBranches = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return branches.value ?? [];
  }

  return (branches.value ?? []).filter((branch) =>
    branch.branchName.toLowerCase().includes(query),
  );
});

function branchLabel(branch: (typeof branches.value)[number]) {
  return `${branch.branchName}${branch.isHeadquarter ? ' (Headquarter)' : ''}`;
}

function onSelectBranch(branchId: string) {
  if (branchId === activeBranchId.value) {
    return;
  }

  emit('mobileNavClose');
  setActiveBranch(branchId);
}

onMounted(() => {
  if (showSwitcher.value) {
    void ensureBranchesLoaded();
  }
});
</script>

<template>
  <div v-if="showSwitcher" class="mt-2 border-t border-grey-50 pt-3">
    <p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-grey-400">
      Active branch
    </p>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="flex h-10 w-full items-center justify-between gap-2 rounded-[12px] border border-grey-50 bg-grey-55/80 px-3 text-left text-sm font-medium text-grey-900 transition hover:bg-grey-55"
        >
          <span class="flex min-w-0 items-center gap-2">
            <Store class="size-4 shrink-0 text-grey-400" aria-hidden="true" />
            <span class="min-w-0 truncate">{{ triggerLabel }}</span>
          </span>
          <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
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

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
          <DropdownMenuItem
            v-for="branch in filteredBranches"
            :key="branch.id"
            @select="onSelectBranch(branch.id)"
          >
            <div class="flex w-full min-w-0 items-center justify-between gap-3">
              <span class="min-w-0 truncate">{{ branchLabel(branch) }}</span>
              <Check
                v-if="activeBranchId === branch.id"
                class="size-4 shrink-0 text-primary-500"
              />
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
    <p class="mt-2 px-1 text-xs leading-5 text-grey-400">
      Cart and checkout use this branch. List pages can filter separately.
    </p>
  </div>
</template>
