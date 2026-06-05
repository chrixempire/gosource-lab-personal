<script setup lang="ts">
const bars = [
  { label: 'Aug', h: 58 },
  { label: 'Sept', h: 44 },
  { label: 'Oct', h: 70 },
  { label: 'Nov', h: 78 },
  { label: 'Dec', h: 90 },
];
</script>

<template>
  <div class="relative h-full min-h-[20rem]">
    <!-- Total amount card -->
    <div class="absolute left-0 top-2 z-10 w-[64%] rounded-2xl bg-white p-4 shadow-medium">
      <div class="flex items-center gap-1.5">
        <p class="text-sm text-grey-500">Total amount</p>
        <Icon name="lucide:info" class="size-3.5 text-grey-300" />
      </div>
      <div class="mt-1 flex items-center gap-2">
        <p class="font-display text-xl font-medium text-grey-900">₦7,525,270</p>
        <span class="inline-flex items-center gap-0.5 rounded-full bg-success-50 px-1.5 py-0.5 text-[0.625rem] font-semibold text-success-700">
          <Icon name="lucide:arrow-up-right" class="size-3" /> 12%
        </span>
      </div>
      <!-- area chart -->
      <svg viewBox="0 0 220 80" class="mt-3 h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#19B820" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#19B820" stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,60 C30,55 45,40 70,42 C95,44 105,18 135,20 C160,22 180,38 220,30 L220,80 L0,80 Z" fill="url(#area)" />
        <path d="M0,60 C30,55 45,40 70,42 C95,44 105,18 135,20 C160,22 180,38 220,30" fill="none" stroke="#19B820" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <div class="mt-1 flex justify-between text-[0.625rem] text-grey-400">
        <span>Jan</span><span>Feb</span><span>Mar</span>
      </div>
    </div>

    <!-- Total orders card -->
    <div class="absolute right-0 top-20 z-20 w-[62%] rounded-2xl bg-white p-4 shadow-large">
      <div class="flex items-center gap-1.5">
        <p class="text-sm text-grey-500">Total orders</p>
        <Icon name="lucide:info" class="size-3.5 text-grey-300" />
      </div>
      <div class="mt-1 flex items-center gap-2">
        <p class="font-display text-xl font-medium text-grey-900">1,435</p>
        <span class="inline-flex items-center gap-0.5 rounded-full bg-success-50 px-1.5 py-0.5 text-[0.625rem] font-semibold text-success-700">
          <Icon name="lucide:arrow-up-right" class="size-3" /> 34%
        </span>
      </div>
      <div class="mt-3 flex h-20 items-end justify-between gap-2">
        <div v-for="b in bars" :key="b.label" class="flex flex-1 flex-col items-center gap-1">
          <div
            class="w-2.5 rounded-full bg-orange-500 transition-[height] duration-700 ease-[var(--ease-spring)]"
            :style="{ height: b.h + '%' }"
          />
          <span class="text-[0.5625rem] text-grey-400">{{ b.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
