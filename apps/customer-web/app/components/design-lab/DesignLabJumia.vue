<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Star, ShoppingCart } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabCategoryEmoji, designLabDiscount } from '~/lib/design-lab';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#F68B1E';
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

function addCard(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function setCard(p: MarketProduct, n: number) { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, n); }
function qtyCard(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));

const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const font = 'font-family:Inter,"Helvetica Neue",Arial,sans-serif';
const stars = [1, 2, 3, 4, 5];
</script>

<template>
  <div :style="font" class="text-[#282828]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- CATEGORY RAIL — Jumia-style dense colourful chips, active = orange -->
    <div class="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[12px] font-bold transition"
        :class="activeCat === 'All' ? 'bg-[#F68B1E] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'"
        @click="activeCat = 'All'"
      >
        🛍️ All
      </button>
      <button
        v-for="c in categories"
        :key="c"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[4px] px-3 py-1.5 text-[12px] font-bold transition"
        :class="activeCat === c ? 'bg-[#F68B1E] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'"
        @click="activeCat = c"
      >
        {{ designLabCategoryEmoji(c) }} {{ c }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      <div v-for="p in visibleProducts" :key="p.id" class="rounded-[4px] border bg-white p-2 transition" :class="cart.qtyOfProduct(p.id) ? 'border-[#F68B1E] ring-1 ring-[#F68B1E]' : 'border-[#EDEDED]'">
        <div class="relative cursor-pointer" @click="openModal(p)">
          <span v-if="designLabDiscount(p)" class="absolute left-0 top-0 z-10 rounded-br-[4px] rounded-tl-[3px] bg-[#FF3326] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">-{{ designLabDiscount(p)!.pct }}%</span>
          <div class="flex aspect-square items-center justify-center overflow-hidden bg-white">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
        </div>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[13px] leading-tight hover:text-[#F68B1E]" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-1 text-[16px] font-bold leading-none">{{ formatNaira(p.priceNaira) }}<span v-if="designLabIsMultiUnit(p)" class="ml-1 text-[11px] font-normal text-[#9BA0A6]">from</span></p>
        <p v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#9BA0A6] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</p>
        <div class="mt-0.5 flex items-center gap-1">
          <div class="flex"><Star v-for="s in stars" :key="s" class="size-3" :class="s <= 4 ? 'fill-[#F68B1E] text-[#F68B1E]' : 'fill-[#E0E0E0] text-[#E0E0E0]'" /></div>
          <span class="text-[10px] text-[#9BA0A6]">(24)</span>
        </div>
        <!-- MULTI-UNIT: open picker. SINGLE-UNIT: Add → inline stepper -->
        <button
          v-if="designLabIsMultiUnit(p)"
          class="mt-2 flex w-full items-center justify-center gap-1 rounded-sm py-1.5 text-[12px] font-bold uppercase transition"
          :class="cart.qtyOfProduct(p.id) ? 'bg-[#F68B1E] text-white' : 'border border-[#F68B1E] text-[#F68B1E] hover:bg-[#FFF3E8]'"
          @click="openModal(p)"
        >
          <ShoppingCart class="size-3.5" /> {{ cart.qtyOfProduct(p.id) ? `${cart.qtyOfProduct(p.id)} in cart · Add` : 'Choose unit' }}
        </button>
        <template v-else>
          <button v-if="!qtyCard(p)" class="mt-2 flex w-full items-center justify-center gap-1 rounded-sm bg-[#F68B1E] py-1.5 text-[12px] font-bold uppercase text-white hover:bg-[#e07d12]" @click="addCard(p)"><ShoppingCart class="size-3.5" /> Add to cart</button>
          <div v-else class="mt-2 flex w-full items-center justify-between rounded-sm border border-[#F68B1E] px-2 py-1 text-[#F68B1E]">
            <button @click="addCard(p, -1)"><Minus class="size-4" :stroke-width="3" /></button>
            <input type="number" min="0" :value="qtyCard(p)" class="w-10 bg-transparent text-center text-[13px] font-bold text-[#282828] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="setCard(p, +($event.target as HTMLInputElement).value)" />
            <button @click="addCard(p)"><Plus class="size-4" :stroke-width="3" /></button>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
        <div :style="font" class="relative grid w-full max-w-[640px] grid-cols-1 gap-4 rounded-lg bg-white p-5 text-[#282828] shadow-2xl sm:grid-cols-[200px_1fr]">
          <button class="absolute right-3 top-3 text-[#9BA0A6] hover:text-[#282828]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
            <span v-if="designLabDiscount(selected)" class="absolute left-0 top-0 z-10 rounded-br-[4px] bg-[#FF3326] px-1.5 py-0.5 text-[12px] font-bold leading-none text-white">-{{ designLabDiscount(selected)!.pct }}%</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <div>
            <h3 class="text-[17px] leading-snug">{{ selected.name }}</h3>
            <div class="mt-1 flex items-center gap-1"><div class="flex"><Star v-for="s in stars" :key="s" class="size-4" :class="s <= 4 ? 'fill-[#F68B1E] text-[#F68B1E]' : 'fill-[#E0E0E0] text-[#E0E0E0]'" /></div><span class="text-[11px] text-[#9BA0A6]">(24 verified)</span></div>
            <p class="mt-2 text-[24px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
            <p v-if="designLabDiscount(selected)?.compareNaira" class="text-[12px] text-[#9BA0A6] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</p>
            <DesignLabUnitPicker v-if="units.length > 1" class="mt-3" :units="units" :selected="selUnit" :accent="ACCENT" :in-cart="(u) => cart.qtyOf(selected!.id, u)" @select="selUnit = $event" />
            <div class="mt-3 flex items-center gap-3">
              <div class="flex items-center gap-3 rounded-sm border border-[#EDEDED] px-2 py-1.5">
                <button class="text-[#F68B1E]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
                <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                <button class="text-[#F68B1E]" @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
              </div>
              <button class="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-[#F68B1E] py-2.5 text-[14px] font-bold uppercase text-white hover:bg-[#e07d12]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
            </div>
            <button class="mt-3 text-[14px] font-bold text-[#F68B1E] hover:underline" @click="viewFull">View full page →</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-[#F5F5F5] text-[#282828]">
        <header class="sticky top-0 z-10 flex items-center justify-between border-b border-[#EDEDED] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#F68B1E]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
          <span v-if="cart.count.value" class="text-[13px] font-semibold text-[#F68B1E]">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1100px] px-4 py-6">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div class="grid grid-cols-1 gap-4 rounded-lg bg-white p-5 md:grid-cols-2">
              <div class="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
                <span v-if="designLabDiscount(pdp)" class="absolute left-0 top-0 z-10 rounded-br-[4px] bg-[#FF3326] px-2 py-1 text-[13px] font-bold leading-none text-white">-{{ designLabDiscount(pdp)!.pct }}%</span>
                <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span>
              </div>
              <div>
                <h1 class="text-[20px] leading-snug">{{ pdp.name }}</h1>
                <div class="mt-1 flex items-center gap-1"><div class="flex"><Star v-for="s in stars" :key="s" class="size-4" :class="s <= 4 ? 'fill-[#F68B1E] text-[#F68B1E]' : 'fill-[#E0E0E0] text-[#E0E0E0]'" /></div><span class="text-[12px] text-[#9BA0A6]">(24 verified ratings)</span></div>
                <p class="mt-2 text-[28px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
                <p v-if="designLabDiscount(pdp)?.compareNaira" class="text-[13px] text-[#9BA0A6] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</p>
                <DesignLabUnitPicker v-if="units.length > 1" class="mt-3" :units="units" :selected="selUnit" :accent="ACCENT" :in-cart="(u) => cart.qtyOf(pdp!.id, u)" @select="selUnit = $event" />
                <p class="mt-3 text-[14px] font-bold">Key features</p>
                <p class="mt-1 text-[14px] text-[#6B6B6B]">{{ pdp.description || 'Genuine product. Pay on delivery available across Nigeria.' }}</p>
              </div>
            </div>
            <aside class="h-fit rounded-lg bg-white p-4">
              <p class="text-[14px] font-bold">Delivery &amp; Returns</p>
              <p class="mt-2 text-[13px] text-[#6B6B6B]">Pay on delivery. Free returns within 7 days.</p>
              <div class="mt-3 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-sm border border-[#EDEDED] px-2 py-1.5">
                  <button class="text-[#F68B1E]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
                  <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button class="text-[#F68B1E]" @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
                </div>
              </div>
              <button class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm bg-[#F68B1E] py-3 text-[14px] font-bold uppercase text-white hover:bg-[#e07d12]" @click="addFromPdp"><ShoppingCart class="size-4" /> Add to cart</button>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-center text-[13px] font-bold text-[#F68B1E]">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
            </aside>
          </div>
          <section class="mt-4 rounded-lg bg-white p-5">
            <h2 class="text-[16px] font-bold">Customers who viewed this also viewed</h2>
            <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[4px] border border-[#EDEDED] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 line-clamp-1 text-[12px]">{{ r.name }}</p>
                <p class="text-[14px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
