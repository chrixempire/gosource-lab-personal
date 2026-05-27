<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';

const { totalItemCount, subtotalNaira } = useMarketplaceCart();
const { isAddingToRequest, bootstrapFromRoute } = useRequestAddItemsMode();
const { cartDrawerOpen } = useMarketplaceUi();

const countLabel = computed(() => {
  const count = totalItemCount.value;
  return count > 99 ? '99+' : String(count);
});

async function openCart() {
  if (isAddingToRequest.value) {
    await bootstrapFromRoute();
  }

  cartDrawerOpen.value = true;
}
</script>

<template>
  <button
    type="button"
    class="flex h-10 max-w-[min(52vw,14rem)] shrink-0 cursor-pointer items-center gap-2 rounded-full bg-button-primary py-1.5 pl-2.5 pr-3 text-white shadow-md transition hover:bg-button-primary-clicked sm:max-w-none sm:pr-3.5"
    :aria-label="isAddingToRequest ? 'View request items' : 'Open cart'"
    @click="openCart"
  >
    <ShoppingCart class="size-5 shrink-0" />
    <span class="min-w-[1.25rem] text-center text-sm font-bold tabular-nums">{{ countLabel }}</span>
    <span class="min-w-0 truncate border-l border-white/25 pl-2 text-xs font-bold tabular-nums sm:text-sm">
      {{ formatNaira(subtotalNaira) }}
    </span>
  </button>
</template>
