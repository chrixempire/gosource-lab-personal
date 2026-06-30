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
const ACCENT = '#2C8440';
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

// Single-unit card helpers (default = first unit).
function addCard(p: MarketProduct, n = 1) { const u = designLabUnits(p)[0]; if (u) cart.add(p.id, u.name, u.priceNaira, n); }
function setCard(p: MarketProduct, n: number) { const u = designLabUnits(p)[0]; if (u) cart.setQty(p.id, u.name, u.priceNaira, n); }
function qtyCard(p: MarketProduct) { const u = designLabUnits(p)[0]; return u ? cart.qtyOf(p.id, u.name) : 0; }

const related = computed(() => props.products.filter((x) => x.id !== pdp.value?.id).slice(0, 6));
const font = 'font-family:"Sharp Grotesk",Inter,Arial,sans-serif';
</script>

<template>
  <div :style="font" class="rounded-xl bg-[#FFF9EA] p-4 text-[#2C2C2C]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in products" :key="p.id" class="rounded-[10px] border bg-white p-3" :class="cart.qtyOfProduct(p.id) ? 'ring-1 ring-[#2C8440] border-[#2C8440]' : 'border-[#E4E2E4]'">
        <div class="relative">
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
        </div>
        <p class="mt-2 text-[13px] text-[#6B6B66]">{{ p.brandLabel || p.categoryName }}</p>
        <p class="line-clamp-2 cursor-pointer text-[15px] font-bold leading-tight" @click="openModal(p)">{{ p.name }}<span class="font-normal text-[#6B6B66]"> · {{ p.unit }}</span></p>
        <div class="mt-1 flex items-baseline gap-2">
          <span class="text-[17px] font-bold">{{ formatNaira(p.priceNaira) }}</span>
          <span v-if="p.compareAtNaira" class="text-[12px] text-[#9CA3AF] line-through">{{ formatNaira(p.compareAtNaira) }}</span>
          <span v-if="p.discountPct" class="text-[12px] font-semibold text-[#9CA3AF]">−{{ p.discountPct }}%</span>
        </div>
        <DesignLabAddControl :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)" :accent="ACCENT" :fg="FG" variant="pill" :outline="false" :multi-unit="designLabIsMultiUnit(p)" @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)" class="mt-2" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[420px] rounded-2xl bg-white p-6 text-[#2C2C2C] shadow-2xl">
          <button class="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full hover:bg-[#FFF9EA]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#FFF9EA] p-3"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span></div>
          <p class="mt-3 text-[13px] text-[#6B6B66]">{{ selected.brandLabel || selected.categoryName }}</p>
          <h3 class="text-[18px] font-bold leading-tight">{{ selected.name }}<span class="font-normal text-[#6B6B66]"> · {{ selected.unit }}</span></h3>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[22px] font-bold">{{ formatNaira(selPrice) }}</span>
            <span v-if="selected.compareAtNaira" class="text-[13px] text-[#9CA3AF] line-through">{{ formatNaira(selected.compareAtNaira) }}</span>
          </div>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <div class="mt-4 flex items-center gap-3">
            <div class="flex items-center gap-3 rounded-full bg-[#2C8440] px-2 py-1.5 text-white">
              <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-4" :stroke-width="3" /></button>
              <input type="number" min="1" :value="qty" class="w-9 bg-transparent text-center text-[15px] font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
              <button @click="qty++"><Plus class="size-4" :stroke-width="3" /></button>
            </div>
            <button class="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2C8440] py-3 text-[15px] font-bold text-white hover:bg-[#246e35]" @click="addFromModal"><Check v-if="added" class="size-4" />{{ added ? 'Added to cart' : 'Add to cart' }}</button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#2C8440] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-[#FFF9EA] text-[#2C2C2C]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#E4E2E4] bg-[#FFF9EA] px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#2C8440]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[980px] px-4 py-8">
          <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white p-8"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <p class="text-[13px] text-[#6B6B66]">{{ pdp.brandLabel || pdp.categoryName }}</p>
              <h1 class="text-[28px] font-bold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#6B6B66]">{{ pdp.unit }}</p>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-[26px] font-bold">{{ formatNaira(selPrice) }}</span>
                <span v-if="pdp.compareAtNaira" class="text-[14px] text-[#9CA3AF] line-through">{{ formatNaira(pdp.compareAtNaira) }}</span>
              </div>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-6 flex items-center gap-3">
                <div class="flex items-center gap-3 rounded-full bg-[#2C8440] px-3 py-2 text-white">
                  <button @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                  <input type="number" min="1" :value="qty" class="w-10 bg-transparent text-center font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" @change="qty = Math.max(1, Math.round(+($event.target as HTMLInputElement).value || 1))" />
                  <button @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
                </div>
                <button class="flex-1 rounded-full bg-[#2C8440] py-3.5 text-[16px] font-bold text-white hover:bg-[#246e35]" @click="addFromPdp">Add to cart</button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{ color: ACCENT }">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-7 divide-y divide-[#E4E2E4] border-y border-[#E4E2E4]">
                <details class="py-3.5" open><summary class="cursor-pointer text-[15px] font-bold">Details</summary><p class="mt-2 text-[14px] text-[#6B6B66]">{{ pdp.description || 'Rescued, organic, and great value.' }}</p></details>
              </div>
            </div>
          </div>
          <section class="mt-12">
            <h2 class="text-[20px] font-bold">More to love</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[10px] border border-[#E4E2E4] bg-white p-2">
                <div class="flex aspect-square items-center justify-center overflow-hidden bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
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
