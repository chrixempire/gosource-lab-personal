<script setup lang="ts">
import type { MarketCategory } from "~/lib/marketplace-data";
import { Input } from "@gosource/ui";
import OrderFilterPopover from "~/components/orders/OrderFilterPopover.vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import {
  ALL_EXPLORE_CATEGORIES_ID,
  exploreCategoryDotColor,
} from "~/lib/explore-catalog-filters";
import {
  formatNairaAmountInput,
  parseNairaAmountInput,
} from "~/lib/wallet-display";

const props = defineProps<{
  categories: MarketCategory[];
  activeCategoryId: string;
  inStockOnly: boolean;
  priceMin: number | null;
  priceMax: number | null;
}>();

const emit = defineEmits<{
  "select-category": [categoryId: string];
  "update:inStockOnly": [value: boolean];
  "apply-price": [
    payload: { priceMin: number | null; priceMax: number | null },
  ];
}>();

const priceOpen = ref(false);
const draftPriceMin = ref("");
const draftPriceMax = ref("");

const priceActive = computed(
  () => props.priceMin != null || props.priceMax != null,
);

const activePillClass =
  "bg-primary-500 text-white shadow-[0_4px_14px_-6px_rgba(4,85,11,0.45)]";
const inactiveChipClass = "text-grey-800 hover:bg-grey-55";

function syncPriceDraft() {
  draftPriceMin.value =
    props.priceMin != null
      ? formatNairaAmountInput(String(props.priceMin))
      : "";
  draftPriceMax.value =
    props.priceMax != null
      ? formatNairaAmountInput(String(props.priceMax))
      : "";
}

watch(
  () => [props.priceMin, props.priceMax] as const,
  () => syncPriceDraft(),
  { immediate: true },
);

function openPrice() {
  syncPriceDraft();
  priceOpen.value = true;
}

function onDraftPriceMinInput(value: string) {
  draftPriceMin.value = formatNairaAmountInput(value);
}

function onDraftPriceMaxInput(value: string) {
  draftPriceMax.value = formatNairaAmountInput(value);
}

function applyPrice() {
  const minRaw = draftPriceMin.value.trim()
    ? parseNairaAmountInput(draftPriceMin.value)
    : Number.NaN;
  const maxRaw = draftPriceMax.value.trim()
    ? parseNairaAmountInput(draftPriceMax.value)
    : Number.NaN;
  emit("apply-price", {
    priceMin: Number.isFinite(minRaw) ? minRaw : null,
    priceMax: Number.isFinite(maxRaw) ? maxRaw : null,
  });
}

function clearPrice() {
  draftPriceMin.value = "";
  draftPriceMax.value = "";
  emit("apply-price", { priceMin: null, priceMax: null });
}

function toggleInStock() {
  emit("update:inStockOnly", !props.inStockOnly);
}

function selectCategory(categoryId: string) {
  emit("select-category", categoryId);
}

function isCategoryActive(categoryId: string) {
  return props.activeCategoryId === categoryId;
}

function categoryChipClass(categoryId: string) {
  return [
    "shrink-0 cursor-pointer rounded-full text-sm font-semibold transition",
    isCategoryActive(categoryId) ? activePillClass : inactiveChipClass,
  ];
}

const scrollerRef = ref<HTMLElement | null>(null);
const chipRefs = new Map<string, HTMLElement>();

const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const canScrollCategories = computed(
  () => canScrollLeft.value || canScrollRight.value,
);

function setChipRef(
  categoryId: string,
  element: Element | ComponentPublicInstance | null,
) {
  if (element instanceof HTMLElement) {
    chipRefs.set(categoryId, element);
    return;
  }

  chipRefs.delete(categoryId);
}

