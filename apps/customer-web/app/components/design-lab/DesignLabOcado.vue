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
const ACCENT = '#4A2D6E';
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

// Single-unit card helpers (default = first unit).
function addCard(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function setCard(p: MarketProduct, n: number) { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, n); }
function qtyCard(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));

// Ocado category rail — filter the main grid by category.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All'
    ? props.products
    : props.products.filter((p) => p.categoryName === activeCat.value),
);

const font = 'font-family:Inter,Arial,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1A1A1A]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- Ocado category rail -->
    <div class="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in ['All', ...categories]"
        :key="c"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition"
        :class="activeCat === c ? 'bg-[#4A2D6E] text-white' : 'bg-[#F1ECF6] text-[#4A2D6E] hover:bg-[#E6DCF0]'"
        @click="activeCat = c"
      >{{ c }}</button>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[12px] border bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition" :class="cart.qtyOfProduct(p.id) ? 'border-[#4A2D6E] ring-1 ring-[#4A2D6E]' : 'border-[#E5E5E5]'">
        <div class="relative">
          <span v-if="designLabDiscount(p)" class="absolute left-0 top-0 z-10 rounded-md bg-[#FF6B00] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">Save {{ designLabDiscount(p)!.pct }}%</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-0 right-0">
            <DesignLabAddControl :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)" :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)" @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="text-[19px] font-bold leading-none" :class="designLabDiscount(p) ? 'text-[#C2410C]' : ''">{{ formatNaira(p.priceNaira) }}</p>
          <p v-if="designLabDiscount(p)?.compareNaira" class="text-[13px] text-[#9A9A9A] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</p>
        </div>
        <p v-if="p.unitPriceBadge" class="mt-0.5 text-[12px] text-[#6B6B6B]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] leading-tight hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-[#6B6B6B]">{{ p.unit }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-2xl bg-white p-5 text-[#1A1A1A] shadow-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFA] p-3">
            <span v-if="designLabDiscount(selected)" class="absolute left-2 top-2 z-10 rounded-md bg-[#FF6B00] px-2 py-0.5 text-[12px] font-bold text-white shadow-sm">Save {{ designLabDiscount(selected)!.pct }}%</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <p class="text-[22px] font-bold leading-none" :class="designLabDiscount(selected) ? 'text-[#C2410C]' : ''">{{ formatNaira(selPrice) }}</p>
            <p v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#9A9A9A] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</p>
          </div>
          <p v-if="selected.unitPriceBadge" class="mt-0.5 text-[12px] text-[#6B6B6B]">{{ selected.unitPriceBadge }}</p>
          <h3 class="mt-1 text-[16px] leading-snug">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#6B6B6B]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border border-[#E5E5E5] px-2 py-1.5 text-[#4A2D6E]">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold text-[#1A1A1A] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#4A2D6E] py-3 text-[15px] font-semibold text-white hover:bg-[#33204D]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added' : 'Add' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-semibold text-[#4A2D6E] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1A1A1A]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#E5E5E5] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-semibold text-[#4A2D6E]" @click="pdp = null"><ChevronLeft class="size-5" /> Back to shop</button>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] p-8">
              <span v-if="designLabDiscount(pdp)" class="absolute left-3 top-3 z-10 rounded-md bg-[#FF6B00] px-2.5 py-1 text-[13px] font-bold text-white shadow-sm">Save {{ designLabDiscount(pdp)!.pct }}%</span>
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span>
            </div>
            <div>
              <h1 class="text-[26px] font-semibold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#6B6B6B]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2.5">
                <p class="text-[30px] font-bold leading-none" :class="designLabDiscount(pdp) ? 'text-[#C2410C]' : ''">{{ formatNaira(selPrice) }}</p>
                <p v-if="designLabDiscount(pdp)?.compareNaira" class="text-[17px] text-[#9A9A9A] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</p>
              </div>
              <p v-if="pdp.unitPriceBadge" class="mt-0.5 text-[13px] text-[#6B6B6B]">{{ pdp.unitPriceBadge }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#E5E5E5] px-3 py-2 text-[#4A2D6E]">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold text-[#1A1A1A] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#4A2D6E] py-3.5 text-[16px] font-semibold text-white hover:bg-[#33204D]" @click="addFromPdp">Add to trolley</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in trolley</p>
              <div class="mt-7 divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-semibold">Description</summary><p class="mt-2 text-[14px] text-[#6B6B6B]">{{ pdp.description || 'Quality grocery, delivered on time.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Nutrition (per 100g)</summary></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Storage</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[20px] font-semibold">Related items</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[12px] border border-[#E5E5E5] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[14px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
