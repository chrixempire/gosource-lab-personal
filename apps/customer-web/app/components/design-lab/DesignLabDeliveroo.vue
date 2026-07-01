<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabCategoryEmoji, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
// Deliveroo brand: turquoise/teal accent + dark navy ink (the "roo" palette).
const ACCENT = '#00CCBC';
const FG = '#ffffff';

const added = ref(false);
const selected = ref<MarketProduct | null>(null);
const pdp = ref<MarketProduct | null>(null);
const qty = ref(1);
const selUnit = ref('');

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
const font = 'font-family:"Helvetica Neue",Inter,Arial,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#2E3333]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" label="Checkout" />

    <!-- CATEGORY RAIL (Deliveroo pill chips: teal-fill when active, quiet pill otherwise) -->
    <div class="roo-rail mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
        :class="activeCat === 'All'
          ? 'bg-[#00CCBC] text-white'
          : 'bg-[#F3F4F5] text-[#2E3333] hover:bg-[#E7EBEB]'"
        @click="activeCat = 'All'"
      >
        <span>🛒</span><span>All</span>
      </button>
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors"
        :class="activeCat === c
          ? 'bg-[#00CCBC] text-white'
          : 'bg-[#F3F4F5] text-[#2E3333] hover:bg-[#E7EBEB]'"
        @click="activeCat = c"
      >
        <span>{{ designLabCategoryEmoji(c) }}</span><span>{{ c }}</span>
      </button>
    </div>

    <!-- CARD GRID (rounded friendly cards, teal ring when in cart) -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="rounded-[16px] border bg-white p-3 shadow-[0_1px_3px_rgba(46,51,51,0.08)] transition"
        :class="cart.qtyOfProduct(p.id) ? 'border-[#00CCBC] ring-1 ring-[#00CCBC]' : 'border-[#EDEFEF]'"
      >
        <div class="relative">
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[12px] bg-[#F8F9F9]" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" />
            <span v-else class="text-4xl">🛒</span>
          </div>
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-1.5 top-1.5 rounded-full bg-[#2E3333] px-2 py-0.5 text-[11px] font-bold text-[#00CCBC]"
          >{{ designLabDiscount(p)!.pct }}% off</span>
          <div class="absolute bottom-1 right-1">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 flex items-baseline gap-1.5 leading-none">
          <span class="text-[16px] font-extrabold text-[#2E3333]">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#8A9494] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </p>
        <p v-if="designLabIsMultiUnit(p)" class="mt-0.5 text-[12px] text-[#8A9494]">{{ designLabUnits(p).length }} unit options</p>
        <p v-else-if="p.unitPriceBadge" class="mt-0.5 text-[12px] text-[#8A9494]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] font-medium leading-tight hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-[#8A9494]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-3xl bg-white p-5 text-[#2E3333] shadow-2xl sm:rounded-3xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#F3F4F5]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#F8F9F9]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
            <span
              v-if="designLabDiscount(selected)"
              class="absolute left-2 top-2 rounded-full bg-[#2E3333] px-2 py-0.5 text-[12px] font-bold text-[#00CCBC]"
            >{{ designLabDiscount(selected)!.pct }}% off</span>
          </div>
          <p class="mt-3 flex items-baseline gap-2 leading-none">
            <span class="text-[20px] font-extrabold text-[#2E3333]">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#8A9494] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </p>
          <h3 class="mt-1 text-[16px] font-bold">{{ selected.name }}</h3>
          <p class="text-[13px] text-[#8A9494]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border border-[#E7EBEB] px-2 py-1.5">
              <button class="text-[#00CCBC]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button class="text-[#00CCBC]" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-[15px] font-bold text-white transition" :class="added ? 'bg-[#00B3A6]' : 'bg-[#00CCBC] hover:bg-[#00B3A6]'" @click="addFromModal">
              <Check v-if="added" class="size-4" /> {{ added ? 'Added to basket' : 'Add to basket' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#00CCBC] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#2E3333]">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#00CCBC] px-4 py-3 text-white">
          <button class="flex items-center gap-1 text-[14px] font-bold" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
          <span v-if="cart.count.value" class="text-[13px] font-bold">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-[#EDEFEF] bg-[#F8F9F9]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="absolute left-3 top-3 rounded-full bg-[#2E3333] px-2.5 py-1 text-[12px] font-bold text-[#00CCBC]"
              >{{ designLabDiscount(pdp)!.pct }}% off</span>
            </div>
            <div>
              <p class="text-[13px] font-semibold text-[#8A9494]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[24px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#8A9494]">{{ pdp.unit }}</p>
              <p class="mt-3 flex items-baseline gap-2 leading-none">
                <span class="text-[28px] font-extrabold text-[#2E3333]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#8A9494] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#E7EBEB] px-3 py-2">
                  <button class="text-[#00CCBC]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button class="text-[#00CCBC]" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#00CCBC] py-3.5 text-[16px] font-bold text-white hover:bg-[#00B3A6]" @click="addFromPdp">Add to basket</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-bold text-[#00CCBC]">✓ {{ cart.qtyOfProduct(pdp.id) }} in basket</p>
              <div class="mt-6 divide-y divide-[#EDEFEF] border-y border-[#EDEFEF]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Details</summary><p class="mt-2 text-[14px] text-[#8A9494]">{{ pdp.description || 'Delivered to your door by Deliveroo.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-bold">Nutrition</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">You might also like</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[16px] border border-[#EDEFEF] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded-[12px] bg-[#F8F9F9]">
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
                </div>
                <p class="mt-1 text-[13px] font-extrabold">{{ formatNaira(r.priceNaira) }}</p>
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
.roo-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.roo-rail::-webkit-scrollbar {
  display: none;
}
</style>
