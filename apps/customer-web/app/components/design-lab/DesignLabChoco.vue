<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Search, ChevronDown, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#3D6BFF';
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

function addRow(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function qtyRow(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));

const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const groups = computed(() => {
  const map = new Map<string, MarketProduct[]>();
  for (const p of visibleProducts.value) {
    const key = p.brandLabel || p.categoryName || 'GoSource Supplier';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()];
});
const font = 'font-family:Inter,system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#18003F]">
    <div class="mb-3 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
      <span class="text-[15px] font-bold uppercase tracking-wide text-[#18003F]">GoSource Foods</span>
      <div class="ml-auto flex items-center gap-2 rounded-full bg-[#F3F4F6] px-3 py-1.5 text-[#78716C]"><Search class="size-4" /><span class="text-[13px]">Search catalogue</span></div>
    </div>

    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" label="View order" />

    <!-- CATEGORY FILTER: businesslike segmented tab row -->
    <div class="mb-3 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="cat in ['All', ...categories]"
        :key="cat"
        class="shrink-0 rounded-md px-3.5 py-2 text-[13px] font-semibold transition"
        :class="activeCat === cat ? 'bg-[#3D6BFF] text-white' : 'bg-[#F1F4FF] text-[#475569] hover:bg-[#E4EAFF]'"
        @click="activeCat = cat"
      >{{ cat }}</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
      <template v-for="[supplier, items] in groups" :key="supplier">
        <div class="bg-[#F8F7FB] px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-[#18003F]">{{ supplier }}</div>
        <div
          v-for="p in items"
          :key="p.id"
          class="flex items-center gap-3 border-t px-4 py-3 transition"
          :class="cart.qtyOfProduct(p.id) ? 'border-l-4 border-l-[#3D6BFF] border-t-[#E5E7EB] bg-[#F5F8FF]' : 'border-l-4 border-l-transparent border-t-[#E5E7EB]'"
        >
          <button class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F4F6]" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-cover" /><span v-else class="text-xl">🛒</span>
          </button>
          <div class="min-w-0 flex-1 cursor-pointer" @click="openModal(p)">
            <p class="truncate text-[15px] font-semibold">{{ p.name }}</p>
            <p class="text-[12px] text-[#78716C]">
              <template v-if="designLabIsMultiUnit(p)">{{ designLabUnits(p).length }} units · from {{ formatNaira(designLabUnits(p).at(-1)?.priceNaira ?? p.priceNaira) }}</template>
              <template v-else>{{ p.unit }}</template>
            </p>
            <p class="text-[12px] text-[#78716C]">Last ordered: Tue, 14 Apr</p>
          </div>
          <div class="shrink-0 text-right">
            <p class="text-[15px] font-semibold">{{ formatNaira(p.priceNaira) }}</p>
            <template v-if="designLabDiscount(p)">
              <div class="mt-0.5 flex items-center justify-end gap-1.5">
                <span class="rounded bg-[#3D6BFF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#3D6BFF]">{{ designLabDiscount(p)!.pct }}% off</span>
                <span v-if="designLabDiscount(p)!.compareNaira" class="text-[11px] text-[#78716C] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
              </div>
            </template>
            <p v-else class="text-[11px] text-[#78716C]">{{ designLabIsMultiUnit(p) ? 'from' : 'per unit' }}</p>
          </div>
          <!-- MULTI-UNIT: open picker. SINGLE-UNIT: inline stepper -->
          <div class="flex shrink-0 items-center gap-2">
            <template v-if="designLabIsMultiUnit(p)">
              <button class="relative flex items-center gap-1 rounded-full bg-[#3D6BFF] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#2a55e0]" @click="openModal(p)">
                <Plus class="size-4" :stroke-width="2.5" /> Units
                <span v-if="cart.qtyOfProduct(p.id)" class="ml-0.5 rounded-full bg-white/25 px-1.5 text-[12px] font-bold">{{ cart.qtyOfProduct(p.id) }}</span>
              </button>
            </template>
            <template v-else>
              <div class="inline-flex items-center rounded-full border border-[#E5E7EB]">
                <button class="flex size-8 items-center justify-center text-[#3D6BFF]" @click="addRow(p, -1)"><Minus class="size-4" :stroke-width="2.5" /></button>
                <input type="number" min="0" :value="qtyRow(p)" class="w-8 bg-transparent text-center text-[14px] font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="(e) => { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, +(e.target as HTMLInputElement).value); }" />
                <button class="flex items-center gap-0.5 rounded-r-full px-2 text-[12px] font-semibold text-[#78716C]">Case <ChevronDown class="size-3.5" /></button>
              </div>
              <button class="flex size-9 items-center justify-center rounded-full bg-[#3D6BFF] text-white hover:bg-[#2a55e0]" aria-label="Add" @click="addRow(p)"><Plus class="size-5" :stroke-width="2.5" /></button>
            </template>
          </div>
        </div>
      </template>
    </div>

    <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#3D6BFF] py-3.5 text-[15px] font-bold uppercase tracking-wide text-white hover:bg-[#2a55e0]">
      <span v-if="cart.count.value">Start order · {{ cart.count.value }} items · {{ formatNaira(cart.total.value) }}</span>
      <span v-else>Start order</span>
    </button>

    <!-- MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[440px] rounded-t-2xl bg-white p-5 text-[#18003F] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6]"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-6xl">🛒</span></div>
          <p class="mt-3 text-[12px] font-bold uppercase tracking-wide text-[#78716C]">{{ selected.brandLabel || selected.categoryName }}</p>
          <h3 class="text-[17px] font-bold uppercase leading-tight">{{ selected.name }}</h3>
          <div class="mt-2 flex items-center gap-2">
            <p class="text-[22px] font-bold">{{ formatNaira(selPrice) }}</p>
            <template v-if="designLabDiscount(selected)">
              <span class="rounded bg-[#3D6BFF]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#3D6BFF]">{{ designLabDiscount(selected)!.pct }}% off</span>
              <span v-if="designLabDiscount(selected)!.compareNaira" class="text-[13px] text-[#78716C] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
            </template>
          </div>
          <DesignLabUnitPicker v-if="units.length > 1" class="mt-3" :units="units" :selected="selUnit" :accent="ACCENT" :in-cart="(u) => cart.qtyOf(selected!.id, u)" @select="selUnit = $event" />
          <div class="mt-4 flex items-center gap-3">
            <div class="inline-flex items-center rounded-full border border-[#E5E7EB]">
              <button class="flex size-9 items-center justify-center text-[#3D6BFF]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button class="flex size-9 items-center justify-center text-[#3D6BFF]" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#3D6BFF] py-3 text-[15px] font-bold uppercase tracking-wide text-white hover:bg-[#2a55e0]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added' : 'Add to order' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#3D6BFF] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- PDP -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#18003F]">
        <header class="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#3D6BFF]" @click="pdp = null"><ChevronLeft class="size-5" /> Back to catalogue</button>
          <span v-if="cart.count.value" class="text-[13px] font-semibold text-[#3D6BFF]">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4F6]"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <p class="text-[12px] font-bold uppercase tracking-wide text-[#78716C]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[26px] font-bold uppercase leading-tight">{{ pdp.name }}</h1>
              <p class="mt-3 text-[26px] font-bold">{{ formatNaira(selPrice) }} <span class="text-[13px] font-normal text-[#78716C]">per {{ selUnit }}</span></p>
              <div v-if="designLabDiscount(pdp)" class="mt-1.5 flex items-center gap-2">
                <span class="rounded bg-[#3D6BFF]/10 px-1.5 py-0.5 text-[12px] font-bold text-[#3D6BFF]">{{ designLabDiscount(pdp)!.pct }}% off</span>
                <span v-if="designLabDiscount(pdp)!.compareNaira" class="text-[14px] text-[#78716C] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </div>
              <DesignLabUnitPicker v-if="units.length > 1" class="mt-4" :units="units" :selected="selUnit" :accent="ACCENT" :in-cart="(u) => cart.qtyOf(pdp!.id, u)" @select="selUnit = $event" />
              <div class="mt-6 flex items-center gap-3">
                <div class="inline-flex items-center rounded-full border border-[#E5E7EB]">
                  <button class="flex size-10 items-center justify-center text-[#3D6BFF]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button class="flex size-10 items-center justify-center text-[#3D6BFF]" @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#3D6BFF] py-3.5 text-[15px] font-bold uppercase tracking-wide text-white hover:bg-[#2a55e0]" @click="addFromPdp">Add to order</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in order</p>
              <div class="mt-7 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-bold">Product info</summary><p class="mt-2 text-[14px] text-[#78716C]">{{ pdp.description || 'Wholesale supply for restaurants and businesses.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-bold">Order history</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[18px] font-bold uppercase">From the same supplier</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-lg border border-[#E5E7EB] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-[#F3F4F6]"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-2xl">🛒</span></div>
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
