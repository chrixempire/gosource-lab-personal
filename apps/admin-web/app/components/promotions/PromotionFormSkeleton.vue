<script setup lang="ts">
import SettingsFieldSkeleton from '~/components/settings/skeletons/SettingsFieldSkeleton.vue';

withDefaults(
  defineProps<{
    itemCount?: number;
  }>(),
  { itemCount: 3 },
);
</script>

<template>
  <div
    class="w-full space-y-6"
    aria-busy="true"
    aria-label="Loading promotion details"
  >
    <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
      <div class="h-6 w-40 animate-pulse rounded bg-grey-55" />

      <div class="mt-4 space-y-4">
        <div class="space-y-3">
          <div class="h-3 w-16 animate-pulse rounded bg-grey-55" />
          <div class="flex flex-wrap items-center gap-3">
            <div
              v-for="index in 6"
              :key="`icon-${index}`"
              class="size-10 animate-pulse rounded-xl bg-grey-55"
            />
          </div>
          <div class="flex gap-2">
            <div
              v-for="index in 5"
              :key="`color-${index}`"
              class="size-8 animate-pulse rounded-full bg-grey-55"
            />
          </div>
        </div>

        <SettingsFieldSkeleton />
        <div class="space-y-2">
          <div class="h-3 w-24 animate-pulse rounded bg-grey-55" />
          <div class="h-24 w-full animate-pulse rounded-xl bg-grey-55" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <SettingsFieldSkeleton />
          <SettingsFieldSkeleton />
        </div>

        <div class="flex items-start gap-3 rounded-xl border border-grey-50 p-3">
          <div class="h-6 w-11 shrink-0 animate-pulse rounded-full bg-grey-55" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-4 w-44 animate-pulse rounded bg-grey-55" />
            <div class="h-3 w-full max-w-md animate-pulse rounded bg-grey-55" />
          </div>
        </div>

        <SettingsFieldSkeleton />
      </div>
    </section>

    <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
      <div class="h-6 w-16 animate-pulse rounded bg-grey-55" />

      <div class="mt-4 space-y-4">
        <div class="h-10 w-full animate-pulse rounded-xl bg-grey-55" />

        <ul class="space-y-3">
          <li
            v-for="index in itemCount"
            :key="`item-${index}`"
            class="flex items-center gap-3"
          >
            <div class="size-12 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="h-4 min-w-0 flex-1 animate-pulse rounded bg-grey-55" />
            <div class="size-9 shrink-0 animate-pulse rounded-lg bg-grey-55" />
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
