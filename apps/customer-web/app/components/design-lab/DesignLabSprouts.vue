<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Heart } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabCategoryEmoji, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#007932';
const FG = '#ffffff';
const selected = ref<MarketProduct | null>(null);
const pdp = ref<MarketProduct | null>(null);
const qty = ref(1);
const selUnit = ref('');
const added = ref(false);

// Category rail (Sprouts farmers-market filter chips).
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
const font = 'font-family:Inter,"Helvetica Neue",Arial,sans-serif';
</script>

<template>
  <div :style="font" class="rounded-xl bg-[#FFF4E0] p-4 text-[#1f2a1f]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- Sprouts category rail: farmers-market chips, green on cream -->
    <div class="-mx-4 mb-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div class="flex w-max gap-2">
        <button
          type="button"
          class="shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition"
          :class="activeCat === 'All'
            ? 'border-[#007932] bg-[#007932] text-white'
            : 'border-[#007932]/35 bg-[#FFF9EF] text-[#007932] hover:border-[#007932] hover:bg-[#FDF0D8]'"
          @click="activeCat = 'All'"
        >
          🧺 All
        </button>
        <button
          v-for="c in categories"
          :key="c"
          type="button"
          class="shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition"
          :class="activeCat === c
            ? 'border-[#007932] bg-[#007932] text-white'
            : 'border-[#007932]/35 bg-[#FFF9EF] text-[#007932] hover:border-[#007932] hover:bg-[#FDF0D8]'"
          @click="activeCat = c"
        >
          {{ designLabCategoryEmoji(c) }} {{ c }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[8px] border bg-white p-3 transition" :class="cart.qtyOfProduct(p.id) ? 'border-[#007932] ring-1 ring-[#007932]' : 'border-[#E8E9EB]'">
        <div class="relative">
          <!-- Discount price tag, top-left (farmers-market style) -->
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-1 top-1 z-10 rounded-[4px] bg-[#007932] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#FFF4E0] shadow-sm"
          >
            {{ designLabDiscount(p)!.pct }}% off
          </span>
          <button class="absolute right-1 top-1 z-10 text-[#007932]"><Heart class="size-4" /></button>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-0 right-0">
            <DesignLabAddControl :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)" :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)" @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-1.5">
          <p class="text-[16px] font-bold leading-none" :class="designLabDiscount(p) ? 'text-[#007932]' : ''">{{ formatNaira(p.priceNaira) }}</p>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#9aa39a] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </div>
        <p v-if="p.unitPriceBadge" class="mt-0.5 text-[12px] text-[#6b736b]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] leading-tight hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-[#6b736b]">{{ p.unit }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-2xl bg-white p-5 text-[#1f2a1f] shadow-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#FFF4E0]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#FAFAF7] p-3">
            <span v-if="designLabDiscount(selected)" class="absolute left-2 top-2 rounded-[4px] bg-[#007932] px-2 py-1 text-[12px] font-bold leading-none text-[#FFF4E0]">{{ designLabDiscount(selected)!.pct }}% off</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <p class="text-[20px] font-bold leading-none" :class="designLabDiscount(selected) ? 'text-[#007932]' : ''">{{ formatNaira(selPrice) }}</p>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#9aa39a] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <p v-if="selected.unitPriceBadge" class="mt-0.5 text-[12px] text-[#6b736b]">{{ selected.unitPriceBadge }}</p>
          <h3 class="mt-1 text-[16px] leading-snug">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#6b736b]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border border-[#E8E9EB] px-2 py-1.5 text-[#007932]">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold text-[#1f2a1f] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#007932] py-3 text-[15px] font-semibold text-white hover:bg-[#01451d]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-semibold text-[#007932] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1f2a1f]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#E8E9EB] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-semibold text-[#007932]" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#E8E9EB] bg-[#FAFAF7] p-8"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <h1 class="text-[26px] font-semibold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#6b736b]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <p class="text-[28px] font-bold leading-none" :class="designLabDiscount(pdp) ? 'text-[#007932]' : ''">{{ formatNaira(selPrice) }}</p>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#9aa39a] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
                <span v-if="designLabDiscount(pdp)" class="rounded-[4px] bg-[#007932] px-2 py-1 text-[12px] font-bold leading-none text-[#FFF4E0]">{{ designLabDiscount(pdp)!.pct }}% off</span>
              </div>
              <p v-if="pdp.unitPriceBadge" class="mt-0.5 text-[13px] text-[#6b736b]">{{ pdp.unitPriceBadge }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#E8E9EB] px-3 py-2 text-[#007932]">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold text-[#1f2a1f] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#007932] py-3.5 text-[16px] font-semibold text-white hover:bg-[#01451d]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-7 divide-y divide-[#E8E9EB] border-y border-[#E8E9EB]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-semibold">Ingredients</summary><p class="mt-2 text-[14px] text-[#6b736b]">{{ pdp.description || 'Fresh from the farmers market to your table.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Nutrition</summary></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Directions</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[20px] font-semibold">Picked for you</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[8px] border border-[#E8E9EB] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
