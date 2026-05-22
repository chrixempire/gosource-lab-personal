<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number;
  }>(),
  {
    rows: 4,
  },
);
</script>

<template>
  <div class="animate-pulse space-y-3" aria-hidden="true" aria-busy="true" aria-label="Loading list items">
    <div class="flex items-center justify-between gap-3 px-1">
      <div class="flex items-center gap-2">
        <div class="size-4 shrink-0 rounded bg-grey-55" />
        <div class="h-4 w-[4.5rem] rounded-md bg-grey-55" />
      </div>
      <div class="h-4 w-24 rounded-md bg-grey-55" />
    </div>

    <ul class="divide-y divide-grey-50">
      <li
        v-for="index in rows"
        :key="index"
        class="flex gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="mt-3 size-4 shrink-0 rounded bg-grey-55" />

        <div class="size-16 shrink-0 rounded-full bg-grey-55" />

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1 space-y-2 pr-2">
              <div class="h-4 max-w-[10rem] rounded-md bg-grey-55" />
              <div class="h-3 max-w-[8rem] rounded-md bg-grey-55" />
            </div>
            <div class="h-4 w-14 shrink-0 rounded-md bg-grey-55" />
          </div>

          <div class="mt-2 flex items-center justify-between gap-2">
            <div class="h-8 w-[7.5rem] rounded-full bg-grey-55" />
            <div class="size-8 shrink-0 rounded-full bg-grey-55" />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
