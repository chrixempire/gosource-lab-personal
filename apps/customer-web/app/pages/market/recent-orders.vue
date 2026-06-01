<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import ExploreProductResponsiveGrid from '~/components/explore/ExploreProductResponsiveGrid.vue';
import MarketBranchSetupBanner from '~/components/market/MarketBranchSetupBanner.vue';
import MarketProductDetailSlideModal from '~/components/market/MarketProductDetailSlideModal.vue';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import { useCustomerMarketService } from '~/services/market.service';

definePageMeta({ layout: 'customer-explore' });

const router = useRouter();
const { listRecentOrders } = useCustomerMarketService();
const { activeBranchId, hasSession, isReady: branchContextReady } =
  useBusinessBranchContext();

const products = ref<MarketProduct[]>([]);
const loading = ref(true);

const modalProduct = ref<MarketProduct | null>(null);

function openProductAddModal(product: MarketProduct) {
  modalProduct.value = product;
}

function onModalOpenChange(open: boolean) {
  if (!open) {
    modalProduct.value = null;
  }
}

provide('marketOpenAddModal', openProductAddModal);

async function loadRecentOrders() {
  if (!hasSession.value || !activeBranchId.value) {
    products.value = [];
    loading.value = false;
    return;
  }

  loading.value = products.value.length === 0;

  try {
    const response = await listRecentOrders(activeBranchId.value, { quiet: true });
    products.value = response.data ?? [];
  } catch {
    products.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  [hasSession, activeBranchId, branchContextReady],
  ([sessionOk, branchId, ready]) => {
    if (!ready) {
      return;
    }

    if (!sessionOk || !branchId) {
      products.value = [];
      loading.value = false;
      return;
    }

    void loadRecentOrders();
  },
  { immediate: true },
);

useHead({
  title: 'Recently ordered · Market',
});
</script>

<template>
  <div data-testid="market-recent-orders-page" class="pb-10 pt-2">
    <MarketBranchSetupBanner />

    <div class="mb-2">
      <Button
        variant="neutral"
        size="small"
        class="!w-auto"
        :left-icon="ChevronLeft"
        @click="router.push('/market')"
      >
        Back
      </Button>
    </div>

    <header class="mb-2">
      <h1 class="text-2xl font-semibold tracking-tight text-grey-900 sm:text-[1.75rem]">
        Recently ordered
      </h1>
      <p
        v-if="!loading && products.length > 0"
        class="mt-1 text-sm text-grey-300"
      >
        {{ products.length }} {{ products.length === 1 ? 'item' : 'items' }} from your branch order history
      </p>
    </header>

    <div
      v-if="loading && products.length === 0"
      class="explore-products-grid-skeleton"
    >
      <div
        v-for="index in 8"
        :key="index"
        class="h-[320px] animate-pulse rounded-[12px] border border-grey-50 bg-grey-55"
      />
    </div>

    <ExploreProductResponsiveGrid
      v-else-if="products.length > 0"
      :products="products"
      card-rounded-class="rounded-[12px]"
    />

    <div
      v-else
      class="rounded-xl border border-dashed border-grey-50 bg-background-on-canvas px-6 py-16 text-center"
    >
      <p class="text-base font-semibold text-grey-900">No recent orders yet</p>
      <p class="mt-2 text-sm text-grey-300">
        Products you order will show up here for quick reordering.
      </p>
      <Button
        class="mt-6"
        type="button"
        @click="router.push('/market')"
      >
        Browse market
      </Button>
    </div>

    <MarketProductDetailSlideModal
      :open="Boolean(modalProduct)"
      :product="modalProduct"
      @update:open="onModalOpenChange"
    />
  </div>
</template>

<style scoped>
.explore-products-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (min-width: 900px) {
  .explore-products-grid-skeleton {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
}
</style>
