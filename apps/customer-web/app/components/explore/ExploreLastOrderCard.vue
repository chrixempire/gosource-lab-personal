<script setup lang="ts">
import type { OrderRecord } from '@gosource/api-client';
import { Button } from '@gosource/ui';
import { Plus } from 'lucide-vue-next';
import { useExploreProcurementInsight } from '~/composables/useExploreProcurementInsight';
import { useReorderProducts } from '~/composables/useReorderProducts';
import { formatNaira } from '~/composables/useMarketplaceCart';
import {
  buildExploreLastOrderDraftLines,
  formatExploreOrderDateLabel,
  orderLineAvatarColor,
  orderLineAvatarInitial,
  remainingOrderAvatarCount,
  visibleOrderAvatarLines,
} from '~/lib/explore-last-order';
import ExploreLastOrderReviewModal from '~/components/explore/ExploreLastOrderReviewModal.vue';
import MarketProductImage from '~/components/market/MarketProductImage.vue';

const props = defineProps<{
  order: OrderRecord;
}>();

const reviewOpen = ref(false);
const { reorderProducts, reordering } = useReorderProducts();
const { refresh: refreshExploreProcurement } = useExploreProcurementInsight();

const draftLines = computed(() => buildExploreLastOrderDraftLines(props.order));
const avatarLines = computed(() => visibleOrderAvatarLines(draftLines.value));
const extraCount = computed(() => remainingOrderAvatarCount(draftLines.value));
const dateLabel = computed(() => formatExploreOrderDateLabel(props.order.createdAt));
const totalLabel = computed(() => formatNaira(props.order.totalPrice));

async function onAddAll() {
  const result = await reorderProducts(
    props.order.products.map((line) => ({
      productId: line.productId,
      unit: line.unit,
      quantity: line.quantity,
      productName: line.productName,
    })),
    { navigateToMarket: false, openDrawer: true },
  );

  if (result.ok) {
    void refreshExploreProcurement({ force: true });
  }
}

function onReview() {
  reviewOpen.value = true;
}
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[24px] bg-primary-500 p-5 text-white transition-transform duration-300 ease-out hover:-translate-y-1"
  >
    <div class="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/75">
      <span class="inline-flex items-center gap-1.5">
        <span class="size-1.5 rounded-full bg-white" aria-hidden="true" />
        Order again
      </span>
      <span v-if="dateLabel">{{ dateLabel }}</span>
    </div>

    <p class="mt-3 text-lg font-semibold leading-snug">
      Your last basket, ready in two taps.
    </p>

    <div class="mt-4 flex min-w-0 items-center gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <div class="flex items-center">
          <div
            v-for="(line, index) in avatarLines"
            :key="line.key"
            class="relative -ml-2.5 first:ml-0"
            :style="{ zIndex: avatarLines.length - index }"
          >
            <div
              class="relative size-11 overflow-hidden rounded-[12px] border-2 border-primary-500 shadow-sm"
              :style="{ backgroundColor: orderLineAvatarColor(index).bg }"
            >
              <MarketProductImage
                v-if="line.imageUrl"
                :src="line.imageUrl"
                :alt="line.productName"
                :hover-zoom="false"
                logo-class="h-6 w-6"
              />
              <span
                v-else
                class="flex size-full items-center justify-center text-sm font-bold"
                :style="{ color: orderLineAvatarColor(index).text }"
              >
                {{ orderLineAvatarInitial(line.productName) }}
              </span>
            </div>
          </div>
        </div>

        <p v-if="extraCount > 0" class="text-sm text-white/85">
          +{{ extraCount }} more
        </p>
      </div>

      <p class="shrink-0 text-base font-semibold tabular-nums text-white">
        {{ totalLabel }}
      </p>
    </div>

    <div class="mt-auto grid w-full grid-cols-[minmax(0,13fr)_minmax(0,7fr)] items-center gap-2 pt-5">
      <Button
        type="button"
        size="small"
        class="!h-10 !min-w-0 !w-full !rounded-full !bg-white !px-3 !text-sm !font-semibold !text-grey-900 hover:!bg-white/95"
        :left-icon="Plus"
        :loading="reordering"
        @click="onAddAll"
      >
        Add all to cart
      </Button>
      <Button
        type="button"
        size="small"
        variant="outline"
        class="!h-10 !min-w-0 !w-full !rounded-full !border-white/40 !bg-transparent !px-3 !text-sm !font-semibold !text-white hover:!bg-white/10"
        @click="onReview"
      >
        Review
      </Button>
    </div>

    <ExploreLastOrderReviewModal v-model:open="reviewOpen" :order="order" />
  </article>
</template>
