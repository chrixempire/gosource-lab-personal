<script setup lang="ts">
import type { MarketCategory } from "~/lib/marketplace-data";
import { Input } from "@gosource/ui";
import OrderFilterPopover from "~/components/orders/OrderFilterPopover.vue";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import {
  ALL_EXPLORE_CATEGORIES_ID,
  EXPLORE_CATEGORY_FILTER_STICKY_CLASS,
} from "~/lib/explore-catalog-filters";
import {
  formatNairaAmountInput,
  parseNairaAmountInput,
} from "~/lib/wallet-display";

const props = withDefaults(
  defineProps<{
    categories: MarketCategory[];
    activeCategoryId: string;
    inStockOnly?: boolean;
    priceMin?: number | null;
    priceMax?: number | null;
    /** Hide the in-stock/price filter cluster so the bar is a pure category rail. */
    hideFilters?: boolean;
  }>(),
  {
    inStockOnly: false,
    priceMin: null,
    priceMax: null,
    hideFilters: false,
  },
);

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
  "bg-primary-500 text-white shadow-[0_4px_14px_-6px_rgba(15,92,24,0.45)] dark:bg-primary-500/22 dark:text-[#86efac] dark:shadow-none dark:ring-1 dark:ring-primary-500/35";
const categoryLabelClass =
  "block w-full overflow-hidden text-ellipsis whitespace-nowrap text-center font-['Inter'] text-xs font-medium not-italic leading-[18px] tracking-[0.1px] text-[#344054]";
const failedCategoryImages = ref<Set<string>>(new Set());

function categoryHasImage(category: MarketCategory) {
  return Boolean(
    category.imageUrl && !failedCategoryImages.value.has(category.id),
  );
}

function markCategoryImageFailed(categoryId: string) {
  const next = new Set(failedCategoryImages.value);
  next.add(categoryId);
  failedCategoryImages.value = next;
}

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
    "group flex w-[88px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-xl p-1.5 text-center transition sm:w-[104px]",
    isCategoryActive(categoryId)
      ? "bg-primary-50/80 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300"
      : "text-grey-700 hover:bg-grey-50 dark:text-grey-200 dark:hover:bg-white/5",
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
    :class="EXPLORE_CATEGORY_FILTER_STICKY_CLASS"
  >
    <div
      class="flex w-full min-w-0 items-center"
      :class="canScrollCategories ? 'gap-2' : ''"
    >
      <button
        v-if="canScrollCategories"
        type="button"
        class="customer-control-btn flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm"
        :disabled="!canScrollLeft"
        aria-label="Scroll categories left"
        @click="scrollByDirection(-1)"
      >
        <ChevronLeft class="size-5" aria-hidden="true" />
      </button>

      <div
        ref="scrollerRef"
        class="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        <div class="flex shrink-0 items-start gap-1">
          <button
            :ref="(el) => setChipRef(ALL_EXPLORE_CATEGORIES_ID, el)"
            type="button"
            :class="categoryChipClass(ALL_EXPLORE_CATEGORIES_ID)"
            :aria-current="
              isCategoryActive(ALL_EXPLORE_CATEGORIES_ID) ? 'true' : undefined
            "
            @click="selectCategory(ALL_EXPLORE_CATEGORIES_ID)"
          >
            <span
              class="flex size-[18px] items-center justify-center text-[18px] leading-none"
              aria-hidden="true"
            >
              🛒
            </span>
            <span :class="categoryLabelClass">
              All categories
            </span>
          </button>

          <button
            v-for="category in categories"
            :key="category.id"
            :ref="(el) => setChipRef(category.id, el)"
            type="button"
            :class="categoryChipClass(category.id)"
            :aria-current="isCategoryActive(category.id) ? 'true' : undefined"
            :title="category.title"
            @click="selectCategory(category.id)"
          >
            <span
              class="flex size-[18px] items-center justify-center overflow-hidden"
              aria-hidden="true"
            >
              <img
                v-if="categoryHasImage(category)"
                :src="category.imageUrl"
                :alt="category.title"
                class="size-full object-contain transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                @error="markCategoryImageFailed(category.id)"
              >
              <span v-else class="text-[18px] leading-none">
                {{ category.emoji || '🛒' }}
              </span>
            </span>
            <span :class="categoryLabelClass">
              {{ category.title }}
            </span>
          </button>
        </div>

        <div
          v-if="!hideFilters"
          class="h-fit w-px shrink-0 bg-grey-100"
          aria-hidden="true"
        />

        <div v-if="!hideFilters" class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="shrink-0 cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition"
            :class="
              inStockOnly
                ? activePillClass + ' border-primary-500'
                : 'border-grey-50 bg-background-on-canvas text-grey-300 customer-sidebar-nav-hover hover:border-primary-300'
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
              <label class="grid gap-1.5 text-sm text-grey-text">
                <span class="font-medium">Minimum</span>
                <Input
                  :model-value="draftPriceMin"
                  inputmode="numeric"
                  placeholder="0"
                  @update:model-value="onDraftPriceMinInput"
                />
              </label>
              <label class="grid gap-1.5 text-sm text-grey-text">
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
        class="customer-control-btn flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm"
        :disabled="!canScrollRight"
        aria-label="Scroll categories right"
        @click="scrollByDirection(1)"
      >
        <ChevronRight class="size-5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
