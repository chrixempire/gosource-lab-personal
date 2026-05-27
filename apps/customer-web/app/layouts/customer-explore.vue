<script setup lang="ts">
import CustomerAppShell from '~/components/layout/customer/CustomerAppShell.vue';
import ExploreFloatingCartButton from '~/components/explore/ExploreFloatingCartButton.vue';

const CustomerMarketOverlays = defineAsyncComponent(
  () => import('~/components/layout/customer/CustomerMarketOverlays.vue'),
);
</script>

<template>
  <CustomerAppShell show-market-header-cart flush-main-top-padding>
    <slot />
    <template #overlays>
      <ClientOnly>
        <ExploreFloatingCartButton />
        <CustomerMarketOverlays />
      </ClientOnly>
    </template>
  </CustomerAppShell>
</template>
