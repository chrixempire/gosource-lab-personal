<script setup lang="ts">
import SettingsFieldSkeleton from '~/components/settings/skeletons/SettingsFieldSkeleton.vue';
import SettingsPermissionsSkeleton from '~/components/settings/skeletons/SettingsPermissionsSkeleton.vue';
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
    <section
      class="rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <div class="h-5 w-28 animate-pulse rounded bg-grey-55" />
      <div class="mt-5 space-y-4">
        <SettingsFieldSkeleton />
        <SettingsFieldSkeleton />
      </div>
    </section>

    <SettingsPermissionsSkeleton />
  </div>
</template>
