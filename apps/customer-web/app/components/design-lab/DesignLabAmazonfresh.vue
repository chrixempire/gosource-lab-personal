<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Star, Leaf, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#FFD814';
const FG = '#0F1111';
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
const font = 'font-family:"Amazon Ember",Arial,Helvetica,sans-serif';
const stars = [1, 2, 3, 4, 5];

// Category rail (Amazon Fresh green): "All" + distinct categories, filters grid.
const GREEN = '#067D62';
const activeCat = ref('All');
const categories = computed(() => ['All', ...designLabCategories(props.products)]);
const visibleProducts = computed(() =>
  activeCat.value === 'All'
    ? props.products
    : props.products.filter((p) => p.categoryName === activeCat.value),
);
</script>

<template>
  <div :style="font" class="text-[#0F1111]">
    <div class="mb-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#067D62]"><Leaf class="size-4" /> Amazon Fresh · Delivery by 9 PM</div>
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <div class="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="c in categories"
        :key="c"
        class="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
        :style="activeCat === c ? `background:${GREEN};color:#fff` : ''"
        :class="activeCat === c ? '' : 'bg-[#F0F2F2] text-[#0F1111] hover:bg-[#E3E6E6]'"
        @click="activeCat = c"
      >{{ c }}</button>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[8px] border bg-white p-3" :class="cart.qtyOfProduct(p.id) ? 'ring-1 ring-[#FFD814] border-[#FFD814]' : 'border-[#D5D9D9]'">
        <span v-if="designLabDiscount(p)" class="inline-block rounded-sm bg-[#CC0C39] px-1.5 py-0.5 text-[11px] font-bold text-white">-{{ designLabDiscount(p)!.pct }}%</span>
        <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden bg-white" @click="openModal(p)">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
        </div>
        <div class="flex items-baseline gap-1">
          <span class="text-[11px]" :class="designLabDiscount(p) ? 'text-[#CC0C39]' : ''">₦</span><span class="text-[20px] font-medium leading-none" :class="designLabDiscount(p) ? 'text-[#CC0C39]' : ''">{{ p.priceNaira.toLocaleString() }}</span>
        </div>
        <p v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#565959]">Was <span class="line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span></p>
        <p v-if="p.unitPriceBadge" class="text-[12px] text-[#565959]">({{ p.unitPriceBadge }})</p>
        <a class="mt-1 line-clamp-2 block cursor-pointer text-[14px] leading-tight text-[#007185] hover:text-[#C7511F]" @click="openModal(p)">{{ p.name }}</a>
        <div class="mt-0.5 flex items-center gap-1"><div class="flex text-[#DE7921]"><Star v-for="s in stars" :key="s" class="size-3.5" fill="#DE7921" stroke="#DE7921" /></div></div>
        <div class="mt-2">
          <DesignLabAddControl
            :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
            :accent="ACCENT" :fg="FG" variant="pill" :multi-unit="designLabIsMultiUnit(p)"
            @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
          />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
        <div :style="font" class="relative grid w-full max-w-[640px] grid-cols-1 gap-4 rounded-lg bg-white p-5 text-[#0F1111] shadow-2xl sm:grid-cols-[200px_1fr]">
          <button class="absolute right-3 top-3 text-[#565959] hover:text-[#0F1111]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-square items-center justify-center overflow-hidden bg-white"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span></div>
          <div>
            <a class="block text-[17px] leading-snug text-[#007185]">{{ selected.name }}</a>
            <div class="mt-1 flex text-[#DE7921]"><Star v-for="s in stars" :key="s" class="size-4" fill="#DE7921" stroke="#DE7921" /></div>
            <span v-if="designLabDiscount(selected)" class="mt-2 inline-block rounded-sm bg-[#CC0C39] px-1.5 py-0.5 text-[11px] font-bold text-white">Save {{ designLabDiscount(selected)!.pct }}%</span>
            <div class="mt-2 flex items-baseline gap-0.5"><span class="text-[12px]" :class="designLabDiscount(selected) ? 'text-[#CC0C39]' : ''">₦</span><span class="text-[26px] leading-none" :class="designLabDiscount(selected) ? 'text-[#CC0C39]' : ''">{{ selPrice.toLocaleString() }}</span></div>
            <p v-if="designLabDiscount(selected)?.compareNaira" class="text-[12px] text-[#565959]">Was <span class="line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span></p>
            <p class="text-[12px] text-[#565959]">{{ selected.unit }}</p>
            <DesignLabUnitPicker
              v-if="units.length > 1"
              class="mt-3"
              :units="units" :selected="selUnit" :accent="ACCENT"
              :in-cart="(u) => cart.qtyOf(selected!.id, u)"
              @select="selUnit = $event"
            />
            <div class="mt-3 flex items-center gap-3">
              <select class="rounded-lg border border-[#D5D9D9] bg-[#F0F2F2] px-2 py-1.5 text-[13px]"><option>Qty: 1</option></select>
              <button class="flex flex-1 items-center justify-center gap-1.5 rounded-[18px] border border-[#FCD200] bg-[#FFD814] py-2 text-[14px] font-medium hover:bg-[#F7CA00]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
            </div>
            <button class="mt-3 text-[14px] text-[#007185] hover:underline" @click="viewFull">View full page →</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#0F1111]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#D5D9D9] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] text-[#007185]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1100px] px-4 py-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="flex aspect-square items-center justify-center overflow-hidden bg-white"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span></div>
              <div>
                <h1 class="text-[22px] font-normal leading-snug">{{ pdp.name }}</h1>
                <div class="mt-1 flex text-[#DE7921]"><Star v-for="s in stars" :key="s" class="size-4" fill="#DE7921" stroke="#DE7921" /></div>
                <span v-if="designLabDiscount(pdp)" class="mt-2 inline-block rounded-sm bg-[#CC0C39] px-1.5 py-0.5 text-[11px] font-bold text-white">Save {{ designLabDiscount(pdp)!.pct }}%</span>
                <div class="mt-2 flex items-baseline gap-0.5 border-t border-[#E7E7E7] pt-2"><span class="text-[13px]" :class="designLabDiscount(pdp) ? 'text-[#CC0C39]' : ''">₦</span><span class="text-[28px] leading-none" :class="designLabDiscount(pdp) ? 'text-[#CC0C39]' : ''">{{ selPrice.toLocaleString() }}</span></div>
                <p v-if="designLabDiscount(pdp)?.compareNaira" class="text-[12px] text-[#565959]">Was <span class="line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span></p>
                <p v-if="pdp.unitPriceBadge" class="text-[12px] text-[#565959]">({{ pdp.unitPriceBadge }})</p>
                <DesignLabUnitPicker
                  v-if="units.length > 1"
                  class="mt-3"
                  :units="units" :selected="selUnit" :accent="ACCENT"
                  :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                  @select="selUnit = $event"
                />
                <p class="mt-3 text-[14px] font-bold">About this item</p>
                <p class="mt-1 text-[14px] text-[#0F1111]">{{ pdp.description || 'Quality grocery item delivered fresh.' }}</p>
              </div>
            </div>
            <aside class="h-fit rounded-lg border border-[#D5D9D9] p-4">
              <div class="flex items-baseline gap-0.5"><span class="text-[13px]">₦</span><span class="text-[26px] leading-none">{{ selPrice.toLocaleString() }}</span></div>
              <p class="mt-2 text-[14px] font-medium text-[#067D62] flex items-center gap-1"><Leaf class="size-4" /> Delivery by 9 PM</p>
              <p class="mt-2 text-[18px] font-medium text-[#007600]">In Stock</p>
              <div class="mt-3 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#D5D9D9] px-2 py-1.5">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" /></button><input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" /><button @click="qty++"><Plus class="size-4" /></button>
                </div>
              </div>
              <button class="mt-3 w-full rounded-[18px] border border-[#FCD200] bg-[#FFD814] py-2 text-[14px] font-medium hover:bg-[#F7CA00]" @click="addFromPdp">Add to Cart</button>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold text-[#067D62]">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <button class="mt-2 w-full rounded-[18px] border border-[#FF8F00] bg-[#FFA41C] py-2 text-[14px] font-medium hover:bg-[#FA8900]">Buy Now</button>
            </aside>
          </div>
          <section class="mt-8">
            <h2 class="text-[18px] font-bold">Products related to this item</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[8px] border border-[#D5D9D9] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px]"><span class="text-[10px]">₦</span><span class="text-[15px]">{{ r.priceNaira.toLocaleString() }}</span></p>
                <a class="line-clamp-1 text-[12px] text-[#007185]">{{ r.name }}</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
