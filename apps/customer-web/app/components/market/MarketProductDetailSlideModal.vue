<!-- Active market product add/details panel (right slide-in). Legacy dialog: MarketProductAddModal.vue -->
<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import {
  effectiveUnitChoices,
  getMarketUnitChoice,
  hasUnitSalePrice,
  isMarketProductInStock,
} from '~/lib/marketplace-data';
import {
  Button,
  RadioGroup,
  RadioGroupItem,
} from '@gosource/ui';
import { ClipboardList, X } from 'lucide-vue-next';
import { useAddToList } from '~/composables/useAddToList';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import MarketProductDetailCartActions from '~/components/market/MarketProductDetailCartActions.vue';
import MarketProductLineTotal from '~/components/market/MarketProductLineTotal.vue';
import MarketProductImage from '~/components/market/MarketProductImage.vue';

const props = defineProps<{
  open: boolean;
  product: MarketProduct | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { getQtyForUnit } = useMarketplaceCart();
const { openPickerFromProduct } = useAddToList();

const unitChoices = computed(() =>
  props.product ? effectiveUnitChoices(props.product) : [],
);

const selectedUnit = ref('');

watch(
  () => [props.product?.id, unitChoices.value.join('\n')] as const,
  () => {
    const current = props.product;
    if (!current) {
      selectedUnit.value = '';
      return;
    }

    const options = effectiveUnitChoices(current);
    const withQty = options.find((unit) => getQtyForUnit(current.id, unit) > 0);
    selectedUnit.value = withQty ?? options[0] ?? '';
  },
  { immediate: true },
);

watch(unitChoices, (options) => {
  if (options.length && !options.includes(selectedUnit.value)) {
    selectedUnit.value = options[0] ?? '';
  }
});

const selectedLineQty = computed(() =>
  props.product ? getQtyForUnit(props.product.id, selectedUnit.value) : 0,
);

const pickQty = ref(1);

watch(
  () => [props.product?.id, selectedUnit.value, selectedLineQty.value] as const,
  () => {
    const inCart = selectedLineQty.value;
    pickQty.value = Math.max(1, inCart > 0 ? inCart : 1);
  },
  { immediate: true },
);

const inStock = computed(() => isMarketProductInStock(props.product));

const displayUnitChoices = computed(() =>
  props.product
    ? unitChoices.value
        .map((unitName) => getMarketUnitChoice(props.product!, unitName))
        .filter(Boolean)
    : [],
);

const modalTitle = computed(
  () => props.product?.name?.trim() || 'Product',
);

const detailText = computed(
  () =>
    props.product?.longDescription?.trim() ||
    props.product?.description?.trim() ||
    'no description',
);

function close() {
  emit('update:open', false);
}

async function onAddToList() {
  if (!props.product || !inStock.value || !selectedUnit.value) {
    return;
  }

  const opened = await openPickerFromProduct(
    props.product,
    selectedUnit.value,
    selectedLineQty.value > 0 ? selectedLineQty.value : 1,
    { resumeProductModal: true },
  );

  if (opened) {
    close();
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    close();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onEscape);
});

