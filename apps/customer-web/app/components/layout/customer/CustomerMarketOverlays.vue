<script setup lang="ts">
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';

const MarketCartDrawer = defineAsyncComponent(
  () => import('~/components/market/MarketCartDrawer.vue'),
);
const AddToListPicker = defineAsyncComponent(
  () => import('~/components/lists/AddToListPicker.vue'),
);
const FirstBranchGate = defineAsyncComponent(
  () => import('~/components/onboarding/branch/FirstBranchGate.vue'),
);

const { cartDrawerOpen } = useMarketplaceUi();
const { branchGateOpen, handleBranchCreated } = useMarketBranchGate();
</script>

<template>
  <FirstBranchGate
    :open="branchGateOpen"
    @update:open="branchGateOpen = $event"
    @created="handleBranchCreated"
  />
  <MarketCartDrawer v-model:open="cartDrawerOpen" />
  <AddToListPicker />
</template>
