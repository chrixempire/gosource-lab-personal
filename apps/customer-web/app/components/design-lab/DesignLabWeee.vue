<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabDiscount, designLabCategories } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#027FFF';
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

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:Poppins,"SF Pro Text",Roboto,sans-serif';

// Deal-forward category rail (Weee! filters the grid by category chip).
const activeCat = ref('All');
const categories = computed(() => ['All', ...designLabCategories(props.products)]);
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);
</script>

<template>
  <div :style="font" class="text-[#111111]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- Category rail (Weee! deal-blue chips) -->
    <div class="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in categories" :key="c" type="button"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors"
        :class="activeCat === c ? 'bg-[#027FFF] text-white' : 'bg-[#E6F2FF] text-[#027FFF] hover:bg-[#d4e8ff]'"
        @click="activeCat = c"
      >{{ c }}</button>
    </div>

    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[10px] border bg-white p-2" :class="cart.qtyOfProduct(p.id) ? 'ring-1 ring-[#027FFF] border-[#027FFF]' : 'border-[#EAEAEA]'">
        <div class="relative">
          <span v-if="designLabDiscount(p)" class="absolute left-0 top-0 z-10 rounded-md bg-[#E1251B] px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">🔥 {{ designLabDiscount(p)!.pct }}% OFF</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-0 right-0">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :outline="true" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <div class="mt-1.5 flex items-baseline gap-1">
          <span class="text-[18px] font-extrabold text-[#E1251B]">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#9299AE] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </div>
        <p v-if="p.unitPriceBadge" class="text-[10px] text-[#52667D]">{{ p.unitPriceBadge }}</p>
        <p class="mt-0.5 line-clamp-2 cursor-pointer text-[13px] leading-tight" @click="openModal(p)">{{ p.name }}</p>
        <p class="text-[11px] text-[#52667D]">{{ p.unit }}</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-2xl bg-white p-5 text-[#111] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F3F3F3]">
            <span v-if="designLabDiscount(selected)" class="absolute left-0 top-0 z-10 rounded-md bg-[#E1251B] px-2 py-0.5 text-[12px] font-bold text-white shadow-sm">🔥 {{ designLabDiscount(selected)!.pct }}% OFF</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-[24px] font-extrabold text-[#E1251B]">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[13px] text-[#9299AE] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <h3 class="mt-1 text-[15px] font-medium">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#52667D]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border border-[#027FFF] px-2 py-1.5 text-[#027FFF]">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#027FFF] py-3 text-[15px] font-bold text-white hover:bg-[#0066d6]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#027FFF] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#111]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#EAEAEA] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#027FFF]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F3F3F3]"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <h1 class="text-[24px] font-semibold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#52667D]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-[32px] font-extrabold text-[#E1251B]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[15px] text-[#9299AE] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
                <span v-if="designLabDiscount(pdp)" class="rounded-md bg-[#E1251B] px-2 py-0.5 text-[12px] font-bold text-white">🔥 {{ designLabDiscount(pdp)!.pct }}% OFF</span>
              </div>
              <p v-if="pdp.unitPriceBadge" class="text-[12px] text-[#52667D]">{{ pdp.unitPriceBadge }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#027FFF] px-3 py-2 text-[#027FFF]">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#027FFF] py-3.5 text-[16px] font-bold text-white hover:bg-[#0066d6]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#EAEAEA] border-y border-[#EAEAEA]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-semibold">Description</summary><p class="mt-2 text-[14px] text-[#52667D]">{{ pdp.description || 'Great-value grocery from Weee!.' }}</p></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-semibold">Customers also bought</h2>
            <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[10px] border border-[#EAEAEA] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-bold text-[#E1251B]">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
