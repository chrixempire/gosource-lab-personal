<script setup lang="ts">
import SettingsProfileCard from '~/components/settings/SettingsProfileCard.vue';
import { useAdminSession } from '~/composables/useAdminSession';

const { sessionResolved } = useAdminSession();

const profileLoading = computed(() => !sessionResolved.value);
</script>

<template>
  <SettingsProfileCard :loading="profileLoading" />
</template>
