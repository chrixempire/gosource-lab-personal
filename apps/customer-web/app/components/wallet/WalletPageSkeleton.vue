<script setup lang="ts">
import WalletSkeletonBar from '~/components/wallet/WalletSkeletonBar.vue';
import WalletTransactionsTableSkeleton from '~/components/wallet/WalletTransactionsTableSkeleton.vue';
import WalletTransactionsToolbarSkeleton from '~/components/wallet/WalletTransactionsToolbarSkeleton.vue';

withDefaults(
  defineProps<{
    tableRowCount?: number;
  }>(),
  {
    tableRowCount: 8,
  },
);
</script>

<template>
  <div
    class="flex w-full flex-col gap-6"
    aria-busy="true"
    aria-live="polite"
    aria-label="Loading wallet"
  >
    <section
      class="customer-brand-panel flex flex-wrap items-center justify-between gap-4 rounded-[24px] p-4"
    >
      <div class="min-w-0 flex-1 space-y-3">
        <WalletSkeletonBar class="h-4 w-28" />
        <WalletSkeletonBar class="h-9 w-44 max-w-[70%]" />
      </div>
      <WalletSkeletonBar class="h-10 w-32 shrink-0 rounded-[10px]" />
    </section>

    <section class="w-full rounded-[24px] border border-grey-50 bg-grey-55 p-6">
      <div class="flex w-full flex-col gap-6">
        <WalletSkeletonBar class="h-4 w-72 max-w-full" />

        <div class="flex flex-wrap gap-10">
          <div
            v-for="index in 3"
            :key="index"
            class="min-w-[120px] space-y-2.5"
          >
            <WalletSkeletonBar class="h-4 w-24" />
            <WalletSkeletonBar class="h-6 w-32" />
          </div>
        </div>

        <div class="space-y-2">
          <WalletSkeletonBar class="h-4 w-full max-w-2xl" />
          <WalletSkeletonBar class="h-4 w-[min(100%,28rem)]" />
        </div>
      </div>
    </section>

    <div class="flex w-full flex-col gap-4">
      <WalletTransactionsToolbarSkeleton />
      <WalletTransactionsTableSkeleton :row-count="tableRowCount" />
    </div>
  </div>
</template>
