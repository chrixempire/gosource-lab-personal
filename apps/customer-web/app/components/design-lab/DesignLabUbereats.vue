<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Search, Star } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

// Uber Eats — black + Uber green (#06C167), bold high-contrast Uber Move-style type,
// dense white cards, black pill category filters, green "Offer" / "% off" promo tags.
const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#06C167'; const FG = '#000000';

const added = ref(false);
const selected = ref<MarketProduct | null>(null);
const pdp = ref<MarketProduct | null>(null);
const qty = ref(1);
const selUnit = ref('');

// CATEGORY RAIL.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All'
    ? props.products
    : props.products.filter((p) => p.categoryName === activeCat.value),
);

const activeProduct = computed(() => pdp.value ?? selected.value);
const units = computed(() => (activeProduct.value ? designLabUnits(activeProduct.value) : []));
const selPrice = computed(
  () => units.value.find((u) => u.name === selUnit.value)?.priceNaira ?? activeProduct.value?.priceNaira ?? 0,
);

function openModal(p: MarketProduct) {
  selected.value = p; qty.value = 1; added.value = false;
  selUnit.value = designLabUnits(p)[0]?.name ?? p.unit ?? 'Unit';
}
function addFromModal() { if (selected.value) { cart.add(selected.value.id, selUnit.value, selPrice.value, qty.value); added.value = true; } }
function addFromPdp() { if (pdp.value) cart.add(pdp.value.id, selUnit.value, selPrice.value, qty.value); }
function viewFull() { if (selected.value) { pdp.value = selected.value; selected.value = null; } }

// Single-unit card helpers (default = first unit).
function addCard(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function setCard(p: MarketProduct, n: number) { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, n); }
function qtyCard(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:"Uber Move","Helvetica Neue",Inter,system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-black">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- STORE HEADER -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-[22px] font-extrabold leading-none tracking-tight">GoSource Grocery</h2>
        <p class="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[#545454]">
          <Star class="size-3.5 fill-black text-black" /> 4.8 · Delivery in 25 min · Free over ₦20,000
        </p>
      </div>
      <div class="flex items-center gap-2 rounded-full bg-[#F3F3F3] px-4 py-2 text-[13px] font-medium text-[#545454]">
        <Search class="size-4" /> Search this store
      </div>
    </div>

    <!-- CATEGORY RAIL (black pills, high contrast) -->
    <div class="ue-rail mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors"
        :class="activeCat === 'All'
          ? 'bg-black text-white'
          : 'bg-[#F3F3F3] text-black hover:bg-[#E8E8E8]'"
        @click="activeCat = 'All'"
      >
        All
      </button>
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-colors"
        :class="activeCat === c
          ? 'bg-black text-white'
          : 'bg-[#F3F3F3] text-black hover:bg-[#E8E8E8]'"
        @click="activeCat = c"
      >
        {{ c }}
      </button>
    </div>

    <!-- CARD GRID -->
    <div class="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="group rounded-[12px] bg-white transition"
      >
        <div class="relative">
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[12px] bg-[#F6F6F6]" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain p-2 transition group-hover:scale-[1.03]" />
            <span v-else class="text-4xl">🛒</span>
          </div>
          <!-- Green "Offer" / % promo tag -->
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-2 top-2 rounded-md bg-[#06C167] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-black"
          >{{ designLabDiscount(p)!.pct }}% Off</span>
          <div class="absolute bottom-2 right-2">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="'#000000'" :fg="'#ffffff'" variant="circle" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 flex items-baseline gap-1.5 leading-none">
          <span class="text-[16px] font-bold text-black">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#8F8F8F] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] font-medium leading-tight text-black hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p v-if="designLabIsMultiUnit(p)" class="mt-0.5 text-[12px] text-[#8F8F8F]">{{ designLabUnits(p).length }} unit options</p>
        <p v-else-if="p.unitPriceBadge" class="mt-0.5 text-[12px] text-[#8F8F8F]">{{ p.unitPriceBadge }}</p>
        <p v-else class="mt-0.5 text-[12px] text-[#8F8F8F]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[440px] rounded-t-3xl bg-white p-5 text-black shadow-2xl sm:rounded-3xl">
          <button class="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-[#F3F3F3] hover:bg-[#E8E8E8]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#F6F6F6]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain p-3" /><span v-else class="text-6xl">🛒</span>
            <span
              v-if="designLabDiscount(selected)"
              class="absolute left-3 top-3 rounded-md bg-[#06C167] px-2 py-1 text-[12px] font-extrabold uppercase tracking-wide text-black"
            >{{ designLabDiscount(selected)!.pct }}% Off</span>
          </div>
          <p class="mt-4 flex items-baseline gap-2 leading-none">
            <span class="text-[22px] font-extrabold text-black">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#8F8F8F] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </p>
          <h3 class="mt-1 text-[17px] font-bold leading-snug">{{ selected.name }}</h3>
          <p class="text-[13px] text-[#8F8F8F]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-5 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border-2 border-black px-3 py-1.5">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3.5 text-[15px] font-bold transition" :class="added ? 'bg-[#06C167] text-black' : 'bg-black text-white hover:bg-[#1a1a1a]'" @click="addFromModal">
              <Check v-if="added" class="size-4" :stroke-width="3" /> {{ added ? 'Added to cart' : 'Add to cart' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-black underline decoration-[#06C167] decoration-2 underline-offset-4" @click="viewFull">View full details →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-black">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#EDEDED] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[15px] font-bold text-black" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
          <span v-if="cart.count.value" class="rounded-full bg-black px-3 py-1.5 text-[13px] font-bold text-white">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[#F6F6F6]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-8" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="absolute left-4 top-4 rounded-md bg-[#06C167] px-3 py-1 text-[13px] font-extrabold uppercase tracking-wide text-black"
              >{{ designLabDiscount(pdp)!.pct }}% Off</span>
            </div>
            <div>
              <p class="text-[13px] font-semibold uppercase tracking-wide text-[#8F8F8F]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="mt-1 text-[28px] font-extrabold leading-tight tracking-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#8F8F8F]">{{ pdp.unit }}</p>
              <p class="mt-4 flex items-baseline gap-2 leading-none">
                <span class="text-[30px] font-extrabold text-black">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#8F8F8F] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border-2 border-black px-4 py-2.5">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full bg-black py-4 text-[16px] font-bold text-white hover:bg-[#1a1a1a]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-3 text-[13px] font-bold text-[#06C167]">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#EDEDED] border-y border-[#EDEDED]">
                <details class="py-4" open><summary class="cursor-pointer text-[15px] font-bold">Details</summary><p class="mt-2 text-[14px] leading-relaxed text-[#545454]">{{ pdp.description || 'Premium grocery item supplied by GoSource, delivered fast.' }}</p></details>
                <details class="py-4"><summary class="cursor-pointer text-[15px] font-bold">Nutrition</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[20px] font-extrabold tracking-tight">More from this store</h2>
            <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[12px] bg-white">
                <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-[12px] bg-[#F6F6F6]">
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain p-2" /><span v-else class="text-2xl">🛒</span>
                  <span v-if="designLabDiscount(r)" class="absolute left-1.5 top-1.5 rounded bg-[#06C167] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-black">{{ designLabDiscount(r)!.pct }}% Off</span>
                </div>
                <p class="mt-1.5 text-[14px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px] font-medium">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ue-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ue-rail::-webkit-scrollbar {
  display: none;
}
</style>
