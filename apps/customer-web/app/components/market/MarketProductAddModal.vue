<script setup lang="ts">
import type { MarketProduct } from '~/lib/marketplace-data';
import { effectiveUnitChoices, getMarketUnitChoice, isMarketProductInStock } from '~/lib/marketplace-data';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  RadioGroup,
  RadioGroupItem,
} from '@gosource/ui';
import { useAddToList } from '~/composables/useAddToList';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { ClipboardList } from 'lucide-vue-next';
import MarketProductDetailCartActions from './MarketProductDetailCartActions.vue';
import MarketProductLineTotal from './MarketProductLineTotal.vue';
import MarketProductImage from './MarketProductImage.vue';

const props = defineProps<{
  open: boolean;
  product: MarketProduct | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

function onDialogOpen(value: boolean) {
  emit('update:open', value);
}

const { getQtyForUnit } = useMarketplaceCart();
const { openPickerFromProduct } = useAddToList();

const unitChoices = computed(() => (props.product ? effectiveUnitChoices(props.product) : []));

const selectedUnit = ref('');

watch(
  () => [props.product?.id, unitChoices.value.join('\n')] as const,
  () => {
    const p = props.product;
    if (!p) {
      selectedUnit.value = '';
      return;
    }
    const opts = effectiveUnitChoices(p);
    const withQty = opts.find((u) => getQtyForUnit(p.id, u) > 0);
    selectedUnit.value = withQty ?? opts[0] ?? '';
  },
  { immediate: true },
);

watch(unitChoices, (opts) => {
  if (opts.length && !opts.includes(selectedUnit.value)) {
    selectedUnit.value = opts[0] ?? '';
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
    ? unitChoices.value.map((unitName) => getMarketUnitChoice(props.product!, unitName)).filter(Boolean)
    : [],
);

function close() {
  onDialogOpen(false);
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

const detailText = computed(() => props.product?.longDescription ?? props.product?.description ?? '');
</script>

<template>
  <Dialog :open="open && Boolean(product)" @update:open="onDialogOpen">
    <DialogContent
      class="z-100 flex max-h-[min(92dvh,46rem)] w-[min(96vw,700px)] max-w-[700px] flex-col overflow-hidden p-0 sm:rounded-[28px]"
    >
      <DialogHeader class="relative shrink-0 border-b border-grey-50/80 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
        <DialogClose class="absolute right-3 top-3 sm:right-4 sm:top-4" />
        <DialogTitle class="pr-10 text-left text-xl font-semibold text-grey-900 sm:text-2xl">
          {{ product?.name }}
        </DialogTitle>
      </DialogHeader>

      <DialogBody
        v-if="product"
        class="min-h-0 flex-1 px-4 pb-4 pt-1 sm:px-6 sm:pb-6 sm:pt-2 lg:pb-6"
      >
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          <div
            class="mx-auto w-full shrink-0 rounded-[22px] border-2 border-transparent p-1 max-lg:flex max-lg:justify-center lg:mx-0 lg:w-[min(40%,280px)]"
          >
            <div
              class="group relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[18px] bg-grey-55 lg:max-w-none"
            >
              <MarketProductImage
                :src="product.imageUrl"
                :alt="product.name"
                :hover-zoom="true"
                :class="{ grayscale: !inStock }"
              />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-5">
            <div class="flex w-full items-center justify-between gap-3">
              <p v-if="product.brandLabel" class="min-w-0 text-[15px] leading-snug text-grey-300">
                Brand:
                <span class="font-semibold text-red-500">{{ product.brandLabel }}</span>
              </p>
              <span v-else class="min-w-0 flex-1" />
              <Button
                v-if="inStock"
                variant="neutral"
                size="small"
                class="!w-fit shrink-0 rounded-full!"
                type="button"
                :left-icon="ClipboardList"
                @click="onAddToList"
              >
                Add to list
              </Button>
            </div>

            <div class="w-full max-w-full space-y-2 lg:max-w-[80%]">
              <h3 class="text-[12px] font-semibold uppercase tracking-[0.14em] text-grey-300">
                Product details
              </h3>
              <p class="line-clamp-3 text-[15px] leading-7 text-grey-text">
                {{ detailText }}
              </p>
              <NuxtLink
                :to="`/market/product/${product.id}`"
                class="inline font-semibold text-primary-500 underline-offset-2 hover:underline"
                @click="close"
              >
                View full page
              </NuxtLink>
            </div>

            <div class="flex w-full min-w-0 flex-col gap-3">
              <section class="w-full min-w-0 space-y-1.5">
                <h3 class="text-[12px] font-semibold uppercase tracking-[0.14em] text-grey-300">
                  Select preferred unit
                </h3>
                <RadioGroup v-model="selectedUnit" :name="`market-unit-${product.id}`" class="flex w-full flex-col gap-1.5">
                  <label
                    v-for="opt in displayUnitChoices"
                    :key="opt!.name"
                    :class="[
                      'flex w-full cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors',
                      selectedUnit === opt!.name
                        ? 'border-primary-500 bg-primary-50/70 hover:border-primary-500 hover:bg-primary-50/70'
                        : 'border-grey-50 bg-grey-55/40 hover:border-primary-500/40 hover:bg-primary-50/40',
                    ]"
                  >
                    <RadioGroupItem :value="opt!.name" />
                    <span class="min-w-0 flex-1 text-[15px] font-medium capitalize text-grey-900">
                      {{ opt!.name }}
                    </span>
                    <span
                      :class="[
                        'shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-grey-900',
                        selectedUnit === opt!.name ? 'bg-transparent' : 'bg-grey-55',
                      ]"
                    >
                      <span v-if="opt!.measure">1{{ opt!.measure }} = </span>
                      <span :class="{ 'line-through text-grey-300': opt!.discountedPriceNaira }">
                        {{ formatNaira(opt!.priceNaira) }}
                      </span>
                      <span v-if="opt!.discountedPriceNaira" class="ml-1 text-red-500">
                        {{ formatNaira(opt!.discountedPriceNaira) }}
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </section>

              <template v-if="inStock">
                <MarketProductLineTotal
                  :product="product"
                  :unit="selectedUnit"
                  :quantity="pickQty"
                />
                <div class="hidden w-full min-w-0 lg:block">
                  <MarketProductDetailCartActions
                    v-model:quantity="pickQty"
                    :product="product"
                    :unit="selectedUnit"
                    :in-stock="inStock"
                    close-on-success
                    @close="close"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
      </DialogBody>

      <DialogFooter
        v-if="product && inStock"
        class="flex w-full shrink-0 flex-col items-stretch gap-3 border-t border-grey-50 bg-background-on-canvas !px-4 !py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:!px-6 lg:hidden"
      >
        <MarketProductLineTotal
          :product="product"
          :unit="selectedUnit"
          :quantity="pickQty"
        />
        <MarketProductDetailCartActions
          v-model:quantity="pickQty"
          :product="product"
          :unit="selectedUnit"
          :in-stock="inStock"
          close-on-success
          class="w-full min-w-0"
          @close="close"
        />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
