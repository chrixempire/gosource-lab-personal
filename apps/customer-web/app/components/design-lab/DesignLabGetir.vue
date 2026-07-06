<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#5D3EBC'; const FG = '#ffffff';
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
const font = 'font-family:Poppins,Nunito,"Helvetica Neue",sans-serif';
</script>

<template>
  <div :style="font" class="text-[#191919]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />
    <!-- CATEGORY RAIL -->
    <div class="getir-rail mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === 'All' ? 'bg-[#5D3EBC] text-white' : 'bg-[#EEEAF8] text-[#5D3EBC] hover:bg-[#e3ddf5]'"
        @click="activeCat = 'All'"
      >
        All
      </button>
      <button
        v-for="c in categories"
        :key="c"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === c ? 'bg-[#5D3EBC] text-white' : 'bg-[#EEEAF8] text-[#5D3EBC] hover:bg-[#e3ddf5]'"
        @click="activeCat = c"
      >
        {{ c }}
      </button>
    </div>
    <!-- GRID -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[12px] border bg-white p-2.5" :class="cart.qtyOfProduct(p.id) ? 'ring-1 ring-[#5D3EBC] border-[#5D3EBC]' : 'border-[#E2E2E2]'">
        <div class="relative">
          <span v-if="designLabDiscount(p)" class="absolute left-0 top-0 z-10 rounded-md bg-[#FFD300] px-2 py-1 text-[12px] font-bold text-[#5D3EBC]">{{ designLabDiscount(p)!.pct }}% OFF</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-0 right-0">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 line-clamp-2 cursor-pointer text-[13px] font-medium leading-tight" @click="openModal(p)">{{ p.name }}</p>
        <div class="mt-0.5 flex items-baseline gap-1.5">
          <span class="text-[14px] font-bold text-[#5D3EBC]">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#697488] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </div>
        <p class="mt-0.5 text-[11px] text-[#697488]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-2xl bg-white p-5 text-[#191919] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F3F0FE]"><span v-if="designLabDiscount(selected)" class="absolute left-2 top-2 z-10 rounded-md bg-[#FFD300] px-2 py-1 text-[13px] font-bold text-[#5D3EBC]">{{ designLabDiscount(selected)!.pct }}% OFF</span><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span></div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-[20px] font-bold text-[#5D3EBC]">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#697488] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <h3 class="mt-2 text-[16px] font-semibold">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#697488]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full bg-[#5D3EBC] px-2 py-1.5 text-white">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <span class="w-5 text-center text-[15px] font-bold">{{ qty }}</span>
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#5D3EBC] py-3 text-[15px] font-bold text-white hover:bg-[#4c2fa0]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to basket' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#5D3EBC] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- PDP -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#191919]">
        <header class="sticky top-0 z-10 flex items-center bg-[#5D3EBC] px-4 py-3 text-white">
          <button class="flex items-center gap-1 text-[14px] font-bold" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F3F0FE]"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <h1 class="text-[24px] font-bold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#697488]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <span v-if="designLabDiscount(pdp)" class="rounded-md bg-[#FFD300] px-2 py-1 text-[14px] font-bold text-[#5D3EBC]">{{ designLabDiscount(pdp)!.pct }}% OFF</span>
                <span class="text-[26px] font-bold text-[#5D3EBC]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#697488] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full bg-[#5D3EBC] px-3 py-2 text-white">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <span class="w-6 text-center font-bold">{{ qty }}</span>
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#5D3EBC] py-3.5 text-[16px] font-bold text-white hover:bg-[#4c2fa0]" @click="addFromPdp">Add to basket</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{color: ACCENT}">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#E2E2E2] border-y border-[#E2E2E2]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Description</summary><p class="mt-2 text-[14px] text-[#697488]">{{ pdp.description || 'Delivered in minutes by Getir.' }}</p></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-bold">Similar products</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[12px] border border-[#E2E2E2] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <span class="mt-1 inline-block rounded bg-[#FFD300] px-1.5 py-0.5 text-[12px] font-bold text-[#5D3EBC]">{{ formatNaira(r.priceNaira) }}</span>
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
.getir-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.getir-rail::-webkit-scrollbar {
  display: none;
}
</style>
