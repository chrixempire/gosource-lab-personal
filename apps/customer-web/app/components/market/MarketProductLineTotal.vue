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
    class="box-border flex w-full min-w-full max-w-none shrink-0 items-center justify-between gap-3 self-stretch rounded-[12px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-3 py-2.5 text-[15px]"
  >
    <span class="font-medium text-grey-900">Total price</span>
    <span class="shrink-0 font-semibold text-warning-700">
      {{ formatNaira(lineTotalNaira) }}
    </span>
  </div>
</template>
