<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Zap } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit, designLabCategories, designLabCategoryEmoji, designLabDiscount } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();

// Rappi brand — vivid orange-red into pink, super-app energy.
const ACCENT = '#FF441F';
const PINK = '#FF2D6D';
const FG = '#ffffff';
const GRAD = `linear-gradient(135deg, ${ACCENT} 0%, ${PINK} 100%)`;

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

// Category rail.
const activeCat = ref('All');
const categories = computed(() => designLabCategories(props.products));
const visibleProducts = computed(() =>
  activeCat.value === 'All' ? props.products : props.products.filter((p) => p.categoryName === activeCat.value),
);

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:Poppins,Montserrat,"Helvetica Neue",Inter,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1c1c28]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" label="Ver carrito" />

    <!-- Super-app hero strip -->
    <div class="mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-white" :style="{ background: GRAD }">
      <span class="flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[12px] font-extrabold uppercase tracking-wide">
        <Zap class="size-3.5" :fill="FG" /> Turbo
      </span>
      <span class="text-[13px] font-bold">Entrega en 10 min · antojos al instante</span>
    </div>

    <!-- CATEGORY RAIL -->
    <div class="rappi-rail mb-4 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition"
        :style="activeCat === 'All' ? { background: GRAD, color: FG } : {}"
        :class="activeCat === 'All' ? 'shadow-sm' : 'bg-[#FFF0EC] text-[#FF441F] hover:bg-[#ffe4dc]'"
        @click="activeCat = 'All'"
      >
        <span>🛒</span><span>Todo</span>
      </button>
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition"
        :style="activeCat === c ? { background: GRAD, color: FG } : {}"
        :class="activeCat === c ? 'shadow-sm' : 'bg-[#FFF0EC] text-[#FF441F] hover:bg-[#ffe4dc]'"
        @click="activeCat = c"
      >
        <span>{{ designLabCategoryEmoji(c) }}</span><span>{{ c }}</span>
      </button>
    </div>

    <!-- CARD GRID -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="p in visibleProducts"
        :key="p.id"
        class="rounded-[16px] border bg-white p-2.5 transition"
        :class="cart.qtyOfProduct(p.id) ? 'border-[#FF441F] ring-1 ring-[#FF441F]' : 'border-[#EDEDF0]'"
      >
        <div class="relative">
          <span
            v-if="designLabDiscount(p)"
            class="absolute left-0 top-0 z-10 rounded-full px-2 py-1 text-[11px] font-extrabold text-white shadow-sm"
            :style="{ background: GRAD }"
          >-{{ designLabDiscount(p)!.pct }}%</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFB]" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" />
            <span v-else class="text-4xl">🛒</span>
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
          <span class="text-[15px] font-extrabold text-[#FF441F]">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="designLabDiscount(p)?.compareNaira" class="text-[11px] text-[#8b8b98] line-through">{{ formatNaira(designLabDiscount(p)!.compareNaira!) }}</span>
        </div>
        <p v-if="designLabIsMultiUnit(p)" class="mt-0.5 text-[11px] font-semibold text-[#8b8b98]">{{ designLabUnits(p).length }} presentaciones</p>
        <p v-else-if="p.unitPriceBadge" class="mt-0.5 text-[11px] text-[#8b8b98]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[13px] font-semibold leading-tight hover:text-[#FF441F]" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[11px] text-[#8b8b98]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-t-3xl bg-white p-5 text-[#1c1c28] shadow-2xl sm:rounded-3xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#FAFAFB]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
            <span
              v-if="designLabDiscount(selected)"
              class="absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-[12px] font-extrabold text-white shadow-sm"
              :style="{ background: GRAD }"
            >-{{ designLabDiscount(selected)!.pct }}%</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-[22px] font-extrabold text-[#FF441F]">{{ formatNaira(selPrice) }}</span>
            <span v-if="designLabDiscount(selected)?.compareNaira" class="text-[14px] text-[#8b8b98] line-through">{{ formatNaira(designLabDiscount(selected)!.compareNaira!) }}</span>
          </div>
          <h3 class="mt-1 text-[16px] font-bold">{{ selected.name }}</h3>
          <p class="text-[12px] text-[#8b8b98]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full px-2 py-1.5 text-white" :style="{ background: GRAD }">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <span class="w-5 text-center text-[15px] font-extrabold">{{ qty }}</span>
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-[15px] font-extrabold text-white shadow-sm transition hover:brightness-105" :style="{ background: GRAD }" @click="addFromModal">
              <Check v-if="added" class="size-4" />{{ added ? 'Agregado' : 'Agregar' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#FF441F] hover:underline" @click="viewFull">Ver página completa →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1c1c28]">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 text-white" :style="{ background: GRAD }">
          <button class="flex items-center gap-1 text-[14px] font-extrabold" @click="pdp = null"><ChevronLeft class="size-5" /> Volver</button>
          <span v-if="cart.count.value" class="text-[13px] font-bold">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-[#EDEDF0] bg-[#FAFAFB]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
              <span
                v-if="designLabDiscount(pdp)"
                class="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[13px] font-extrabold text-white shadow-sm"
                :style="{ background: GRAD }"
              >-{{ designLabDiscount(pdp)!.pct }}%</span>
            </div>
            <div>
              <span class="inline-flex items-center gap-1 rounded-full bg-[#FFF0EC] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#FF441F]">
                <Zap class="size-3" :fill="ACCENT" /> Turbo
              </span>
              <p class="mt-2 text-[13px] text-[#8b8b98]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[24px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#8b8b98]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-[28px] font-extrabold text-[#FF441F]">{{ formatNaira(selPrice) }}</span>
                <span v-if="designLabDiscount(pdp)?.compareNaira" class="text-[16px] text-[#8b8b98] line-through">{{ formatNaira(designLabDiscount(pdp)!.compareNaira!) }}</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full px-3 py-2 text-white" :style="{ background: GRAD }">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <span class="w-6 text-center font-extrabold">{{ qty }}</span>
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full py-3.5 text-[16px] font-extrabold text-white shadow-sm transition hover:brightness-105" :style="{ background: GRAD }" @click="addFromPdp">Agregar al carrito</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-bold text-[#FF441F]">✓ {{ cart.qtyOfProduct(pdp.id) }} en el carrito</p>
              <div class="mt-6 divide-y divide-[#EDEDF0] border-y border-[#EDEDF0]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Descripción</summary><p class="mt-2 text-[14px] text-[#8b8b98]">{{ pdp.description || 'Tus antojos entregados en minutos con Rappi.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-bold">Información nutricional</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">También te puede gustar</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[16px] border border-[#EDEDF0] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFB]">
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
                </div>
                <p class="mt-1 text-[13px] font-extrabold text-[#FF441F]">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px] font-semibold">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.rappi-rail {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.rappi-rail::-webkit-scrollbar {
  display: none;
}
</style>
