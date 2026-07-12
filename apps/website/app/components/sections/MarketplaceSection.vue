<script setup lang="ts">
import { CUSTOMER_MARKET_URL } from '~/lib/customer-app';

interface Favorite {
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  badge?: string;
}

// Shown while the live feed loads and as a fallback if the backend is unavailable.
const fallbackProducts: Favorite[] = [
  { image: '/images/product-01.png', name: 'Barbecue Sauce (Kraft)', price: '₦4,500', oldPrice: '₦5,000' },
  { image: '/images/product-02.png', name: 'Durcra Thyme', price: '₦4,200', oldPrice: '₦4,800', badge: '-12%' },
  { image: '/images/product-03.png', name: 'Ketchup (Alfa 5kg)', price: '₦11,000', oldPrice: '₦12,500', badge: '-10%' },
  { image: '/images/product-04.png', name: 'Ginger (Fresh 1kg)', price: '₦500' },
  { image: '/images/product-05.png', name: 'Nestle Maggi Star Chicken Flavour', price: '₦1,300', oldPrice: '₦1,500' },
  { image: '/images/product-06.png', name: 'Soy Sauce (Dark)', price: '₦2,550' },
  { image: '/images/product-07.png', name: 'Cayenne Pepper', price: '₦2,000' },
  { image: '/images/product-08.png', name: 'Ketchup in Sauce Cup', price: '₦1,500', oldPrice: '₦1,800' },
  { image: '/images/product-09.png', name: 'Sweet Chilli Sauce', price: '₦3,000', badge: 'New' },
  { image: '/images/product-10.png', name: 'Yeast (Instant)', price: '₦2,400' },
];

// Fetched on the server (cached, fast) so data is present on hydration; `lazy` avoids
// blocking client-side navigation and drives the skeleton on soft navigations.
const { data: liveProducts, status } = useFetch<Favorite[]>('/api/favorites', {
  lazy: true,
  default: () => [] as Favorite[],
});

const displayProducts = computed<Favorite[]>(() =>
  liveProducts.value && liveProducts.value.length > 0 ? liveProducts.value : fallbackProducts,
);

// Skeleton until the request settles; on success we show live data, on error the fallback.
const showSkeleton = computed(() => status.value === 'idle' || status.value === 'pending');
</script>

<template>
  <section id="market" class="bg-white py-16 lg:py-24">
    <div class="site-container">
      <SectionHeading
        eyebrow="Explore GoSource"
        title="Shop fresh supplies instantly"
        max-width="30rem"
      >
        Browse our marketplace and see today's prices. Order in bulk, save more,
        and get your delivery within 24 hours.
        <template #actions>
          <AppButton variant="primary" :href="CUSTOMER_MARKET_URL">
            Explore market
            <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
        </template>
      </SectionHeading>

      <div v-reveal class="mt-14 rounded-3xl border border-grey-100 bg-grey-50/40 p-5 sm:p-7 lg:p-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-display text-lg font-medium text-grey-900">Customer favorites</h3>
            <Icon name="lucide:heart" class="size-5 text-orange-500" />
          </div>
          <a :href="CUSTOMER_MARKET_URL" class="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline">
            See all <Icon name="lucide:chevron-right" class="size-4" />
          </a>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          <template v-if="showSkeleton">
            <ProductCardSkeleton v-for="n in 10" :key="`skeleton-${n}`" />
          </template>
          <template v-else>
            <ProductCard
              v-for="(p, i) in displayProducts"
              :key="p.name"
              v-reveal="i * 60"
              v-bind="p"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
