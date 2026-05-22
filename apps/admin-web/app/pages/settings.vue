<script setup lang="ts">
import { computed } from 'vue';
import SettingsTabNav from '~/components/settings/SettingsTabNav.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { SETTINGS_TAB_PATHS } from '~/lib/settings-constants';

const route = useRoute();
const { updateHeader } = useAdminHeader();

const showTabShell = computed(() => SETTINGS_TAB_PATHS.includes(route.path as (typeof SETTINGS_TAB_PATHS)[number]));

watch(
  showTabShell,
  (value) => {
    if (value) {
      updateHeader({ title: 'Settings', goBack: false });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="showTabShell" class="min-w-0">
    <SettingsTabNav />
    <div class="p-4 sm:p-6">
      <NuxtPage />
    </div>
  </div>
  <NuxtPage v-else />
</template>
