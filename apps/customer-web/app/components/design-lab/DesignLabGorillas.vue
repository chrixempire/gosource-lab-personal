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
const ACCENT = '#D9F154'; const FG = '#0C0C0E';
const added = ref(false);
const selected = ref<MarketProduct | null>(null);
const pdp = ref<MarketProduct | null>(null);
const qty = ref(1);
const selUnit = ref('');

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
const font = 'font-family:Inter,system-ui,sans-serif';

// Category rail.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);
</script>

<template>
  <!-- Dark near-black surface + neon lime accents -->
  <div :style="font" class="rounded-xl bg-[#0C0C0E] p-4 text-white">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- CATEGORY RAIL: scrollable chips, dark inactive / neon lime active -->
    <div class="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="cat in ['All', ...categories]"
        :key="cat"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
        :class="activeCat === cat ? 'bg-[#D9F154] text-[#0C0C0E]' : 'bg-white/10 text-white hover:bg-white/20'"
        @click="activeCat = cat"
      >
        <span v-if="cat !== 'All'" class="mr-1">{{ designLabCategoryEmoji(cat) }}</span>{{ cat }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[12px] bg-[#18181B] p-3" :class="cart.qtyOfProduct(p.id) ? 'ring-2 ring-[#D9F154]' : ''">
        <div class="relative">
          <span v-if="designLabDiscount(p)" class="absolute left-0 top-0 z-10 rounded-md bg-[#D9F154] px-2 py-1 text-[11px] font-extrabold uppercase tracking-tight text-[#0C0C0E] shadow-sm">{{ designLabDiscount(p)!.pct }}% OFF</span>
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
        <div class="mt-2 flex items-baseline gap-1.5">
          <p class="text-[16px] font-extrabold leading-none" :class="designLabDiscount(p) ? 'text-[#D9F154]' : ''">{{ formatNaira(p.priceNaira) }}</p>
          <p v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] font-medium leading-none text-white/40 line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</p>
        </div>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] font-medium leading-tight text-white/90" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-white/50">{{ p.unit }}</p>
      </div>
    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-2xl bg-[#18181B] p-5 text-white shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-white">
            <span v-if="designLabDiscount(selected)" class="absolute left-2 top-2 z-10 rounded-md bg-[#D9F154] px-2 py-1 text-[11px] font-extrabold uppercase tracking-tight text-[#0C0C0E] shadow-sm">{{ designLabDiscount(selected)!.pct }}% OFF</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <p class="text-[22px] font-extrabold leading-none" :class="designLabDiscount(selected) ? 'text-[#D9F154]' : ''">{{ formatNaira(selPrice) }}</p>
            <p v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] font-medium leading-none text-white/40 line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</p>
          </div>
          <h3 class="mt-1 text-[16px] font-semibold">{{ selected.name }}</h3>
          <p class="text-[12px] text-white/50">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full bg-white/10 px-2 py-1.5">
              <button class="text-[#D9F154]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <span class="w-5 text-center text-[15px] font-bold">{{ qty }}</span>
              <button class="text-[#D9F154]" @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#D9F154] py-3 text-[15px] font-bold text-[#0C0C0E] hover:bg-[#c8e23f]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#D9F154] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- PDP -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-[#0C0C0E] text-white">
        <header class="sticky top-0 z-10 flex items-center border-b border-white/10 bg-[#0C0C0E] px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#D9F154]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white">
              <span v-if="designLabDiscount(pdp)" class="absolute left-3 top-3 z-10 rounded-md bg-[#D9F154] px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-tight text-[#0C0C0E] shadow-sm">{{ designLabDiscount(pdp)!.pct }}% OFF</span>
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
            </div>
            <div>
              <h1 class="text-[24px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-white/50">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2.5">
                <p class="text-[30px] font-extrabold leading-none" :class="designLabDiscount(pdp) ? 'text-[#D9F154]' : ''">{{ formatNaira(selPrice) }}</p>
                <p v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] font-medium leading-none text-white/40 line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</p>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full bg-white/10 px-3 py-2">
                  <button class="text-[#D9F154]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <span class="w-6 text-center font-bold">{{ qty }}</span>
                  <button class="text-[#D9F154]" @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#D9F154] py-3.5 text-[16px] font-bold text-[#0C0C0E] hover:bg-[#c8e23f]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{color: ACCENT}">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-white/10 border-y border-white/10">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Details</summary><p class="mt-2 text-[14px] text-white/60">{{ pdp.description || 'Delivered fast by Gorillas.' }}</p></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">More like this</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[12px] bg-[#18181B] p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-extrabold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px] text-white/80">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
