<script setup lang="ts">
import CustomerAppShell from '~/components/layout/customer/CustomerAppShell.vue';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';

const FirstBranchGate = defineAsyncComponent(
  () => import('~/components/onboarding/branch/FirstBranchGate.vue'),
);

const { branchGateOpen, handleBranchCreated } = useMarketBranchGate();
</script>

<template>
  <CustomerAppShell>
    <slot />
    <template #overlays>
      <ClientOnly>
        <FirstBranchGate
          :open="branchGateOpen"
          @update:open="branchGateOpen = $event"
          @created="handleBranchCreated"
        />
      </ClientOnly>
    </template>
  </CustomerAppShell>
</template>
