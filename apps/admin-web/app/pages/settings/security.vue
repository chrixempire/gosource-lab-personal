<script setup lang="ts">
import SettingsSecurityPanel from '~/components/settings/SettingsSecurityPanel.vue';
import { useAdminSession } from '~/composables/useAdminSession';

const { sessionResolved } = useAdminSession();

const securityLoading = computed(() => !sessionResolved.value);
</script>

<template>
  <SettingsSecurityPanel :loading="securityLoading" />
</template>
