<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number;
  }>(),
  { count: 4 },
);
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <div
      v-for="index in count"
      :key="index"
      class="max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-background-on-canvas p-3 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] sm:p-5"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <div class="size-10 shrink-0 animate-pulse rounded-full bg-grey-55" />
          <div class="min-w-0 flex-1 space-y-2 pt-0.5">
            <div class="flex flex-wrap items-center gap-2">
              <div class="h-5 max-w-[12rem] animate-pulse rounded-md bg-grey-55" />
              <div class="h-6 w-24 shrink-0 animate-pulse rounded-full bg-grey-55" />
            </div>
            <div class="h-3.5 w-full max-w-[18rem] animate-pulse rounded-md bg-grey-55" />
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
          <div class="size-9 shrink-0 animate-pulse rounded-full border border-grey-50 bg-grey-55" />
        </div>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div
          v-for="cardIndex in 4"
          :key="cardIndex"
          class="rounded-[18px] bg-grey-55 px-4 py-3"
        >
          <div class="h-3 w-20 animate-pulse rounded-full bg-grey-100" />
          <div class="mt-2 h-4 w-16 animate-pulse rounded-full bg-grey-100" />
        </div>
      </div>
    </div>
  </div>
</template>
