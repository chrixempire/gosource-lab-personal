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
const ACCENT = '#5B278E';
const FG = '#ffffff';
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

// Quiet category navigation (Oda keeps this understated, text-led).
const activeCat = ref('All');
const categories = computed(() => ['All', ...designLabCategories(props.products)]);
const visibleProducts = computed(() =>
  activeCat.value === 'All'
    ? props.products
    : props.products.filter((p) => p.categoryName === activeCat.value),
);

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const body = 'font-family:Inter,system-ui,sans-serif';
const serif = 'font-family:Georgia,"Times New Roman",serif';
</script>

<template>
  <div :style="body" class="text-[#190F24]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- Quiet, text-led category rail — Oda restraint: no loud fills, thin underline marks the active tab. -->
    <nav class="mb-6 -mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in categories"
        :key="c"
        class="shrink-0 whitespace-nowrap border-b-[1.5px] px-3 py-2 text-[14px] font-light tracking-tight transition-colors"
        :class="activeCat === c
          ? 'border-[#5B278E] text-[#5B278E]'
          : 'border-transparent text-[#484541] hover:text-[#190F24]'"
        @click="activeCat = c"
      >{{ c }}</button>
    </nav>

    <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-lg bg-transparent" :class="cart.qtyOfProduct(p.id) ? 'ring-2 ring-[#5B278E]' : ''">
        <div class="relative">
          <span v-if="designLabDiscount(p)" class="absolute left-2 top-2 z-10 rounded-full bg-[#5B278E] px-2 py-0.5 text-[11px] font-medium text-white">-{{ designLabDiscount(p)!.pct }}%</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#FBF8F3] p-3" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-2 right-2">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :outline="false" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <div class="mt-2.5 flex items-baseline gap-2">
          <p class="text-[16px] font-bold leading-none">{{ formatNaira(p.priceNaira) }}</p>
          <p v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#9A9690] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</p>
        </div>
        <p v-if="p.unitPriceBadge" class="mt-1 text-[12px] text-[#484541]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[15px] leading-tight" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[13px] text-[#484541]">{{ p.unit }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" @click.self="selected = null">
        <div :style="body" class="relative w-full max-w-[440px] rounded-2xl bg-white p-6 text-[#190F24] shadow-2xl">
          <button class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full hover:bg-[#F7F3FC]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#FBF8F3] p-4"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span></div>
          <h3 :style="serif" class="mt-4 text-[20px] leading-tight text-[#280F3C]">{{ selected.name }}</h3>
          <p class="text-[13px] text-[#484541]">{{ selected.unit }}</p>
          <div class="mt-2 flex items-baseline gap-2.5">
            <p class="text-[20px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
            <template v-if="designLabDiscount(selected)">
              <p class="text-[14px] text-[#9A9690] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</p>
              <span class="rounded-full bg-[#5B278E] px-2 py-0.5 text-[11px] font-medium text-white">-{{ designLabDiscount(selected)!.pct }}%</span>
            </template>
          </div>
          <p v-if="selected.unitPriceBadge" class="mt-1 text-[12px] text-[#484541]">{{ selected.unitPriceBadge }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-5 flex items-center gap-3">
            <div class="flex items-center gap-4 rounded-full border border-[#C3BDB6] px-3 py-2 text-[#5B278E]">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-semibold text-[#17001E] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#5B278E] py-3 text-[15px] font-semibold text-white hover:bg-[#461E6E]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-semibold text-[#5B278E] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="body" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#190F24]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#EFE6F9] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-semibold text-[#5B278E]" @click="pdp = null"><ChevronLeft class="size-5" /> Back to shop</button>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#FBF8F3] p-8"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <h1 :style="serif" class="text-[30px] leading-tight text-[#280F3C]">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#484541]">{{ pdp.unit }}</p>
              <div class="mt-4 flex items-baseline gap-3">
                <p class="text-[26px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
                <template v-if="designLabDiscount(pdp)">
                  <p class="text-[15px] text-[#9A9690] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</p>
                  <span class="rounded-full bg-[#5B278E] px-2 py-0.5 text-[11px] font-medium text-white">-{{ designLabDiscount(pdp)!.pct }}%</span>
                </template>
              </div>
              <p v-if="pdp.unitPriceBadge" class="mt-1 text-[13px] text-[#484541]">{{ pdp.unitPriceBadge }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-4 rounded-full border border-[#C3BDB6] px-4 py-2.5 text-[#5B278E]">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-semibold text-[#17001E] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#5B278E] py-3.5 text-[16px] font-semibold text-white hover:bg-[#461E6E]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-7 divide-y divide-[#EFE6F9] border-y border-[#EFE6F9]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-semibold">About this product</summary><p class="mt-2 text-[14px] text-[#484541]">{{ pdp.description || 'Carefully sourced, delivered fresh by Oda.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Nutrition</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 :style="serif" class="text-[22px] text-[#280F3C]">Goes well with</h2>
            <div class="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[#FBF8F3] p-2"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[14px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[13px]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
