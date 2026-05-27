<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';

/** Matches active sidebar nav item background (`SidebarMenuButton`). */
const NAV_ITEM_ACTIVE_BG = '#04550B';
const FLOATING_CART_COUNT_BG = '#101928';

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
    data-testid="explore-floating-cart"
    class="fixed z-40 flex max-w-[min(100vw-2rem,18.5rem)] cursor-pointer items-center gap-3 rounded-full border border-white/15 py-2 pl-2 pr-3.5 text-left shadow-[0_20px_48px_-16px_rgba(4,85,11,0.55),0_12px_32px_-12px_rgba(16,24,40,0.45)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background-on-canvas bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] sm:bottom-6 sm:right-6"
    :style="{ backgroundColor: NAV_ITEM_ACTIVE_BG }"
    :aria-label="isAddingToRequest ? 'View request items' : 'Open cart'"
    @click="openCart"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums text-white"
      :style="{ backgroundColor: FLOATING_CART_COUNT_BG }"
    >
      {{ countLabel }}
    </span>

    <span class="min-w-0 flex-1">
      <span class="block text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
        Subtotal
      </span>
      <span class="block truncate text-[0.94rem] font-bold tabular-nums leading-tight text-white">
        {{ formatNaira(subtotalNaira) }}
      </span>
    </span>

    <ChevronRight class="size-5 shrink-0 text-white/80" aria-hidden="true" />
  </button>
</template>
