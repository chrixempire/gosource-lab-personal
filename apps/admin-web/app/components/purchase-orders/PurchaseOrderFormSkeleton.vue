<script setup lang="ts">
import SettingsFieldSkeleton from '~/components/settings/skeletons/SettingsFieldSkeleton.vue';

withDefaults(
  defineProps<{
    itemCount?: number;
  }>(),
  { itemCount: 2 },
);
</script>

<template>
  <div
    class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    aria-busy="true"
    aria-label="Loading purchase order"
  >
    <div class="space-y-6">
      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <div class="h-6 w-32 animate-pulse rounded bg-grey-55" />

        <div class="mt-4 space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="index in 2"
              :key="`type-${index}`"
              class="h-20 animate-pulse rounded-xl bg-grey-55"
            />
          </div>
          <SettingsFieldSkeleton />
          <SettingsFieldSkeleton />
          <div class="h-24 w-full animate-pulse rounded-xl bg-grey-55" />
          <SettingsFieldSkeleton />
        </div>
      </section>

      <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="h-6 w-16 animate-pulse rounded bg-grey-55" />
          <div class="h-10 w-64 animate-pulse rounded-xl bg-grey-55" />
        </div>

        <ul class="mt-4 space-y-3">
          <li
            v-for="index in itemCount"
            :key="`item-${index}`"
            class="flex items-center gap-3 rounded-xl border border-grey-50 p-3"
          >
            <div class="size-11 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="h-4 min-w-0 flex-1 animate-pulse rounded bg-grey-55" />
            <div class="h-10 w-24 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="h-10 w-16 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="h-4 w-20 shrink-0 animate-pulse rounded bg-grey-55" />
          </li>
        </ul>
      </section>
    </div>

    <aside class="h-fit rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
      <div class="h-6 w-24 animate-pulse rounded bg-grey-55" />
      <div class="mt-4 space-y-3">
        <div class="h-4 w-full animate-pulse rounded bg-grey-55" />
        <div class="h-4 w-full animate-pulse rounded bg-grey-55" />
        <div class="h-4 w-full animate-pulse rounded bg-grey-55" />
      </div>
      <div class="mt-4 h-10 w-full animate-pulse rounded-xl bg-grey-55" />
    </aside>
  </div>
</template>
