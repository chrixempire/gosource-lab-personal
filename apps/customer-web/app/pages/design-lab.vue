<script setup lang="ts">
import { PLATFORMS } from '~/lib/design-lab';
import { useDesignLabProducts } from '~/composables/useDesignLabProducts';
import DesignLabInstacart from '~/components/design-lab/DesignLabInstacart.vue';
import DesignLabGopuff from '~/components/design-lab/DesignLabGopuff.vue';
import DesignLabGetir from '~/components/design-lab/DesignLabGetir.vue';
import DesignLabGorillas from '~/components/design-lab/DesignLabGorillas.vue';
import DesignLabWeee from '~/components/design-lab/DesignLabWeee.vue';
import DesignLabOda from '~/components/design-lab/DesignLabOda.vue';
import DesignLabAmazonfresh from '~/components/design-lab/DesignLabAmazonfresh.vue';
import DesignLabThrive from '~/components/design-lab/DesignLabThrive.vue';
import DesignLabMisfits from '~/components/design-lab/DesignLabMisfits.vue';
import DesignLabChoco from '~/components/design-lab/DesignLabChoco.vue';
import DesignLabOcado from '~/components/design-lab/DesignLabOcado.vue';
import DesignLabFlink from '~/components/design-lab/DesignLabFlink.vue';
import DesignLabSprouts from '~/components/design-lab/DesignLabSprouts.vue';
import DesignLabHellofresh from '~/components/design-lab/DesignLabHellofresh.vue';
import DesignLabJumia from '~/components/design-lab/DesignLabJumia.vue';

definePageMeta({ layout: false });
useHead({ title: 'Food Storefront Design Lab' });

const REGISTRY: Record<string, unknown> = {
  instacart: DesignLabInstacart,
  gopuff: DesignLabGopuff,
  getir: DesignLabGetir,
  gorillas: DesignLabGorillas,
  weee: DesignLabWeee,
  oda: DesignLabOda,
  amazonfresh: DesignLabAmazonfresh,
  thrive: DesignLabThrive,
  misfits: DesignLabMisfits,
  choco: DesignLabChoco,
  ocado: DesignLabOcado,
  flink: DesignLabFlink,
  sprouts: DesignLabSprouts,
  hellofresh: DesignLabHellofresh,
  jumia: DesignLabJumia,
};

const { products, loading, usingFallback } = useDesignLabProducts(15);

const activeId = ref('instacart');
const activePlatform = computed(
  () => PLATFORMS.find((p) => p.id === activeId.value) ?? PLATFORMS[0]!,
);
const activeComponent = computed(() => REGISTRY[activeId.value]);
</script>

<template>
  <div class="min-h-screen bg-[#0F1115] text-white">
    <header class="sticky top-0 z-30 border-b border-white/10 bg-[#0F1115]/95 backdrop-blur">
      <div class="mx-auto max-w-[1320px] px-4 py-4 sm:px-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-[20px] font-semibold tracking-tight">Food Storefront Design Lab</h1>
            <p class="text-[13px] text-white/50">
              Real GoSource products rendered in the style of award-winning grocery &amp; B2B food platforms.
              Click <span class="font-semibold text-white">Add</span> on any product → quick-view modal →
              <span class="font-semibold text-white">View full page</span> → product detail page.
            </p>
          </div>
          <span
            v-if="!loading"
            class="rounded-full px-3 py-1 text-[12px] font-medium"
            :class="usingFallback ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300'"
          >
            {{ usingFallback ? 'Sample food data' : `Live GoSource · ${products.length} products` }}
          </span>
        </div>

        <div class="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            v-for="pf in PLATFORMS"
            :key="pf.id"
            class="flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition"
            :class="activeId === pf.id ? 'border-white bg-white text-[#0F1115]' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'"
            @click="activeId = pf.id"
          >
            <span class="size-2.5 rounded-full" :style="{ background: pf.accent }" />
            {{ pf.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1320px] px-4 py-6 sm:px-6">
      <p class="mb-3 text-[14px] text-white/70">
        <span class="font-semibold text-white">{{ activePlatform.label }}</span>
        <span class="mx-2 text-white/30">·</span>{{ activePlatform.note }}
      </p>

      <div class="rounded-[14px] border border-white/10 bg-white p-4 shadow-2xl sm:p-6">
        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div v-for="i in 10" :key="i" class="aspect-[3/4] animate-pulse rounded-lg bg-grey-100" />
        </div>
        <component :is="activeComponent" v-else :key="activeId" :products="products" />
      </div>

      <p class="mt-4 text-center text-[12px] text-white/30">
        Designs reproduce each platform's palette, typography, card/stepper, modal &amp; PDP patterns. Product data is live from GoSource (falls back to sample food items if the catalog isn't reachable).
      </p>
    </main>
  </div>
</template>
