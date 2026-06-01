<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { getMarketUnitPrice } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';

const props = defineProps<{
  product: MarketProduct;
  unit: string;
  quantity: number;
}>();

const unitPriceNaira = computed(() => getMarketUnitPrice(props.product, props.unit));

const lineTotalNaira = computed(() => {
  const qty = Math.max(0, props.quantity);
  return unitPriceNaira.value * qty;
});
</script>

<template>
  <div
    class="customer-product-total box-border flex w-full min-w-full max-w-none shrink-0 items-center justify-between gap-4 self-stretch rounded-[14px] px-4 py-3.5"
  >
    <span class="customer-product-total-label text-[13px] font-semibold uppercase tracking-[0.12em]">
      Total price
    </span>
    <span class="customer-product-total-price shrink-0 text-[18px] font-bold leading-none tabular-nums">
      {{ formatNaira(lineTotalNaira) }}
    </span>
  </div>
</template>
