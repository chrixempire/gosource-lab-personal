<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Building2, X } from 'lucide-vue-next';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';

const session = useState<{
  user_type?: 'customer' | 'employee';
  bootstrap?: { hasBranch?: boolean };
} | null>('customer-session', () => null);

const { hasBranch, openBranchGate } = useMarketBranchGate();
const { dismissed, dismiss } = useMarketBranchSetupDismissal();

const shouldShow = computed(() => {
  if (dismissed.value) {
    return false;
  }

  if (session.value?.user_type !== 'customer') {
    return false;
  }

  if (hasBranch.value) {
    return false;
  }

  return session.value?.bootstrap?.hasBranch === false;
});

function dismissBanner() {
  dismiss();
}
</script>

<template>
  <div
    v-if="shouldShow"
    class="mb-5 mt-3 rounded-[18px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-3.5 py-3.5 text-grey-text sm:px-4 sm:py-4"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <div class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-warning-700 shadow-sm">
          <Building2 class="size-5" />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-semibold text-grey-900">
            Create your first branch to start ordering
          </p>
          <p class="mt-1 text-[13px] leading-6">
            You can browse the market now, but cart and request actions need at least one business branch.
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <Button size="small" type="button" class="sm:flex-1" @click="openBranchGate">
              Create branch
            </Button>
            <Button variant="ghost" size="small" type="button" class="sm:flex-1" @click="dismissBanner">
              Maybe later
            </Button>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-grey-300 transition hover:bg-white/70 hover:text-grey-900"
        aria-label="Dismiss branch setup notice"
        @click="dismissBanner"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
</template>
