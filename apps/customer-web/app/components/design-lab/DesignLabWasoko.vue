<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Search, Check, Truck, Wallet } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
// Wasoko (formerly Sokowatch) brand: purple primary, teal accent, yellow highlight.
// Sourced from wasoko.com Elementor global colors — primary #873FB7, accent #00BAC2, yellow #FCE758.
const ACCENT = '#873FB7';
const TEAL = '#00BAC2';
const YELLOW = '#FCE758';
const FG = '#ffffff';

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

// Single-unit row helpers (default = first/cheapest listed unit).
function addRow(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function setRow(p: MarketProduct, n: number) { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, n); }
function qtyRow(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));

// CATEGORY FILTER: businesslike tab rail for retailer bulk buyers.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const font = 'font-family:Poppins,Inter,"Helvetica Neue",system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1A1030]">
    <!-- BRAND HEADER: retailer duka ordering app -->
    <div class="mb-3 overflow-hidden rounded-2xl" :style="{ background: ACCENT }">
      <div class="flex items-center gap-3 px-4 pt-3.5 text-white">
        <span class="text-[18px] font-extrabold tracking-tight">wasoko</span>
        <span class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Duka Stock</span>
        <div class="ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-white/80">
          <Search class="size-4" /><span class="text-[13px]">Search stock</span>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-4 px-4 pb-3 text-[12px] font-semibold text-white/90">
        <span class="flex items-center gap-1.5"><Truck class="size-4" :style="{ color: YELLOW }" /> Free same-day delivery</span>
        <span class="flex items-center gap-1.5"><Wallet class="size-4" :style="{ color: YELLOW }" /> Buy now, pay later</span>
      </div>
    </div>

    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" label="View order" />

    <!-- CATEGORY FILTER: tab rail -->
    <div class="wasoko-rail mb-3 flex gap-2 overflow-x-auto pb-1">
      <button
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === 'All' ? 'text-white' : 'bg-[#F3EEFA] text-[#873FB7] hover:bg-[#EBE1F6]'"
        :style="activeCat === 'All' ? { background: ACCENT } : {}"
        @click="activeCat = 'All'"
      >All</button>
      <button
        v-for="c in categories"
        :key="c"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === c ? 'text-white' : 'bg-[#F3EEFA] text-[#873FB7] hover:bg-[#EBE1F6]'"
        :style="activeCat === c ? { background: ACCENT } : {}"
        @click="activeCat = c"
      >{{ c }}</button>
    </div>

    <!-- PRODUCT LIST: bulk-buyer list rows -->
    <div class="overflow-hidden rounded-2xl border border-[#EAE4F2] bg-white">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="flex items-center gap-3 border-t px-3 py-3 transition first:border-t-0"
        :class="cart.qtyOfProduct(p.id) ? 'border-l-4 border-l-[#873FB7] border-t-[#EAE4F2] bg-[#FAF7FE]' : 'border-l-4 border-l-transparent border-t-[#EAE4F2]'"
      >
        <button class="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F2FA]" @click="openModal(p)">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-0 top-0 rounded-br-lg px-1.5 py-0.5 text-[10px] font-extrabold text-[#1A1030]"
            :style="{ background: YELLOW }"
          >-{{ designLabDiscount(p)!.pct }}%</span>
        </button>
        <div class="min-w-0 flex-1 cursor-pointer" @click="openModal(p)">
          <p class="truncate text-[14px] font-semibold leading-tight">{{ p.name }}</p>
          <p class="mt-0.5 text-[12px] text-[#7A7391]">
            <template v-if="designLabIsMultiUnit(p)">{{ designLabUnits(p).length }} pack sizes · from {{ formatNaira(designLabUnits(p).at(-1)?.priceNaira ?? p.priceNaira) }}</template>
            <template v-else>{{ p.unit }}</template>
          </p>
          <div class="mt-1 flex items-center gap-1.5">
            <span class="text-[15px] font-bold" :style="{ color: ACCENT }">{{ formatNaira(p.priceNaira) }}</span>
            <span v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#7A7391] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
            <span
              v-if="designLabDiscount(p)"
              class="rounded px-1.5 py-0.5 text-[10px] font-bold"
              :style="{ background: 'rgba(0,186,194,0.12)', color: TEAL }"
            >Bulk deal</span>
          </div>
        </div>
        <!-- MULTI-UNIT: open picker · SINGLE-UNIT: inline stepper -->
        <div class="shrink-0">
          <template v-if="designLabIsMultiUnit(p)">
            <button
              class="flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-bold text-white"
              :style="{ background: ACCENT }"
              @click="openModal(p)"
            >
              <Plus class="size-4" :stroke-width="2.5" /> Sizes
              <span v-if="cart.qtyOfProduct(p.id)" class="ml-0.5 rounded-full bg-white/25 px-1.5 text-[12px] font-bold">{{ cart.qtyOfProduct(p.id) }}</span>
            </button>
          </template>
          <template v-else>
            <div v-if="qtyRow(p)" class="flex items-center gap-2 rounded-full px-1.5 py-1 text-white" :style="{ background: ACCENT }">
              <button class="flex size-7 items-center justify-center" aria-label="Remove" @click="addRow(p, -1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="0" :value="qtyRow(p)" class="w-8 bg-transparent text-center text-[14px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="setRow(p, Math.max(0, Math.round(+($event.target as HTMLInputElement).value || 0)))" />
              <button class="flex size-7 items-center justify-center" aria-label="Add" @click="addRow(p)"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button
              v-else
              class="flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-bold text-white"
              :style="{ background: ACCENT }"
              @click="addRow(p)"
            ><Plus class="size-4" :stroke-width="2.5" /> Add</button>
          </template>
        </div>
      </div>
    </div>

    <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold text-white" :style="{ background: ACCENT }">
      <span v-if="cart.count.value">Place order · {{ cart.count.value }} items · {{ formatNaira(cart.total.value) }}</span>
      <span v-else>Place order</span>
    </button>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-2xl bg-white p-5 text-[#1A1030] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F5F2FA]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
            <span
              v-if="designLabDiscount(selected)"
              class="absolute left-2 top-2 rounded-md px-2 py-1 text-[12px] font-extrabold text-[#1A1030]"
              :style="{ background: YELLOW }"
            >{{ designLabDiscount(selected)!.pct }}% BULK OFF</span>
          </div>
          <p class="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#7A7391]">{{ selected.brandLabel || selected.categoryName }}</p>
          <h3 class="text-[16px] font-semibold leading-tight">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#7A7391]">{{ selected.unit }}</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[20px] font-bold" :style="{ color: ACCENT }">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#7A7391] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full px-2 py-1.5 text-white" :style="{ background: ACCENT }">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <span class="w-6 text-center text-[15px] font-bold">{{ qty }}</span>
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-[15px] font-bold text-white" :style="{ background: added ? '#6E2F9C' : ACCENT }" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to order' : 'Add to order' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold hover:underline" :style="{ color: ACCENT }" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1A1030]">
        <header class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 text-white" :style="{ background: ACCENT }">
          <button class="flex items-center gap-1 text-[14px] font-bold" @click="pdp = null"><ChevronLeft class="size-5" /> Back to stock</button>
          <span v-if="cart.count.value" class="text-[13px] font-semibold">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F5F2FA]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="absolute left-3 top-3 rounded-md px-2 py-1 text-[13px] font-extrabold text-[#1A1030]"
                :style="{ background: YELLOW }"
              >{{ designLabDiscount(pdp)!.pct }}% BULK OFF</span>
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wide text-[#7A7391]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[24px] font-bold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#7A7391]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-[26px] font-bold" :style="{ color: ACCENT }">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#7A7391] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
                <span
                  v-if="designLabDiscount(pdp)"
                  class="rounded px-2 py-0.5 text-[12px] font-bold"
                  :style="{ background: 'rgba(0,186,194,0.12)', color: TEAL }"
                >Bulk deal</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full px-3 py-2 text-white" :style="{ background: ACCENT }">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <span class="w-6 text-center font-bold">{{ qty }}</span>
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full py-3.5 text-[16px] font-bold text-white" :style="{ background: ACCENT }" @click="addFromPdp">Add to order</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in order</p>
              <div class="mt-6 flex items-center gap-4 rounded-xl bg-[#F5F2FA] px-4 py-3 text-[12px] font-semibold text-[#4A3F63]">
                <span class="flex items-center gap-1.5"><Truck class="size-4" :style="{ color: ACCENT }" /> Same-day delivery</span>
                <span class="flex items-center gap-1.5"><Wallet class="size-4" :style="{ color: ACCENT }" /> Pay later available</span>
              </div>
              <div class="mt-6 divide-y divide-[#EAE4F2] border-y border-[#EAE4F2]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Description</summary><p class="mt-2 text-[14px] text-[#7A7391]">{{ pdp.description || 'Wholesale stock delivered to your shop by Wasoko.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-bold">Order history</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-bold">Frequently restocked together</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-xl border border-[#EAE4F2] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-[#F5F2FA]"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-bold" :style="{ color: ACCENT }">{{ formatNaira(r.priceNaira) }}</p>
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
.wasoko-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.wasoko-rail::-webkit-scrollbar {
  display: none;
}
</style>
