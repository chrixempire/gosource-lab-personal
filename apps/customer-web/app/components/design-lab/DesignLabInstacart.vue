<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#0AAD0A';

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
const font = 'font-family:"Helvetica Neue",Inter,system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#343538]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" />

    <!-- CARD GRID -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div
        v-for="p in products"
        :key="p.id"
        class="rounded-[8px] border bg-white p-3 transition"
        :class="cart.qtyOfProduct(p.id) ? 'border-[#0AAD0A] ring-1 ring-[#0AAD0A]' : 'border-[#E8E9EB]'"
      >
        <div class="relative">
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" />
            <span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute right-1 top-1">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" outline :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 text-[16px] font-bold leading-none">{{ formatNaira(p.priceNaira) }}</p>
        <p v-if="designLabIsMultiUnit(p)" class="mt-0.5 text-[12px] text-[#72767E]">{{ designLabUnits(p).length }} unit options</p>
        <p v-else-if="p.unitPriceBadge" class="mt-0.5 text-[12px] text-[#72767E]">{{ p.unitPriceBadge }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] leading-tight hover:underline" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-[#72767E]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- QUICK-VIEW MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-2xl bg-white p-5 text-[#343538] shadow-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#FAFAFA]">
            <img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span>
          </div>
          <p class="mt-3 text-[20px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
          <h3 class="mt-1 text-[16px] font-medium">{{ selected.name }}</h3>
          <p class="text-[13px] text-[#72767E]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full border border-[#E8E9EB] px-2 py-1.5">
              <button class="text-[#0AAD0A]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button class="text-[#0AAD0A]" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-[15px] font-semibold text-white transition" :class="added ? 'bg-[#108910]' : 'bg-[#0AAD0A] hover:bg-[#108910]'" @click="addFromModal">
              <Check v-if="added" class="size-4" /> {{ added ? 'Added to cart' : 'Add to cart' }}
            </button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-semibold text-[#0AAD0A] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- FULL PRODUCT PAGE -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#343538]">
        <header class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E8E9EB] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-semibold text-[#0AAD0A]" @click="pdp = null"><ChevronLeft class="size-5" /> Back to store</button>
          <span v-if="cart.count.value" class="text-[13px] font-semibold text-[#0AAD0A]">🛒 {{ cart.count.value }} · {{ formatNaira(cart.total.value) }}</span>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#E8E9EB] bg-[#FAFAFA]">
              <img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span>
            </div>
            <div>
              <p class="text-[13px] text-[#72767E]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[24px] font-semibold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#72767E]">{{ pdp.unit }}</p>
              <p class="mt-3 text-[28px] font-bold leading-none">{{ formatNaira(selPrice) }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#E8E9EB] px-3 py-2">
                  <button class="text-[#0AAD0A]" @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button class="text-[#0AAD0A]" @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#0AAD0A] py-3.5 text-[16px] font-semibold text-white hover:bg-[#108910]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold text-[#0AAD0A]">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#E8E9EB] border-y border-[#E8E9EB]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-semibold">Details</summary><p class="mt-2 text-[14px] text-[#72767E]">{{ pdp.description || 'Premium grocery item supplied by GoSource.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-semibold">Nutrition</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-semibold">Related items</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[8px] border border-[#E8E9EB] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white">
                  <img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span>
                </div>
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