watch(
  () => props.open,
  (isOpen) => {
    if (!import.meta.client) {
      return;
    }

    document.body.style.overflow = isOpen ? 'hidden' : '';
  },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = '';
  }

  window.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-250 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && product"
        class="fixed inset-0 z-[85] customer-modal-overlay backdrop-blur-[2px]"
        aria-hidden="true"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-250 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open && product"
        data-testid="market-product-detail-slide-modal"
        class="fixed right-3 top-[5%] z-[90] flex h-[90dvh] w-[calc(100%-1.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-grey-50 bg-background-on-canvas shadow-[var(--customer-panel-shadow)] transition-colors duration-300 sm:right-4 sm:w-[min(100%-2rem,420px)]"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
        @click.stop
      >
        <header
          class="flex shrink-0 items-center justify-between gap-3 border-b border-grey-50 px-2.5 py-3"
        >
          <h2 class="min-w-0 truncate pr-2 text-base font-semibold tracking-tight text-grey-900 sm:text-lg">
            {{ modalTitle }}
          </h2>
          <button
            type="button"
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-background-on-canvas text-grey-900 transition hover:bg-grey-55"
            aria-label="Close product details"
            @click="close"
          >
            <X class="size-5" />
          </button>
        </header>

        <div class="flex min-h-0 flex-1 flex-col">
          <div
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div class="relative w-full overflow-hidden bg-grey-55">
              <div class="group relative aspect-[4/3] w-full">
                <MarketProductImage
                  :src="product.imageUrl"
                  :alt="product.name"
                  :hover-zoom="true"
                  object-fit="contain"
                  loading="eager"
                  :class="{ 'grayscale opacity-80': !inStock }"
                  logo-class="w-[48%] max-w-[7rem]"
                />
              </div>

              <Button
                v-if="inStock"
                variant="neutral"
                size="small"
                class="!absolute !right-2.5 !top-2.5 !z-10 !h-9 !w-auto !rounded-full !border-grey-50 !bg-background-on-canvas/95 !px-3.5 !text-sm !font-semibold !shadow-[var(--customer-card-shadow)] backdrop-blur-sm"
                type="button"
                :left-icon="ClipboardList"
                @click="onAddToList"
              >
                Add to list
              </Button>
            </div>

            <div class="px-2.5 pb-8 pt-2.5">
            <section class="space-y-2">
              <h3 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-grey-300">
                Product details
              </h3>
              <p class="line-clamp-3 text-[15px] leading-6 text-grey-text">
                {{ detailText }}
              </p>
              <NuxtLink
                :to="`/market/product/${product.id}`"
                class="inline-block text-sm font-semibold text-primary-500 underline-offset-2 hover:underline"
                @click="close"
              >
                View full page
              </NuxtLink>
            </section>

            <section class="mt-5 space-y-2.5">
              <h3 class="text-[11px] font-semibold uppercase tracking-[0.14em] text-grey-300">
                Select preferred unit
              </h3>

              <RadioGroup
                v-model="selectedUnit"
                :name="`market-slide-unit-${product.id}`"
                class="flex w-full flex-col gap-2"
              >
                <label
                  v-for="opt in displayUnitChoices"
                  :key="opt!.name"
                  :class="[
                    'flex w-full cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-3 transition-colors',
                    selectedUnit === opt!.name
                      ? 'border-primary-500 bg-primary-50/80 dark:border-primary-500/45 dark:bg-primary-500/12'
                      : 'border-grey-50 bg-background-on-canvas hover:border-primary-300/60 hover:bg-primary-50/30 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/8',
                  ]"
                >
                  <RadioGroupItem :value="opt!.name" />
                  <span class="min-w-0 flex-1 text-[15px] font-medium capitalize text-grey-900">
                    {{ opt!.name }}
                  </span>
                  <span class="shrink-0 text-right text-[13px] font-semibold tabular-nums">
                    <span
                      v-if="hasUnitSalePrice(opt!)"
                      class="text-grey-300 line-through"
                    >
                      {{ formatNaira(opt!.priceNaira) }}
                    </span>
                    <span
                      :class="[
                        hasUnitSalePrice(opt!) ? 'ml-1.5' : '',
                        selectedUnit === opt!.name
                          ? 'text-primary-600'
                          : 'text-grey-900',
                      ]"
                    >
                      {{
                        formatNaira(
                          hasUnitSalePrice(opt!)
                            ? opt!.discountedPriceNaira!
                            : opt!.priceNaira,
                        )
                      }}
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </section>
            </div>
          </div>

          <div
            v-if="inStock"
            class="shrink-0 bg-background-on-canvas px-3 pb-2 pt-0 transition-colors duration-300"
          >
            <MarketProductLineTotal
              :product="product"
              :unit="selectedUnit"
              :quantity="pickQty"
            />
          </div>

          <footer
            class="shrink-0 border-t border-grey-50 bg-background-on-canvas p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-colors duration-300"
          >
            <template v-if="inStock">
              <MarketProductDetailCartActions
                v-model:quantity="pickQty"
                :product="product"
                :unit="selectedUnit"
                :in-stock="inStock"
                expand-add-button
                close-on-success
                class="w-full min-w-0"
                @close="close"
              />
            </template>
            <Button
              v-else
              size="large"
              variant="destructive"
              class="!h-14 w-full !rounded-full !text-base !font-semibold"
              type="button"
              disabled
            >
              Out of stock
            </Button>
          </footer>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
