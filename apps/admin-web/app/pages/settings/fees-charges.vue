<script setup lang="ts">
import SettingsDeliveryFeePanel from '~/components/settings/SettingsDeliveryFeePanel.vue';
import {
  parseDeliveryFeeConfig,
  parseSystemConfig,
} from '~/lib/settings-api';

const { data, pending, refresh } = await useFetch<unknown>('/api/system-config');

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
