<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Check, Clock } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#91C813';
const FG = '#1A1A1A';
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
const font = 'font-family:Inter,"Helvetica Neue",Arial,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1A1A1A]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="p in products" :key="p.id" class="overflow-hidden rounded-[14px] border bg-white transition" :class="cart.qtyOfProduct(p.id) ? 'border-[#91C813] ring-1 ring-[#91C813]' : 'border-[#E5E5E5]'">
        <div class="relative cursor-pointer" @click="openModal(p)">
          <div class="flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#F4F4F2]">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-cover" /><span v-else class="text-4xl">🍽️</span>
          </div>
          <span class="absolute left-3 top-3 rounded-md bg-[#1A1A1A] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Top rated</span>
        </div>
        <div class="p-4">
          <p class="line-clamp-2 cursor-pointer text-[16px] font-bold leading-tight" @click="openModal(p)">{{ p.name }}</p>
          <p class="mt-1 flex items-center gap-1 text-[12px] text-[#6B6B6B]"><Clock class="size-3.5" /> {{ p.unit }}</p>
          <div class="mt-2 flex items-center justify-between gap-2">
            <span class="text-[18px] font-extrabold">{{ formatNaira(p.priceNaira) }}</span>
            <div class="w-[120px]">
              <DesignLabAddControl :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)" :accent="ACCENT" :fg="FG" variant="pill" :multi-unit="designLabIsMultiUnit(p)" @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white text-[#1A1A1A] shadow-2xl">
          <button class="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 hover:bg-white" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#F4F4F2]"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-6xl">🍽️</span></div>
          <div class="p-5">
            <h3 class="text-[19px] font-bold leading-tight">{{ selected.name }}</h3>
            <p class="mt-1 flex items-center gap-1 text-[12px] text-[#6B6B6B]"><Clock class="size-3.5" /> {{ selected.unit }}</p>
            <p class="mt-2 text-[22px] font-extrabold">{{ formatNaira(selPrice) }}</p>
            <DesignLabUnitPicker
              v-if="units.length > 1"
              class="mt-4"
              :units="units" :selected="selUnit" :accent="ACCENT"
              :in-cart="(u) => cart.qtyOf(selected!.id, u)"
              @select="selUnit = $event"
            />
            <div class="mt-4 flex items-center gap-3">
              <div class="flex items-center gap-3 rounded-full border border-[#E5E5E5] px-2 py-1.5">
                <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="2.5" /></button>
                <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                <button @click="qty++"><Plus class="size-4" :stroke-width="2.5" /></button>
              </div>
              <button class="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#91C813] py-3 text-[15px] font-bold text-[#1A1A1A] hover:bg-[#7fb00f]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to box' : 'Add to box' }}</button>
            </div>
            <button class="mt-3 w-full text-center text-[14px] font-bold text-[#3a7d00] hover:underline" @click="viewFull">View full page →</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1A1A1A]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#E5E5E5] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#3a7d00]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#F4F4F2]"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-7xl">🍽️</span></div>
            <div>
              <span class="rounded-md bg-[#1A1A1A] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Top rated</span>
              <h1 class="mt-2 text-[26px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 flex items-center gap-1 text-[13px] text-[#6B6B6B]"><Clock class="size-4" /> {{ pdp.unit }}</p>
              <p class="mt-3 text-[30px] font-extrabold leading-none">{{ formatNaira(selPrice) }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full border border-[#E5E5E5] px-3 py-2">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="2.5" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="2.5" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#91C813] py-3.5 text-[16px] font-bold text-[#1A1A1A] hover:bg-[#7fb00f]" @click="addFromPdp">Add to box</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-bold" style="color:#3a7d00">✓ {{ cart.qtyOfProduct(pdp.id) }} in box</p>
              <div class="mt-6 divide-y divide-[#E5E5E5] border-y border-[#E5E5E5]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">What's inside</summary><p class="mt-2 text-[14px] text-[#6B6B6B]">{{ pdp.description || 'Fresh, pre-portioned ingredients delivered to your door.' }}</p></details>
                <details class="py-3"><summary class="cursor-pointer text-[15px] font-bold">Nutrition</summary></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">More to add</h2>
            <div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div v-for="r in related" :key="r.id" class="overflow-hidden rounded-[14px] border border-[#E5E5E5] bg-white">
                <div class="flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#F4F4F2]"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-cover" /><span v-else class="text-2xl">🍽️</span></div>
                <div class="p-3"><p class="line-clamp-1 text-[14px] font-bold">{{ r.name }}</p><p class="mt-0.5 text-[14px] font-extrabold">{{ formatNaira(r.priceNaira) }}</p></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
