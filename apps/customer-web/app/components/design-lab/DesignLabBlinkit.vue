<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Clock } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabCategoryEmoji, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();

// Blinkit brand: bright yellow surface + black text. The "ADD" control and
// savings flags use Blinkit's signature green.
const ACCENT = '#F8CB46'; // brand yellow (header / rail highlight)
const FG = '#1C1C1C'; // black text on yellow
const GREEN = '#1BA672'; // Blinkit savings / % OFF green

const selected = ref<MarketProduct | null>(null);
const pdp = ref<MarketProduct | null>(null);
const qty = ref(1);
const selUnit = ref('');
const added = ref(false);

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

// Category rail.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:"Okra","Nunito Sans",Inter,system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1C1C1C]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- BLINKIT "DELIVERY IN MINUTES" BANNER -->
    <div class="mb-3 flex items-center gap-2 rounded-[12px] bg-[#F8CB46] px-4 py-2.5 text-[#1C1C1C]">
      <Clock class="size-5 shrink-0" :stroke-width="2.5" />
      <div class="leading-tight">
        <p class="text-[13px] font-extrabold">Delivery in 10 minutes</p>
        <p class="text-[11px] font-semibold opacity-80">Groceries delivered lightning fast</p>
      </div>
    </div>

    <!-- CATEGORY RAIL (tiles) -->
    <div class="blinkit-rail mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === 'All'
          ? 'border-[#F8CB46] bg-[#FEF6DA] text-[#1C1C1C]'
          : 'border-[#EDEDED] bg-white text-[#3B3B3B] hover:bg-[#FAFAFA]'"
        @click="activeCat = 'All'"
      >
        <span>🛒</span><span>All</span>
      </button>
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === c
          ? 'border-[#F8CB46] bg-[#FEF6DA] text-[#1C1C1C]'
          : 'border-[#EDEDED] bg-white text-[#3B3B3B] hover:bg-[#FAFAFA]'"
        @click="activeCat = c"
      >
        <span>{{ designLabCategoryEmoji(c) }}</span><span>{{ c }}</span>
      </button>
    </div>

    <!-- DENSE CARD GRID -->
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="flex flex-col rounded-[10px] border bg-white p-2 transition"
        :class="cart.qtyOfProduct(p.id) ? 'border-[#1BA672] ring-1 ring-[#1BA672]' : 'border-[#EDEDED]'"
      >
        <div class="relative">
          <!-- green % OFF savings flag -->
          <span
            v-if="designLabDiscount(p)"
            class="blinkit-flag absolute left-0 top-1 z-10 pr-1.5 pl-1.5 text-[10px] font-extrabold leading-[16px] text-white"
          >{{ designLabDiscount(p)!.pct }}% OFF</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[8px] bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" />
            <span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute -bottom-1 right-0">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="GREEN" outline :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 line-clamp-2 min-h-[32px] cursor-pointer text-[12px] font-semibold leading-tight text-[#1C1C1C] hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[11px] text-[#7E808C]">{{ p.unit }}</p>
        <p v-if="designLabIsMultiUnit(p)" class="text-[11px] text-[#7E808C]">{{ designLabUnits(p).length }} options</p>
        <div class="mt-auto pt-1">
          <div class="flex items-baseline gap-1">
            <span class="text-[14px] font-extrabold text-[#1C1C1C]">{{ formatNaira(p.priceNaira) }}</span>
            <span v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#B3B3B3] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-2xl bg-white p-5 text-[#1C1C1C] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFA]">
            <span
              v-if="designLabDiscount(selected)"
              class="blinkit-flag absolute left-0 top-2 z-10 px-2 text-[12px] font-extrabold leading-[20px] text-white"
            >{{ designLabDiscount(selected)!.pct }}% OFF</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <span class="mt-3 inline-flex items-center gap-1 rounded-[6px] bg-[#FEF6DA] px-2 py-0.5 text-[11px] font-bold text-[#1C1C1C]"><Clock class="size-3" :stroke-width="2.5" /> 10 MINS</span>
          <h3 class="mt-2 text-[16px] font-bold leading-tight">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#7E808C]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="GREEN"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-baseline gap-2">
              <span class="text-[20px] font-extrabold text-[#1C1C1C]">{{ formatNaira(selPrice) }}</span>
              <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[13px] text-[#B3B3B3] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-[10px] border-2 border-[#1BA672] px-2 py-1.5 text-[#1BA672]">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <span class="w-5 text-center text-[15px] font-bold">{{ qty }}</span>
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-3 text-[15px] font-extrabold text-white transition" :class="added ? 'bg-[#158a5e]' : 'bg-[#1BA672] hover:bg-[#158a5e]'" @click="addFromModal">
              <Check v-if="added" class="size-4" /> {{ added ? 'Added' : 'Add to cart' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#1BA672] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1C1C1C]">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#F8CB46] px-4 py-3 text-[#1C1C1C]">
          <button class="flex items-center gap-1 text-[14px] font-extrabold" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
          <span v-if="cart.count.value" class="text-[13px] font-extrabold">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#EDEDED] bg-[#FAFAFA]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="blinkit-flag absolute left-0 top-3 z-10 px-3 text-[13px] font-extrabold leading-[24px] text-white"
              >{{ designLabDiscount(pdp)!.pct }}% OFF</span>
            </div>
            <div>
              <span class="inline-flex items-center gap-1 rounded-[6px] bg-[#FEF6DA] px-2 py-0.5 text-[11px] font-bold text-[#1C1C1C]"><Clock class="size-3" :stroke-width="2.5" /> DELIVERY IN 10 MINS</span>
              <p class="mt-2 text-[13px] text-[#7E808C]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[24px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#7E808C]">{{ pdp.unit }}</p>
              <p class="mt-3 flex items-baseline gap-2 leading-none">
                <span class="text-[28px] font-extrabold text-[#1C1C1C]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#B3B3B3] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
                <span v-if="designLabDiscount(pdp)" class="rounded-[6px] bg-[#E7F7F0] px-2 py-0.5 text-[13px] font-extrabold text-[#1BA672]">{{ designLabDiscount(pdp)!.pct }}% OFF</span>
              </p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="GREEN"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-[10px] border-2 border-[#1BA672] px-3 py-2 text-[#1BA672]">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
                  <span class="w-6 text-center font-bold">{{ qty }}</span>
                  <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-[10px] bg-[#1BA672] py-3.5 text-[16px] font-extrabold text-white hover:bg-[#158a5e]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-bold text-[#1BA672]">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#EDEDED] border-y border-[#EDEDED]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Product details</summary><p class="mt-2 text-[14px] text-[#7E808C]">{{ pdp.description || 'Delivered in minutes by Blinkit.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-bold">Why shop from Blinkit?</summary><p class="mt-2 text-[14px] text-[#7E808C]">Superfast delivery, best prices &amp; offers, and a wide assortment.</p></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">You might also like</h2>
            <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[10px] border border-[#EDEDED] bg-white p-2">
                <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded bg-white">
                  <span v-if="designLabDiscount(r)" class="blinkit-flag absolute left-0 top-1 z-10 px-1.5 text-[9px] font-extrabold leading-[14px] text-white">{{ designLabDiscount(r)!.pct }}% OFF</span>
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
                </div>
                <p class="mt-1 line-clamp-1 text-[12px] font-semibold">{{ r.name }}</p>
                <p class="text-[13px] font-extrabold">{{ formatNaira(r.priceNaira) }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.blinkit-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.blinkit-rail::-webkit-scrollbar {
  display: none;
}
/* Blinkit-style green savings flag with a notched tail. */
.blinkit-flag {
  background: #1ba672;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 5px));
}
</style>
