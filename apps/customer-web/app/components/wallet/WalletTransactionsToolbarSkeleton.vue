<script setup lang="ts">
import WalletSkeletonBar from '~/components/wallet/WalletSkeletonBar.vue';
</script>

<template>
  <div class="flex w-full flex-col gap-4" aria-hidden="true">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <WalletSkeletonBar class="h-9 w-[3.25rem] rounded-full" />
        <WalletSkeletonBar class="h-9 w-[4.25rem] rounded-full" />
        <WalletSkeletonBar class="h-9 w-[3.75rem] rounded-full" />
      </div>

      <div
        class="flex h-9 items-center gap-1 rounded-full border border-grey-50 bg-white p-1"
      >
        <WalletSkeletonBar class="h-7 w-[3.75rem] rounded-full" />
        <WalletSkeletonBar class="h-7 w-[3.25rem] rounded-full" />
      </div>
    </div>

    <div
      class="flex w-full flex-col gap-3 min-[1000px]:flex-row min-[1000px]:items-center min-[1000px]:justify-between"
    >
      <WalletSkeletonBar class="h-10 w-full max-w-[300px] rounded-[10px]" />
      <WalletSkeletonBar class="h-4 w-32 rounded min-[1000px]:ml-auto" />
    </div>
  </div>
</template>
