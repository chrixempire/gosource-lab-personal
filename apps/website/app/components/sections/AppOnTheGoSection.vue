<script setup lang="ts">
const features = [
  { icon: 'lucide:coins', title: 'Wallet payments', desc: 'Pay instantly with your GoSource Wallet.' },
  { icon: 'lucide:smartphone', title: 'Browse & order anywhere', desc: 'Shop directly from your phone.' },
  { icon: 'lucide:bike', title: 'Track deliveries live', desc: 'See exactly when your supplies arrive.' },
  { icon: 'lucide:truck', title: '24 hours delivery', desc: 'We deliver immediately or procure within 24 hours.' },
];

interface SimProduct {
  name: string;
  image: string;
  price: string;
  oldPrice?: string;
  badge?: string;
}

interface SimCategory {
  title: string;
  emoji: string;
  image: string;
  products: SimProduct[];
}

// Only used if the backend is unreachable — the live catalog replaces this on load.
const fallbackCatalog: SimCategory[] = [
  {
    title: 'Seasonings',
    emoji: '🌶️',
    image: '',
    products: [
      { name: 'Ducros Thyme', image: '/images/product-02.png', price: '₦4,200', oldPrice: '₦4,800', badge: '15% off' },
      { name: 'Barbecue Sauce', image: '/images/product-01.png', price: '₦4,500', oldPrice: '₦5,400', badge: '15% off' },
    ],
  },
];

// Fetched on the server (cached, fast) so data is present on hydration; `lazy` avoids
// blocking client-side navigation and keeps the loading state for soft navigations.
const { data: liveCatalog, status } = useFetch<SimCategory[]>('/api/catalog', {
  lazy: true,
  default: () => [] as SimCategory[],
});

const catalogLoading = computed(() => status.value === 'idle' || status.value === 'pending');

const catalog = computed<SimCategory[]>(() =>
  liveCatalog.value && liveCatalog.value.length > 0 ? liveCatalog.value : fallbackCatalog,
);

// Synthetic "All" tab mixes products from every category.
const allTab = computed<SimCategory>(() => ({
  title: 'All products',
  emoji: '🛒',
  image: '',
  products: catalog.value.flatMap((category) => category.products).slice(0, 14),
}));

const tabs = computed<SimCategory[]>(() => [allTab.value, ...catalog.value]);

const activeIndex = ref(0);
const expanded = ref(false);
const productsLoading = ref(false);
const qtys = reactive<Record<string, number>>({});
const screenBody = ref<HTMLElement | null>(null);
let loadTimer: ReturnType<typeof setTimeout> | undefined;

const activeCategory = computed<SimCategory>(() => tabs.value[activeIndex.value] ?? allTab.value);

// Collapsed: 2 rows (4). Expanded ("See all"): up to 4+ rows.
const visibleProducts = computed<SimProduct[]>(() => {
  const products = activeCategory.value?.products ?? [];
  return expanded.value ? products.slice(0, 14) : products.slice(0, 4);
});

const canSeeMore = computed(() => (activeCategory.value?.products.length ?? 0) > 4);
const skeletonCount = computed(() => (expanded.value ? 8 : 4));
const cartCount = computed(() => Object.values(qtys).reduce((total, qty) => total + qty, 0));

// Brief loading state to simulate fetching a category's products from the backend.
function simulateProductLoad() {
  productsLoading.value = true;
  if (loadTimer) {
    clearTimeout(loadTimer);
  }
  loadTimer = setTimeout(() => {
    productsLoading.value = false;
  }, 550);
}

function selectCategory(index: number) {
  if (index === activeIndex.value) {
    return;
  }
  activeIndex.value = index;
  expanded.value = false;
  simulateProductLoad();
  nextTick(() => screenBody.value?.scrollTo({ top: 0, behavior: 'smooth' }));
}

function seeAll() {
  expanded.value = true;
  simulateProductLoad();
}

function qtyOf(name: string) {
  return qtys[name] ?? 0;
}

function increment(name: string) {
  qtys[name] = (qtys[name] ?? 0) + 1;
}

