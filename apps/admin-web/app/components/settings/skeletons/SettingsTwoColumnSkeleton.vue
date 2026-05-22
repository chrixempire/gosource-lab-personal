<script setup lang="ts">
import SettingsFieldSkeleton from '~/components/settings/skeletons/SettingsFieldSkeleton.vue';

withDefaults(
  defineProps<{
    mainFieldCount?: number;
    sidebarRows?: number;
  }>(),
  {
    mainFieldCount: 5,
    sidebarRows: 3,
  },
);
</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row">
    <section
      class="w-full max-w-sm rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <div class="h-5 w-36 animate-pulse rounded bg-grey-55" />
      <div class="mt-4 flex items-center gap-3">
        <div class="size-12 shrink-0 animate-pulse rounded-full bg-grey-55" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 w-32 animate-pulse rounded bg-grey-55" />
          <div class="h-3 w-40 animate-pulse rounded bg-grey-55" />
        </div>
      </div>
      <div class="mt-5 space-y-3">
        <div
          v-for="index in sidebarRows"
          :key="`sidebar-row-${index}`"
          class="h-8 w-full animate-pulse rounded-lg bg-grey-55"
        />
      </div>
    </section>

    <section
      class="min-w-0 flex-1 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <div class="h-5 w-44 animate-pulse rounded bg-grey-55" />
      <div class="mt-5 space-y-4">
        <SettingsFieldSkeleton
          v-for="index in mainFieldCount"
          :key="`main-field-${index}`"
        />
        <div class="h-9 w-28 animate-pulse rounded-[10px] bg-grey-55" />
      </div>
    </section>
  </div>
</template>
