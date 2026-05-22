<script setup lang="ts">
import { ORDER_CARD_HEIGHT } from '~/lib/order-list';
</script>

<template>
  <article
    class="box-border flex h-full w-full min-w-0 flex-col rounded-[24px] border border-grey-50 bg-white p-4 sm:p-5"
    :style="{ height: `${ORDER_CARD_HEIGHT}px` }"
    aria-hidden="true"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex items-start gap-2">
          <div class="mt-0.5 size-4 animate-pulse rounded-[5px] bg-grey-55" />
          <div class="h-5 w-[72%] animate-pulse rounded-md bg-grey-55" />
        </div>
        <div class="h-3.5 w-[42%] animate-pulse rounded-md bg-grey-55" />
      </div>
      <div class="size-9 shrink-0 animate-pulse rounded-full bg-grey-55" />
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 auto-rows-fr">
      <div
        v-for="index in 5"
        :key="index"
        class="flex min-h-[56px] flex-col rounded-xl border border-grey-75/80 bg-grey-55 px-3 py-2.5"
      >
        <div class="h-3 w-10 animate-pulse rounded bg-grey-50" />
        <div class="mt-1 h-4 w-16 animate-pulse rounded bg-grey-50" />
      </div>
    </div>
  </article>
</template>