function decrement(name: string) {
  const next = (qtys[name] ?? 0) - 1;
  if (next <= 0) {
    delete qtys[name];
  } else {
    qtys[name] = next;
  }
}

onBeforeUnmount(() => {
  if (loadTimer) {
    clearTimeout(loadTimer);
  }
});
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <!-- Copy + features -->
      <div>
        <SectionHeading
          eyebrow="Built for you"
          eyebrow-class="!text-orange-500"
          title="GoSource on the go"
          max-width="28rem"
        >
          Browse products, place orders, and track deliveries on the move. With
          GoSource at your fingertips, managing food supplies has never been
          easier.
          <template #actions>
            <AppStoreBadges />
          </template>
        </SectionHeading>

        <dl class="mt-12 grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <div v-for="(f, i) in features" :key="f.title" v-reveal="i * 80" class="flex gap-3.5">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-25 text-orange-500">
              <Icon :name="f.icon" class="size-5" />
            </span>
            <div>
              <dt class="font-medium text-grey-900">{{ f.title }}</dt>
              <dd class="mt-1 text-sm leading-relaxed text-grey-500">{{ f.desc }}</dd>
            </div>
          </div>
        </dl>
      </div>

      <!-- Phone mockup — a live simulation of the customer-web mobile market -->
      <div v-reveal="120" class="flex justify-center lg:justify-end">
        <div class="relative w-[18rem] sm:w-[20rem]">
          <!-- glow -->
          <div class="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary-100/60 to-grey-50 blur-2xl" />
          <!-- device -->
          <div class="relative overflow-hidden rounded-[2.75rem] border-[10px] border-grey-900 bg-grey-900 shadow-large">
            <!-- notch -->
            <div class="absolute left-1/2 top-2.5 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-grey-900" />
            <!-- screen -->
            <div class="relative flex h-[34rem] flex-col overflow-hidden rounded-[2.1rem] bg-white">
              <!-- Fixed top: brand + green cart pill + pill search -->
              <div class="shrink-0 bg-white pb-2">
                <div class="flex items-center justify-between px-4 pb-3 pt-7">
                  <div class="flex items-center gap-1.5">
                    <BrandLogo :with-wordmark="false" class="[&_svg]:h-6 [&_svg]:w-auto" />
                    <span class="font-display text-base font-semibold text-supporting-900">GoSource</span>
                  </div>
                  <span class="flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-bold text-white">
                    <Icon name="lucide:shopping-cart" class="size-3.5" /> {{ cartCount }}
                  </span>
                </div>
                <div class="px-4">
                  <div class="flex items-center gap-2 rounded-full bg-grey-50 px-4 py-2.5 text-sm text-grey-400">
                    <Icon name="lucide:search" class="size-4" /> Search for products
                  </div>
                </div>
              </div>

              <!-- Scrollable body -->
              <div
                ref="screenBody"
                class="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <!-- Circular category rail (pt keeps the active ring from being clipped by overflow) -->
                <div class="mt-3 flex gap-4 overflow-x-auto px-4 pb-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <template v-if="catalogLoading">
                    <div v-for="n in 5" :key="`cat-sk-${n}`" class="flex shrink-0 flex-col items-center gap-1.5">
                      <div class="size-11 animate-pulse rounded-full bg-grey-100" />
                      <div class="h-2 w-9 animate-pulse rounded bg-grey-100" />
                    </div>
                  </template>
                  <template v-else>
                    <button
                      v-for="(tab, index) in tabs"
                      :key="`${tab.title}-${index}`"
                      type="button"
                      class="flex shrink-0 cursor-pointer flex-col items-center gap-1.5"
                      @click="selectCategory(index)"
                    >
                      <span
                        class="flex size-11 items-center justify-center overflow-hidden rounded-full transition-all"
                        :class="index === activeIndex ? 'bg-primary-50 ring-2 ring-primary-500' : 'bg-grey-50'"
                      >
                        <img v-if="tab.image" :src="tab.image" :alt="tab.title" class="size-6 object-contain" >
                        <span v-else class="text-lg leading-none">{{ tab.emoji }}</span>
                      </span>
                      <span
                        class="max-w-[3.5rem] truncate text-[0.625rem]"
                        :class="index === activeIndex ? 'font-semibold text-primary-600' : 'font-medium text-grey-600'"
                      >{{ index === 0 ? 'All' : tab.title }}</span>
                    </button>
                  </template>
                </div>

                <!-- Section heading -->
                <div class="mt-5 flex items-center justify-between px-4">
                  <p class="font-display text-lg font-semibold text-grey-900">
                    {{ catalogLoading ? 'Loading…' : activeCategory.title }}
                  </p>
                  <button
                    v-if="!catalogLoading && canSeeMore && !expanded"
                    type="button"
                    class="cursor-pointer text-xs font-semibold text-primary-600"
                    @click="seeAll"
                  >
                    See all
                  </button>
                </div>

                <!-- Product grid (live) with loading skeletons -->
                <div class="mt-3 grid grid-cols-2 gap-3 px-4 pb-5">
                  <template v-if="catalogLoading || productsLoading">
                    <div
                      v-for="n in skeletonCount"
                      :key="`prod-sk-${n}`"
                      class="animate-pulse rounded-[18px] border border-grey-100 bg-white p-1.5"
                    >
                      <div class="aspect-square rounded-[13px] bg-grey-100" />
                      <div class="mt-2 h-2.5 w-4/5 rounded bg-grey-100" />
                      <div class="mt-1.5 h-2.5 w-1/2 rounded bg-grey-100" />
                      <div class="mt-2 h-7 rounded-full bg-grey-100" />
                    </div>
                  </template>
                  <template v-else>
                    <article
                      v-for="(product, index) in visibleProducts"
                      :key="`${product.name}-${index}`"
                      class="flex flex-col rounded-[18px] border border-grey-100 bg-white p-1.5"
                    >
                      <div class="relative aspect-square overflow-hidden rounded-[13px] bg-grey-50">
                        <img :src="product.image" :alt="product.name" class="h-full w-full object-contain p-2" >
                        <span
                          v-if="product.badge"
                          class="absolute left-1.5 top-1.5 rounded-full bg-primary-500 px-1.5 py-0.5 text-[0.5rem] font-bold leading-none text-white"
                        >{{ product.badge }}</span>
                      </div>
                      <p class="mt-1.5 line-clamp-1 px-0.5 text-[0.6875rem] font-medium text-grey-900">{{ product.name }}</p>
                      <div class="flex items-baseline gap-1 px-0.5 pb-0.5">
                        <span class="text-[0.6875rem] font-bold tabular-nums text-grey-900">{{ product.price }}</span>
                        <span v-if="product.oldPrice" class="text-[0.5625rem] tabular-nums text-grey-400 line-through">{{ product.oldPrice }}</span>
                      </div>
                      <div class="my-1 h-px bg-grey-100" />

                      <!-- Add → quantity strip -->
                      <div
                        v-if="qtyOf(product.name) > 0"
                        class="flex h-7 items-center overflow-hidden rounded-full bg-primary-500 p-0.5 text-white"
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          class="flex h-full basis-[35%] cursor-pointer items-center justify-center rounded-l-full transition hover:bg-white/15"
                          @click="decrement(product.name)"
                        >
                          <Icon name="lucide:minus" class="size-3" />
                        </button>
                        <span class="flex basis-[30%] items-center justify-center text-[0.6875rem] font-bold tabular-nums">
                          {{ qtyOf(product.name) }}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          class="flex h-full basis-[35%] cursor-pointer items-center justify-center rounded-r-full transition hover:bg-white/15"
                          @click="increment(product.name)"
                        >
                          <Icon name="lucide:plus" class="size-3" />
                        </button>
                      </div>
                      <button
                        v-else
                        type="button"
                        class="flex h-7 cursor-pointer items-center justify-center gap-1 rounded-full bg-primary-500 text-[0.625rem] font-semibold text-white transition hover:bg-primary-600"
                        @click="increment(product.name)"
                      >
                        <Icon name="lucide:plus" class="size-3" /> Add
                      </button>
                    </article>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
