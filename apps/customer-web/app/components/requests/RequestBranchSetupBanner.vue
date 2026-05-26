<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Building2 } from 'lucide-vue-next';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';

const session = useState<{
  user_type?: 'customer' | 'employee';
  bootstrap?: { hasBranch?: boolean };
} | null>('customer-session', () => null);

const props = defineProps<{
  branchCount: number;
  /** When false, avoid flashing the banner while branch list is still loading. */
  branchesReady?: boolean;
}>();

const { openBranchGate } = useMarketBranchGate();

const shouldShow = computed(() => {
  if (session.value?.user_type !== 'customer') {
    return false;
  }

  if (!props.branchesReady) {
    return false;
  }

  return props.branchCount < 1;
});
</script>

<template>
  <div
    v-if="shouldShow"
    class="mb-5 mt-3 rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-3.5 py-3.5 text-grey-text sm:px-4 sm:py-4"
  >
    <div class="flex min-w-0 items-start gap-3">
      <div class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-warning-700 shadow-sm">
        <Building2 class="size-5" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-grey-900">
          Create a branch to view your requests
        </p>
        <p class="mt-1 text-[13px] leading-6">
          Order requests are tied to a business branch. Create your first branch to load and manage requests here.
        </p>

        <div class="mt-3">
          <Button
            size="small"
            type="button"
            class="!w-auto"
            @click="openBranchGate"
          >
            Create branch
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
