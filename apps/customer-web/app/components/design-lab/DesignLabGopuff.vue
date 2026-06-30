<script setup lang="ts">
import { Minus, Plus, X, ChevronLeft, Zap, Check } from 'lucide-vue-next';
import type { MarketProduct } from '~/lib/marketplace-data';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { useDesignLabCart } from '~/composables/useDesignLabCart';
import { designLabUnits, designLabIsMultiUnit } from '~/lib/design-lab';
import DesignLabAddControl from '~/components/design-lab/DesignLabAddControl.vue';
import DesignLabCartBar from '~/components/design-lab/DesignLabCartBar.vue';
import DesignLabUnitPicker from '~/components/design-lab/DesignLabUnitPicker.vue';

const props = defineProps<{ products: MarketProduct[] }>();
const cart = useDesignLabCart();
const ACCENT = '#00A4FF'; const FG = '#ffffff';
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
const font = 'font-family:Inter,"Helvetica Neue",system-ui,sans-serif';
</script>

<template>
  <div :style="font" class="text-[#1A1A1A]">
    <DesignLabCartBar :count="cart.count.value" :total="cart.total.value" :accent="ACCENT" :fg="FG" />
    <div class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#E5F6FF] px-3 py-1.5 text-[13px] font-bold text-[#00A4FF]"><Zap class="size-4 fill-[#00A4FF]" /> Delivery in 15 min</div>
    <!-- GRID -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="p in products" :key="p.id" class="rounded-[12px] bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)]" :class="cart.qtyOfProduct(p.id) ? 'ring-1 ring-[#00A4FF] border-[#00A4FF]' : ''">
        <div class="relative">
          <span v-if="p.discountPct" class="absolute left-0 top-0 z-10 rounded-md bg-[#E4002B] px-1.5 py-0.5 text-[11px] font-bold text-white">-{{ p.discountPct }}%</span>
          <div class="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md bg-white" @click="openModal(p)">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="h-full w-full object-contain" /><span v-else class="text-4xl">🛒</span>
          </div>
          <div class="absolute bottom-0 right-0">
            <DesignLabAddControl
              :qty="designLabIsMultiUnit(p) ? cart.qtyOfProduct(p.id) : qtyCard(p)"
              :accent="ACCENT" :fg="FG" variant="circle" :multi-unit="designLabIsMultiUnit(p)"
              @inc="addCard(p)" @dec="addCard(p, -1)" @set="setCard(p, $event)" @open="openModal(p)"
            />
          </div>
        </div>
        <p class="mt-2 text-[16px] font-extrabold leading-none" :class="p.discountPct ? 'text-[#00A4FF]' : ''">{{ formatNaira(p.priceNaira) }}</p>
        <p v-if="p.compareAtNaira" class="text-[12px] text-[#6B7280] line-through">{{ formatNaira(p.compareAtNaira) }}</p>
        <p class="mt-1 line-clamp-2 cursor-pointer text-[14px] font-medium leading-tight" @click="openModal(p)">{{ p.name }}</p>
        <p class="mt-0.5 text-[12px] text-[#6B7280]">{{ p.unit }}</p>
      </div>
    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" @click.self="selected = null">
        <div :style="font" class="relative w-full max-w-[440px] rounded-t-2xl bg-white p-5 text-[#1A1A1A] shadow-2xl sm:rounded-2xl">
          <button class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full hover:bg-[#f2f2f2]" @click="selected = null"><X class="size-5" /></button>
          <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#F7F7F7]"><img v-if="selected.imageUrl" :src="selected.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-6xl">🛒</span></div>
          <h3 class="mt-3 text-[17px] font-bold">{{ selected.name }}</h3>
          <p class="text-[13px] text-[#6B7280]">{{ selected.unit }}</p>
          <DesignLabUnitPicker
            v-if="units.length > 1"
            class="mt-4"
            :units="units" :selected="selUnit" :accent="ACCENT"
            :in-cart="(u) => cart.qtyOf(selected!.id, u)"
            @select="selUnit = $event"
          />
          <p class="mt-2 text-[22px] font-extrabold leading-none text-[#00A4FF]">{{ formatNaira(selPrice) }}</p>
          <div class="mt-4 flex items-center gap-2 rounded-full bg-[#00A4FF] p-1.5">
            <button class="flex size-9 items-center justify-center rounded-full text-white hover:bg-white/20" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
            <button class="flex flex-1 items-center justify-center gap-1.5 text-center text-[16px] font-bold text-white" @click="addFromModal"><Check v-if="added" class="size-4" /><span>{{ added ? 'Added to cart' : qty + ' · Add to Cart' }}</span></button>
            <button class="flex size-9 items-center justify-center rounded-full text-white hover:bg-white/20" @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
          </div>
          <button class="mt-3 w-full text-center text-[14px] font-bold text-[#00A4FF] hover:underline" @click="viewFull">View full page →</button>
        </div>
      </div>
    </Teleport>

    <!-- PDP -->
    <Teleport to="body">
      <div v-if="pdp" :style="font" class="fixed inset-0 z-[200] overflow-y-auto bg-white text-[#1A1A1A]">
        <header class="sticky top-0 z-10 flex items-center border-b border-[#ECECEC] bg-white px-4 py-3">
          <button class="flex items-center gap-1 text-[14px] font-bold text-[#00A4FF]" @click="pdp = null"><ChevronLeft class="size-5" /> Back</button>
        </header>
        <div class="mx-auto max-w-[1000px] px-4 py-6">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F7F7F7]"><img v-if="pdp.imageUrl" :src="pdp.imageUrl" class="h-full w-full object-contain p-6" /><span v-else class="text-7xl">🛒</span></div>
            <div>
              <h1 class="text-[24px] font-extrabold leading-tight">{{ pdp.name }}</h1>
              <p class="mt-1 text-[14px] text-[#6B7280]">{{ pdp.unit }}</p>
              <p class="mt-3 text-[30px] font-extrabold leading-none text-[#00A4FF]">{{ formatNaira(selPrice) }}</p>
              <DesignLabUnitPicker
                v-if="units.length > 1"
                class="mt-4"
                :units="units" :selected="selUnit" :accent="ACCENT"
                :in-cart="(u) => cart.qtyOf(pdp!.id, u)"
                @select="selUnit = $event"
              />
              <div class="mt-5 flex items-center gap-2 rounded-full bg-[#00A4FF] p-1.5">
                <button class="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/20" @click="qty = Math.max(1, qty - 1)"><Minus class="size-5" :stroke-width="3" /></button>
                <button class="flex-1 text-center text-[16px] font-bold text-white" @click="addFromPdp">{{ qty }} · Add to Cart</button>
                <button class="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/20" @click="qty++"><Plus class="size-5" :stroke-width="3" /></button>
              </div>
              <p v-if="cart.qtyOfProduct(pdp.id)" class="mt-2 text-[13px] font-semibold" :style="{color: ACCENT}">✓ {{ cart.qtyOfProduct(pdp.id) }} in cart</p>
              <div class="mt-6 divide-y divide-[#ECECEC] border-y border-[#ECECEC]">
                <details class="py-3" open><summary class="cursor-pointer text-[15px] font-bold">Product details</summary><p class="mt-2 text-[14px] text-[#6B7280]">{{ pdp.description || 'Delivered in minutes by Gopuff.' }}</p></details>
              </div>
            </div>
          </div>
          <section class="mt-10">
            <h2 class="text-[18px] font-extrabold">You might also like</h2>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div v-for="r in related" :key="r.id" class="rounded-[12px] bg-white p-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded bg-white"><img v-if="r.imageUrl" :src="r.imageUrl" class="h-full w-full object-contain" /><span v-else class="text-2xl">🛒</span></div>
                <p class="mt-1 text-[13px] font-extrabold text-[#00A4FF]">{{ formatNaira(r.priceNaira) }}</p>
                <p class="line-clamp-1 text-[12px] font-medium">{{ r.name }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Teleport>
  </div>
</template>
