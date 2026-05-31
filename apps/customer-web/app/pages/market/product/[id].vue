<script setup lang="ts">
definePageMeta({ layout: 'customer-market' });

import type { MarketProduct } from '~/lib/marketplace-data';
import {
  effectiveUnitChoices,
  getMarketUnitChoice,
  isMarketProductInStock,
  registerMarketProduct,
} from '~/lib/marketplace-data';
import { Button, RadioGroup, RadioGroupItem } from '@gosource/ui';
import { ChevronLeft, ClipboardList } from 'lucide-vue-next';
import { useAddToList } from '~/composables/useAddToList';
import MarketBranchSetupBanner from '~/components/market/MarketBranchSetupBanner.vue';
import MarketProductDetailCartActions from '~/components/market/MarketProductDetailCartActions.vue';
import MarketProductLineTotal from '~/components/market/MarketProductLineTotal.vue';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import MarketSimilarProductsStrip from '~/components/market/MarketSimilarProductsStrip.vue';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { useAuthenticatedAsyncData } from '~/composables/useAuthenticatedAsyncData';
import { useCustomerMarketService } from '~/services/market.service';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';

const route = useRoute();
const router = useRouter();
const { getProduct, listCategories } = useCustomerMarketService();
const { categories, catalogList, hydrateFromStorage, setCategories, findProductById, findProductCategory } = useMarketCatalog();
const productId = computed(() => String(route.params.id ?? ''));

hydrateFromStorage();

const product = ref<MarketProduct | null>(null);
const cachedProduct = computed(() => (productId.value ? findProductById(productId.value) ?? null : null));

const { data: productDetailPayload, pending: loading } = await useAuthenticatedAsyncData(
  'market-product-detail',
  async () => {
    if (!productId.value) {
      return {
        product: null as MarketProduct | null,
        categories: [] as ReturnType<typeof catalogList>,
      };
    }

    const cached = findProductById(productId.value) ?? null;
    const needsCategories = catalogList().length === 0;
    const [productResult, categoriesResult] = await Promise.allSettled([
      getProduct(productId.value, { force: !cached, quiet: Boolean(cached) }),
      needsCategories ? listCategories({ force: false, quiet: true }) : null,
    ]);

    const nextCategories =
      categoriesResult.status === 'fulfilled' && categoriesResult.value
        ? (categoriesResult.value.data ?? [])
        : [];

    const nextProduct =
      productResult.status === 'fulfilled'
        ? (productResult.value.data ?? null)
        : (cached ?? null);

    return {
      product: nextProduct,
      categories: nextCategories,
    };
  },
  {
    watch: [productId],
    default: () => ({
      product: cachedProduct.value,
      categories: catalogList(),
    }),
    staleAfterMs: 5 * 60 * 1000,
  },
);

watch(
  productDetailPayload,
  async (payload) => {
    if (!payload) {
      return;
    }

    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
      setCategories(payload.categories);
    }

    product.value = payload.product ?? cachedProduct.value ?? null;

    if (product.value) {
      registerMarketProduct(product.value);
    }

    if (!product.value && productId.value) {
      await router.replace('/market');
    }
  },
  { immediate: true },
);

useHead({
  title: computed(() => (product.value ? `${product.value.name} · Market` : 'Market')),
});

const { getQtyForUnit } = useMarketplaceCart();
const { openPickerFromProduct } = useAddToList();

const unitChoices = computed(() => (product.value ? effectiveUnitChoices(product.value) : []));

const selectedUnit = ref('');

watch(
  () => [product.value?.id, unitChoices.value.join('\n')] as const,
  () => {
    const p = product.value;
    if (!p) {
      selectedUnit.value = '';
      return;
    }
    const opts = effectiveUnitChoices(p);
    const withQty = opts.find((u) => getQtyForUnit(p.id, u) > 0);
    selectedUnit.value = withQty ?? opts[0] ?? '';
  },
  { immediate: true },
);

watch(unitChoices, (opts) => {
  if (opts.length && !opts.includes(selectedUnit.value)) {
    selectedUnit.value = opts[0] ?? '';
  }
});

const similar = computed(() => {
  if (!product.value) {
    return [];
  }

  const category = findProductCategory(product.value.id);
  return category?.products.filter((item) => item.id !== product.value?.id).slice(0, 12) ?? [];
});

const selectedLineQty = computed(() =>
  product.value ? getQtyForUnit(product.value.id, selectedUnit.value) : 0,
);

const pickQty = ref(1);

watch(
  () => [product.value?.id, selectedUnit.value, selectedLineQty.value] as const,
  () => {
    const inCart = selectedLineQty.value;
    pickQty.value = Math.max(1, inCart > 0 ? inCart : 1);
  },
  { immediate: true },
);
const inStock = computed(() => isMarketProductInStock(product.value));

const displayUnitChoices = computed(() =>
  product.value
    ? unitChoices.value.map((unitName) => getMarketUnitChoice(product.value!, unitName)).filter(Boolean)
    : [],
);

const detailText = computed(
  () => product.value?.longDescription ?? product.value?.description ?? '',
);
const session = useState<{
  data?: { businessId?: string | null };
} | null>('customer-session', () => null);
const hasSession = computed(() => Boolean(session.value?.data?.businessId));
const { fetchBranchesInBackground } = useMarketBranchGate();


