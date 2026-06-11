<script setup lang="ts">
import SettingsDeliveryFeePanel from '~/components/settings/SettingsDeliveryFeePanel.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import {
  parseDeliveryFeeConfig,
  parseSystemConfig,
} from '~/lib/settings-api';

const { data, pending, refresh } = await useAdminAuthenticatedFetch<unknown>('/api/system-config', {
  key: 'admin-system-config',
  staleAfterMs: 60_000,
});

const deliveryConfig = computed(() =>
  parseDeliveryFeeConfig(parseSystemConfig(data.value)),
);
</script>

<template>
  <SettingsDeliveryFeePanel
    :config="deliveryConfig"
    :loading="pending"
    @saved="refresh()"
  />
</template>