function scrollActiveChipIntoView(categoryId: string) {
  const scroller = scrollerRef.value;
  const chip = chipRefs.get(categoryId);

  if (!scroller || !chip) {
    return;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const chipRect = chip.getBoundingClientRect();
  const edgePadding = 12;

  if (
    chipRect.left >= scrollerRect.left + edgePadding &&
    chipRect.right <= scrollerRect.right - edgePadding
  ) {
    return;
  }

  const nextLeft =
    chip.offsetLeft - scroller.clientWidth / 2 + chip.offsetWidth / 2;

  scroller.scrollTo({
    left: Math.max(0, nextLeft),
    behavior: "smooth",
  });
}

function updateScrollButtons() {
  const scroller = scrollerRef.value;
  if (!scroller) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const maxScrollLeft = Math.max(
    0,
    scroller.scrollWidth - scroller.clientWidth,
  );
  const nextLeft = scroller.scrollLeft;

  canScrollLeft.value = nextLeft > 1;
  canScrollRight.value = nextLeft < maxScrollLeft - 1;
}

function scrollByDirection(direction: -1 | 1) {
  const scroller = scrollerRef.value;
  if (!scroller) {
    return;
  }

  const amount = Math.max(160, Math.floor(scroller.clientWidth * 0.7));
  scroller.scrollTo({
    left: scroller.scrollLeft + direction * amount,
    behavior: "smooth",
  });
}

let attachedScrollListeners = false;
onMounted(() => {
  if (attachedScrollListeners) return;
  attachedScrollListeners = true;

  nextTick(() => {
    updateScrollButtons();
    const scroller = scrollerRef.value;
    if (!scroller) return;

    scroller.addEventListener(
      "scroll",
      () => {
        updateScrollButtons();
      },
      { passive: true },
    );

    window.addEventListener(
      "resize",
      () => {
        updateScrollButtons();
      },
      { passive: true },
    );
  });
});

watch(
  () => props.activeCategoryId,
  (categoryId) => {
    nextTick(() => scrollActiveChipIntoView(categoryId));
    nextTick(() => updateScrollButtons());
  },
);

watch(
  () => props.categories.map((category) => category.id).join(","),
  () => {
    nextTick(() => scrollActiveChipIntoView(props.activeCategoryId));
    nextTick(() => updateScrollButtons());
  },
);
</script>

<template>
  <div
    data-testid="explore-category-filter-bar"
    class="sticky top-0 z-30 -mx-4 border-b border-grey-50 bg-background-on-canvas px-4 py-2.5 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.08)] sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
  >
    <div
      class="flex w-full min-w-0 items-center"
      :class="canScrollCategories ? 'gap-2' : ''"
    >
      <button
        v-if="canScrollCategories"
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
        :disabled="!canScrollLeft"
        aria-label="Scroll categories left"
        @click="scrollByDirection(-1)"
      >
        <ChevronLeft class="size-5" aria-hidden="true" />
      </button>

      <div
        ref="scrollerRef"
        class="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        <div class="flex shrink-0 items-center gap-2">
          <button
            :ref="(el) => setChipRef(ALL_EXPLORE_CATEGORIES_ID, el)"
            type="button"
            :class="[categoryChipClass(ALL_EXPLORE_CATEGORIES_ID), 'px-4 py-2']"
            :aria-current="
              isCategoryActive(ALL_EXPLORE_CATEGORIES_ID) ? 'true' : undefined
            "
            @click="selectCategory(ALL_EXPLORE_CATEGORIES_ID)"
          >
            All categories
          </button>

          <button
            v-for="(category, index) in categories"
            :key="category.id"
            :ref="(el) => setChipRef(category.id, el)"
            type="button"
            :class="[
              categoryChipClass(category.id),
              'flex items-center gap-2 px-3 py-2 font-medium',
              isCategoryActive(category.id) ? '!font-semibold' : '',
            ]"
            :aria-current="isCategoryActive(category.id) ? 'true' : undefined"
            @click="selectCategory(category.id)"
          >
            <span
              v-if="!isCategoryActive(category.id)"
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: exploreCategoryDotColor(index) }"
              aria-hidden="true"
            />
            <span class="whitespace-nowrap">{{ category.title }}</span>
          </button>
        </div>

        <div class="h-8 w-px shrink-0 bg-grey-100" aria-hidden="true" />

        <div class="flex shrink-0 items-center gap-2 pr-1">
          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition"
            :class="
              inStockOnly
                ? 'border-primary-500 bg-primary-500 text-white shadow-[0_4px_14px_-6px_rgba(4,85,11,0.45)]'
                : 'border-grey-50 bg-white text-grey-800 hover:border-primary-300 hover:bg-grey-55'
            "
            :aria-pressed="inStockOnly"
            @click="toggleInStock"
          >
            In stock only
          </button>

          <OrderFilterPopover
            v-model:open="priceOpen"
            label="Price"
            :active="priceActive"
            @apply="applyPrice"
            @clear="clearPrice"
            @update:open="(value) => value && openPrice()"
          >
            <div class="grid gap-3">
              <label class="grid gap-1.5 text-sm text-grey-700">
                <span class="font-medium">Minimum</span>
                <Input
                  :model-value="draftPriceMin"
                  inputmode="numeric"
                  placeholder="0"
                  @update:model-value="onDraftPriceMinInput"
                />
              </label>
              <label class="grid gap-1.5 text-sm text-grey-700">
                <span class="font-medium">Maximum</span>
                <Input
                  :model-value="draftPriceMax"
                  inputmode="numeric"
                  placeholder="Any"
                  @update:model-value="onDraftPriceMaxInput"
                />
              </label>
            </div>
          </OrderFilterPopover>
        </div>
      </div>

      <button
        v-if="canScrollCategories"
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 shadow-sm transition hover:bg-primary-50/70 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-grey-900"
        :disabled="!canScrollRight"
        aria-label="Scroll categories right"
        @click="scrollByDirection(1)"
      >
        <ChevronRight class="size-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
