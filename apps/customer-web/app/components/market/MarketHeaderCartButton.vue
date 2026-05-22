<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';

const { totalItemCount } = useMarketplaceCart();
const { isAddingToRequest, bootstrapFromRoute } = useRequestAddItemsMode();
const { cartDrawerOpen } = useMarketplaceUi();
const { ensureBranchForAction } = useMarketBranchGate();
const { hasSession } = useCustomerSession();

async function openCart() {
  if (hasSession.value && !(await ensureBranchForAction())) {
    return;
  }

  if (isAddingToRequest.value) {
    await bootstrapFromRoute();
  }

  cartDrawerOpen.value = true;
}
</script>

<template>
  <button
    type="button"
    class="flex h-10 shrink-0 items-center gap-2 rounded-full bg-button-primary px-3.5 text-white shadow-md transition hover:bg-button-primary-clicked"
    :aria-label="isAddingToRequest ? 'View request items' : 'Open cart'"
    @click="openCart"
  >
    <ShoppingCart class="size-5" />
    <span class="min-w-[1.25rem] text-center text-sm font-bold tabular-nums">{{ totalItemCount }}</span>
  </button>
</template>