onMounted(async () => {
  void fetchBranchesInBackground();
});

function openSimilarProduct(product: MarketProduct) {
  router.push(`/market/product/${product.id}`);
}

provide('marketOpenAddModal', openSimilarProduct);

const listAddQuantity = computed(() => {
  const lineQty = selectedLineQty.value;
  return lineQty > 0 ? lineQty : 1;
});

async function onAddToList() {
  if (!product.value || !inStock.value || !selectedUnit.value) {
    return;
  }

  await openPickerFromProduct(product.value, selectedUnit.value, listAddQuantity.value);
}
</script>

<template>
  <div data-testid="market-product-page">
    <div v-if="product" class="pb-10 pt-2">
      <MarketBranchSetupBanner />

      <div class="mb-6">
        <Button
          variant="neutral"
          size="small"
          class="!w-auto"
          :left-icon="ChevronLeft"
          @click="navigateTo('/market')"
        >
          Back
        </Button>
      </div>

      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        <div class="mx-auto shrink-0 rounded-[22px] border-2 border-transparent p-1 lg:mx-0 lg:w-[min(38%,360px)]">
          <div
            class="group relative aspect-square w-full max-w-[320px] overflow-hidden rounded-[18px] bg-grey-55 lg:max-w-none"
          >
            <MarketProductImage
              :src="product.imageUrl"
              :alt="product.name"
              :hover-zoom="true"
              :class="{ grayscale: !inStock }"
            />
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-5">
          <header class="space-y-1">
            <h1 class="text-2xl font-semibold text-grey-900 sm:text-3xl">
              {{ product.name }}
            </h1>
            <div class="flex w-full items-center justify-between gap-3">
              <p v-if="product.brandLabel" class="min-w-0 text-[15px] leading-snug text-grey-300">
                Brand:
                <span class="font-semibold text-red-500">{{ product.brandLabel }}</span>
              </p>
              <span v-else class="min-w-0 flex-1" />
              <Button
                v-if="inStock"
                variant="neutral"
                size="small"
                class="!w-fit shrink-0 rounded-full!"
                type="button"
                :left-icon="ClipboardList"
                @click="onAddToList"
              >
                Add to list
              </Button>
            </div>
          </header>

          <div class="w-full max-w-full space-y-2 lg:max-w-[80%]">
            <h2 class="text-[12px] font-semibold uppercase tracking-[0.14em] text-grey-300">
              Product details
            </h2>
            <p class="text-[15px] leading-7 text-grey-text">
              {{ detailText }}
            </p>
          </div>

          <div class="flex w-full min-w-0 flex-col lg:max-w-[80%]">
            <section class="w-full min-w-0 space-y-1.5">
              <h2 class="text-[12px] font-semibold uppercase tracking-[0.14em] text-grey-300">
                Select preferred unit
              </h2>
              <RadioGroup v-model="selectedUnit" :name="`market-unit-page-${product.id}`" class="flex w-full flex-col gap-1.5">
                <label
                  v-for="opt in displayUnitChoices"
                  :key="opt!.name"
                  :class="[
                    'flex w-full cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors',
                    selectedUnit === opt!.name
                      ? 'border-primary-500 bg-primary-50/70 hover:border-primary-500 hover:bg-primary-50/70 dark:border-primary-500/45 dark:bg-primary-500/12 dark:hover:bg-primary-500/12'
                      : 'border-grey-50 bg-grey-55/40 hover:border-primary-500/40 hover:bg-primary-50/40 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/8',
                  ]"
                >
                  <RadioGroupItem :value="opt!.name" />
                  <span class="min-w-0 flex-1 text-[15px] font-medium capitalize text-grey-900">
                    {{ opt!.name }}
                  </span>
                  <span
                    :class="[
                      'shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-grey-900',
                      selectedUnit === opt!.name ? 'bg-transparent' : 'bg-grey-55',
                    ]"
                  >
                    <span v-if="opt!.measure">1{{ opt!.measure }} = </span>
                    <span :class="{ 'line-through text-grey-300': opt!.discountedPriceNaira }">
                      {{ formatNaira(opt!.priceNaira) }}
                    </span>
                    <span v-if="opt!.discountedPriceNaira" class="ml-1 text-red-500">
                      {{ formatNaira(opt!.discountedPriceNaira) }}
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </section>

            <template v-if="inStock && product">
              <div class="mt-8 flex flex-col gap-3">
                <MarketProductLineTotal
                  :product="product"
                  :unit="selectedUnit"
                  :quantity="pickQty"
                />
                <MarketProductDetailCartActions
                  v-model:quantity="pickQty"
                  :product="product"
                  :unit="selectedUnit"
                  :in-stock="inStock"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="-mx-4 mt-8 border-t border-grey-50 px-4 pb-6 pt-6 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
        <MarketSimilarProductsStrip flush :products="similar" />
      </div>
    </div>

    <div
      v-else-if="loading"
      class="flex flex-col items-center justify-center gap-2 py-20 text-center"
    >
      <p class="text-sm font-medium text-grey-900">
        Loading product…
      </p>
      <p class="max-w-xs text-xs text-grey-300">
        Fetching the latest product details.
      </p>
    </div>

    <div
      v-else
      class="py-16 text-center text-sm text-grey-300"
    >
      We couldn’t find this product right now.
    </div>
  </div>
</template>
