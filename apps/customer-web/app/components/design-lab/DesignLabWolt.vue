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
// "Wolt blue" — Wolt's signature bright cyan-blue (Cerulean #009DE0). Text is
// near-black Cod Gray (#141414). Award-winning minimalist look: white surfaces,
// generous whitespace, soft-rounded cards, clean sans-serif.
const ACCENT = '#009DE0';
const FG = '#ffffff';
const INK = '#141414';

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

// Category rail — Wolt's clean chip/segmented nav.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:Inter,"Helvetica Neue",system-ui,-apple-system,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#141414]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />

    <!-- CATEGORY RAIL — Wolt-style rounded chip nav -->
    <div class="wolt-rail mb-5 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors"
        :class="activeCat === 'All' ? 'text-white' : 'bg-[#F2F3F5] text-[#141414] hover:bg-[#E7E9EC]'"
        :style="activeCat === 'All' ? { background: ACCENT } : {}"
        @click="activeCat = 'All'"
      >
        <span>🛒</span><span>All</span>
      </button>
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors"
        :class="activeCat === c ? 'text-white' : 'bg-[#F2F3F5] text-[#141414] hover:bg-[#E7E9EC]'"
        :style="activeCat === c ? { background: ACCENT } : {}"
        @click="activeCat = c"
      >
        <span>{{ designLabCategoryEmoji(c) }}</span><span>{{ c }}</span>
      </button>
    </div>

    <!-- CARD GRID — clean, airy, soft-rounded cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="flex flex-col rounded-[16px] bg-white p-2.5 shadow-[0_1px_3px_rgba(20,20,20,0.06)] transition hover:shadow-[0_6px_20px_rgba(20,20,20,0.10)]"
        :class="cart.qtyOfProduct(p.id) ? 'ring-2 ring-[#009DE0]' : 'ring-1 ring-[#EDEEF0]'"
      >
        <div class="relative">
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[12px] bg-[#F7F8F9]" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" />
            <span v-else class="text-4xl">🛒</span>
          </div>
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
            :style="{ background: ACCENT }"
          >-{{ designLabDiscount(p)!.pct }}%</span>
          <div class="absolute bottom-1.5 right-1.5">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <div class="mt-2.5 flex items-baseline gap-1.5 leading-none">
          <span class="text-[16px] font-bold text-[#141414]">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[12px] text-[#8B8F98] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </div>
        <p v-if="designLabIsMultiUnit(p)" class="mt-1 text-[11.5px] text-[#8B8F98]">{{ designLabUnits(p).length }} unit options</p>
        <p v-else-if="p.unitPriceBadge" class="mt-1 text-[11.5px] text-[#8B8F98]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[13.5px] font-medium leading-snug text-[#141414]" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[11.5px] text-[#8B8F98]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[440px] rounded-t-[22px] bg-white p-5 text-[#141414] shadow-2xl sm:rounded-[22px]">
          <button class="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-[#F2F3F5] hover:bg-[#E7E9EC]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[16px] bg-[#F7F8F9]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
            <span
              v-if="designLabDiscount(selected)"
              class="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[12px] font-bold text-white shadow-sm"
              :style="{ background: ACCENT }"
            >-{{ designLabDiscount(selected)!.pct }}%</span>
          </div>
          <div class="mt-4 flex items-baseline gap-2 leading-none">
            <span class="text-[22px] font-bold text-[#141414]">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#8B8F98] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <h3 class="mt-1.5 text-[16px] font-semibold">{{ selected.name }}</h3>
          <p class="text-[12.5px] text-[#8B8F98]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-5 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full bg-[#F2F3F5] px-2.5 py-2">
              <button :style="{ color: ACCENT }" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button :style="{ color: ACCENT }" @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3.5 text-[15px] font-bold text-white transition hover:brightness-95" :style="{ background: ACCENT }" @click="addFromModal">
              <Check v-if="added" class="size-4" /> {{ added ? 'Added' : 'Add to order' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-semibold hover:underline" :style="{ color: ACCENT }" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#141414]">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#EDEEF0] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-semibold" :style="{ color: ACCENT }" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
          <span v-if="cart.count.value" class="text-[13px] font-semibold" :style="{ color: ACCENT }">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px] bg-[#F7F8F9]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="absolute left-3 top-3 rounded-full px-3 py-1 text-[13px] font-bold text-white shadow-sm"
                :style="{ background: ACCENT }"
              >-{{ designLabDiscount(pdp)!.pct }}%</span>
            </div>
            <div>
              <p class="text-[13px] font-medium text-[#8B8F98]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="mt-0.5 text-[26px] font-bold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#8B8F98]">{{ pdp.unit }}</p>
              <div class="mt-4 flex items-baseline gap-2 leading-none">
                <span class="text-[30px] font-bold text-[#141414]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#8B8F98] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-5"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full bg-[#F2F3F5] px-3.5 py-2.5">
                  <button :style="{ color: ACCENT }" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button :style="{ color: ACCENT }" @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full py-4 text-[16px] font-bold text-white transition hover:brightness-95" :style="{ background: ACCENT }" @click="addFromPdp">Add to order</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2.5 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-7 divide-y divide-[#EDEEF0] border-y border-[#EDEEF0]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-semibold">Details</summary><p class="mt-2 text-[14px] text-[#8B8F98]">{{ pdp.description || 'Premium grocery item supplied by GoSource.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-semibold">Delivery</summary><p class="mt-2 text-[14px] text-[#8B8F98]">Delivered fast, right to your door.</p></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[18px] font-bold">You might also like</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[16px] bg-white p-2 ring-1 ring-[#EDEEF0]">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded-[12px] bg-[#F7F8F9]">
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
                </div>
                <p class="mt-1.5 text-[13px] font-bold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px] text-[#141414]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wolt-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.wolt-rail::-webkit-scrollbar {
  display: none;
}
</style>
