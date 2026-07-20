<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, ChevronDown, Search, Check, Truck } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabDiscount } from '~/lib/design-lab';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();

// Twiga Foods brand — verified by sampling the official logo (navy oval + golden
// giraffe/wordmark). Primary is deep navy; yellow is the accent used on the
// giraffe, ring and promo/bulk tags. NOT green — the giraffe brand is navy+gold.
const ACCENT = '#1A1B53'; // navy — primary brand
const GOLD = '#FCCC08'; // golden yellow — bulk/promo accent
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

// Single-unit row helpers (default = first unit).
function addRow(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function qtyRow(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));

// Category filter — businesslike segmented tab row for B2B buyers.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const font = 'font-family:Inter,"Helvetica Neue",system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1A1B53]">
    <!-- STORE HEADER — trust bar for business buyers -->
    <div class="mb-3 flex items-center gap-3 rounded-lg px-4 py-2.5 text-white" :style="{ background: ACCENT }">
      <span class="text-[18px]">🦒</span>
      <span class="text-[15px] font-extrabold tracking-tight">Twiga</span>
      <span class="hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-flex" :style="{ background: GOLD, color: ACCENT }">
        <Truck class="size-3" /> Next-day delivery to your shop
      </span>
      <div class="ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-white/80">
        <Search class="size-4" /><span class="text-[13px]">Search wholesale catalogue</span>
      </div>
    </div>

    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" label="View order" />

    <!-- CATEGORY FILTER -->
    <div class="mb-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="cat in ['All', ...categories]"
        :key="cat"
        type="button"
        class="shrink-0 rounded-md px-3.5 py-2 text-[13px] font-bold transition"
        :class="activeCat === cat ? 'text-white' : 'bg-[#EEEEF4] text-[#5A5B7A] hover:bg-[#E2E2EC]'"
        :style="activeCat === cat ? { background: ACCENT } : {}"
        @click="activeCat = cat"
      >{{ cat }}</button>
    </div>

    <!-- PRODUCT LIST — B2B list rows for bulk/wholesale buyers -->
    <div class="overflow-hidden rounded-lg border border-[#E4E4EC] bg-white">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="flex items-center gap-3 border-t border-[#EEEEF4] px-4 py-3 transition first:border-t-0"
        :class="cart.qtyOfProduct(p.id) ? 'border-l-4 border-l-[#FCCC08] bg-[#FCFBF3]' : 'border-l-4 border-l-transparent'"
      >
        <button class="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F4F4F8]" @click="openModal(p)">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-cover" /><span v-else class="text-2xl">🛒</span>
        </button>

        <div class="min-w-0 flex-1 cursor-pointer" @click="openModal(p)">
          <p class="truncate text-[15px] font-bold leading-tight">{{ p.name }}</p>
          <p class="mt-0.5 text-[12px] text-[#78798F]">
            <template v-if="designLabIsMultiUnit(p)">{{ designLabUnits(p).length }} pack sizes · from {{ formatNaira(designLabUnits(p).at(-1)?.priceNaira ?? p.priceNaira) }}</template>
            <template v-else>{{ p.unit }}<span v-if="p.unitPriceBadge"> · {{ p.unitPriceBadge }}</span></template>
          </p>
          <span v-if="designLabDiscount(p)" class="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold" :style="{ background: GOLD, color: ACCENT }">
            BULK DEAL · {{ designLabDiscount(p)!.pct }}% OFF
          </span>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-[15px] font-extrabold">{{ formatNaira(p.priceNaira) }}</p>
          <p v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#78798F] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</p>
          <p v-else class="text-[11px] text-[#78798F]">{{ designLabIsMultiUnit(p) ? 'from' : 'per unit' }}</p>
        </div>

        <!-- MULTI-UNIT: open picker. SINGLE-UNIT: inline stepper -->
        <div class="flex shrink-0 items-center gap-2">
          <template v-if="designLabIsMultiUnit(p)">
            <button
              class="relative flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
              :style="{ background: ACCENT }"
              @click="openModal(p)"
            >
              <Plus class="size-4" :stroke-width="2.5" /> Sizes
              <span v-if="cart.qtyOfProduct(p.id)" class="ml-0.5 rounded-full px-1.5 text-[12px] font-extrabold" :style="{ background: GOLD, color: ACCENT }">{{ cart.qtyOfProduct(p.id) }}</span>
            </button>
          </template>
          <template v-else>
            <div class="inline-flex items-center rounded-lg border border-[#E4E4EC]">
              <button class="flex size-8 items-center justify-center" :style="{ color: ACCENT }" @click="addRow(p, -1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input
                type="number" min="0" :value="qtyRow(p)"
                class="w-8 bg-transparent text-center text-[14px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                @change="(e) => { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, +(e.target as HTMLInputElement).value); }"
              />
              <button class="flex items-center gap-0.5 rounded-r-lg px-2 text-[12px] font-bold text-[#78798F]">Case <ChevronDown class="size-3.5" /></button>
            </div>
            <button class="flex size-9 items-center justify-center rounded-lg text-white transition hover:opacity-90" :style="{ background: ACCENT }" aria-label="Add" @click="addRow(p)"><Plus class="size-5" :stroke-width="2.5" /></button>
          </template>
        </div>
      </div>
    </div>

    <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[15px] font-extrabold uppercase tracking-wide text-white transition hover:opacity-90" :style="{ background: ACCENT }">
      <span v-if="cart.count.value">Place order · {{ cart.count.value }} items · {{ formatNaira(cart.total.value) }}</span>
      <span v-else>Place order</span>
    </button>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[440px] rounded-t-2xl bg-white p-5 text-[#1A1B53] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F4F4F8]">
            <span v-if="designLabDiscount(selected)" class="absolute left-2 top-2 z-10 rounded-md px-2 py-1 text-[12px] font-extrabold" :style="{ background: GOLD, color: ACCENT }">BULK DEAL · {{ designLabDiscount(selected)!.pct }}% OFF</span>
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-6xl">🛒</span>
          </div>
          <p class="mt-3 text-[12px] font-bold uppercase tracking-wide text-[#78798F]">{{ selected.brandLabel || selected.categoryName }}</p>
          <h3 class="text-[17px] font-extrabold leading-tight">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#78798F]">{{ selected.unit }}</p>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[22px] font-extrabold">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#78798F] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="inline-flex items-center rounded-lg border border-[#E4E4EC]">
              <button class="flex size-9 items-center justify-center" :style="{ color: ACCENT }" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button class="flex size-9 items-center justify-center" :style="{ color: ACCENT }" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-3 text-[15px] font-extrabold uppercase tracking-wide text-white transition hover:opacity-90" :style="{ background: ACCENT }" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added' : 'Add to order' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold hover:underline" :style="{ color: ACCENT }" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1A1B53]">
        <header class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 text-white" :style="{ background: ACCENT }">
          <button class="flex items-center gap-1 text-[14px] font-bold" @click="pdp = null"><ChevronLeft class="size-5" /> Back to catalogue</button>
          <span v-if="cart.count.value" class="text-[13px] font-bold">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F4F4F8]">
              <span v-if="designLabDiscount(pdp)" class="absolute left-3 top-3 z-10 rounded-md px-2 py-1 text-[13px] font-extrabold" :style="{ background: GOLD, color: ACCENT }">BULK DEAL · {{ designLabDiscount(pdp)!.pct }}% OFF</span>
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-7xl">🛒</span>
            </div>
            <div>
              <p class="text-[12px] font-bold uppercase tracking-wide text-[#78798F]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[26px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#78798F]">{{ pdp.unit }}</p>
              <p class="mt-3 text-[26px] font-extrabold">{{ formatNaira(selPrice) }} <span class="text-[13px] font-normal text-[#78798F]">per {{ selUnit }}</span></p>
              <div v-if="designLabDiscount(pdp)" class="mt-1.5 flex items-center gap-2">
                <span class="rounded px-1.5 py-0.5 text-[12px] font-extrabold" :style="{ background: GOLD, color: ACCENT }">{{ designLabDiscount(pdp)!.pct }}% OFF</span>
                <span v-if="designLabDiscount(pdp)!.compareNaira" class="text-[14px] text-[#78798F] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="inline-flex items-center rounded-lg border border-[#E4E4EC]">
                  <button class="flex size-10 items-center justify-center" :style="{ color: ACCENT }" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button class="flex size-10 items-center justify-center" :style="{ color: ACCENT }" @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-lg py-3.5 text-[15px] font-extrabold uppercase tracking-wide text-white transition hover:opacity-90" :style="{ background: ACCENT }" @click="addFromPdp">Add to order</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-bold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in order</p>
              <div class="mt-7 divide-y divide-[#EEEEF4] border-y border-[#EEEEF4]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-bold">Product info</summary><p class="mt-2 text-[14px] text-[#78798F]">{{ pdp.description || 'Wholesale supply delivered next-day to shops, kiosks and vendors.' }}</p></details>
                <details class="py-3.5"><summary class="cursor-pointer text-[15px] font-bold">Bulk pricing & delivery</summary><p class="mt-2 text-[14px] text-[#78798F]">Order by the case for the best per-unit rate. Free next-day delivery on qualifying orders.</p></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[18px] font-extrabold uppercase">Frequently ordered together</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-lg border border-[#E4E4EC] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-[#F4F4F8]"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-extrabold">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px]">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
