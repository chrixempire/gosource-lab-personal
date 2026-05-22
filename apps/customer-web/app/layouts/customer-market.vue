<script setup lang="ts">
import CustomerAppShell from '~/components/layout/customer/CustomerAppShell.vue';
import MarketActiveRequestBanner from '~/components/market/MarketActiveRequestBanner.vue';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';

const CustomerMarketOverlays = defineAsyncComponent(
  () => import('~/components/layout/customer/CustomerMarketOverlays.vue'),
);

const { isAddingToRequest } = useRequestAddItemsMode();
</script>

<template>
  <CustomerAppShell show-market-header-cart market-main-padding>
    <template #before-content>
      <MarketActiveRequestBanner v-if="isAddingToRequest" />
    </template>
    <slot />
    <template #overlays>
      <ClientOnly>
        <CustomerMarketOverlays />
      </ClientOnly>
    </template>
  </CustomerAppShell>
</template>
