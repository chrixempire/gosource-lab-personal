<script setup lang="ts">
import type { RequestProductRecord } from '@gosource/api-client';
import type { CartLine } from '~/composables/useMarketplaceCart';
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ClipboardList, ShoppingCart, Trash2, X } from 'lucide-vue-next';
import { useCartRequestAction } from '~/composables/useCartRequestAction';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useRequestAddItemsMode } from '~/composables/useRequestAddItemsMode';
import {
  cartLineKey,
  getMarketProductById,
  getMarketUnitPrice,
  isCartLineInStock,
  isMarketProductInStock,
} from '~/lib/marketplace-data';
import MarketProductQtyStrip from './MarketProductQtyStrip.vue';
import MarketProductImage from './MarketProductImage.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { clearCart, isGuestCartMode, lines, refreshLoggedInCart, setQuantityForUnit, subtotalNaira, removeLine, syncMarketCartEntry } =
  useMarketplaceCart();
const {
  isAddingToRequest,
  isRequestReady,
  bootstrapLoading,
  editDraft,
  requestReference,
  requestProducts,
  requestSubtotal,
  requestDeliveryFee,
  requestServiceCharge,
  requestDiscount,
  requestTotalPrice,
  finishAddingToRequest,
  commitDraftForPrimaryAction,
  primaryActionLabel,
  bootstrapFromRoute,
} = useRequestAddItemsMode();
const { canSubmitPrimary, continueShopping, isSubmitting, primaryCtaLabel, submitCartAsRequest } =
  useCartRequestAction();

type DrawerLineEntry = {
  key: string;
  productId: string;
  unit: string;
  quantity: number;
  product: MarketProduct;
  lineTotalNaira: number;
  inStock: boolean;
};

function productFromRequestLine(line: RequestProductRecord): MarketProduct | null {
  if (line.productId) {
    const catalog = getMarketProductById(line.productId);
    if (catalog) {
      return catalog;
    }
  }

  if (!line.productName) {
    return null;
  }

  return {
    id: line.productId ?? line.productName,
    name: line.productName,
    description: '',
    imageUrl: line.imageUrl ?? undefined,
    priceNaira: line.unitPrice,
    unit: line.unit ?? undefined,
    inStock: line.inStock !== false,
  };
}

const cartLineEntries = computed(() =>
  lines.value
    .map((line) => {
      const product = line.product ?? getMarketProductById(line.productId);
      return product ? { line, product } : null;
    })
    .filter((x): x is { line: CartLine; product: MarketProduct } => x !== null),
);

const requestLineEntries = computed(() =>
  requestProducts.value
    .map((line) => {
      const product = productFromRequestLine(line);
      if (!product) {
        return null;
      }

      const unit = line.unit ?? 'Standard pack';
      return {
        key: line.cartLineId ?? cartLineKey(product.id, unit),
        productId: product.id,
        unit,
        quantity: line.quantity,
        product,
        lineTotalNaira: line.totalPrice,
        inStock: line.inStock !== false && isMarketProductInStock(product),
      } satisfies DrawerLineEntry;
    })
    .filter((entry): entry is DrawerLineEntry => entry !== null),
);

const activeEntries = computed(() =>
  isAddingToRequest.value
    ? requestLineEntries.value
    : cartLineEntries.value.map(({ line, product }) => ({
        key: line.lineKey,
        productId: line.productId,
        unit: line.unit,
        quantity: line.quantity,
        product,
        lineTotalNaira: getMarketUnitPrice(product, line.unit) * line.quantity,
        inStock: isCartLineInStock(line),
      })),
);

const hasOutOfStockProduct = computed(() => activeEntries.value.some((entry) => !entry.inStock));

const footerSubtotal = computed(() =>
  isAddingToRequest.value ? requestSubtotal.value : subtotalNaira.value,
);

const canSubmitRequestDraft = computed(
  () =>
    isRequestReady.value &&
    !bootstrapLoading.value &&
    !hasOutOfStockProduct.value &&
    Boolean(editDraft.value?.products.length),
);

function close() {
  emit('update:open', false);
}

function continueShoppingAction() {
  close();
}

async function removeEntry(entry: DrawerLineEntry) {
  if (isAddingToRequest.value) {
    await setQuantityForUnit(entry.productId, entry.unit, 0);
    return;
  }

  await removeLine(entry.key);
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }

    if (isAddingToRequest.value) {
      void bootstrapFromRoute();
      return;
    }

    if (isGuestCartMode.value) {
      syncMarketCartEntry();
      return;
    }

    void refreshLoggedInCart();
  },
);
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
        v-if="open"
        class="fixed inset-0 z-[85] bg-[rgba(16,24,40,0.35)] backdrop-blur-[1px]"
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
        v-if="open"
        class="fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col border-l border-grey-50 bg-background-on-canvas shadow-[-24px_0_64px_-24px_rgba(16,24,40,0.28)]"
        role="dialog"
        aria-modal="true"
        :aria-label="isAddingToRequest ? 'Request items' : 'Shopping cart'"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-grey-50 px-4 py-4">
          <div class="min-w-0">
            <p class="text-lg font-semibold text-grey-900">
              {{ isAddingToRequest ? 'Request items' : 'Your cart' }}
            </p>
            <p class="truncate text-xs text-grey-300">
              <template v-if="isAddingToRequest">
                {{ requestReference }} · {{ activeEntries.length }} line{{ activeEntries.length === 1 ? '' : 's' }}
              </template>
              <template v-else>
                {{ activeEntries.length }} line{{ activeEntries.length === 1 ? '' : 's' }}
              </template>
            </p>
          </div>
          <button
            type="button"
            class="flex size-10 cursor-pointer items-center justify-center rounded-full border border-grey-50 bg-white text-grey-900 transition hover:bg-primary-50/70 hover:text-primary-500"
            :aria-label="isAddingToRequest ? 'Close request items' : 'Close cart'"
            @click="close"
          >
            <X class="size-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div
            v-if="isAddingToRequest && (bootstrapLoading || !isRequestReady)"
            class="flex flex-col items-center justify-center gap-2 py-16 text-center"
          >
            <p class="text-sm font-semibold text-grey-900">Loading request items…</p>
            <p class="max-w-xs text-xs text-grey-300">
              Pulling the latest lines for {{ requestReference || 'this request' }}.
            </p>
          </div>

          <ul v-else-if="activeEntries.length" class="space-y-4">
            <li
              v-for="entry in activeEntries"
              :key="entry.key"
              class="flex gap-3 rounded-[16px] border border-grey-50 bg-white p-3 shadow-sm"
            >
              <div class="relative size-16 shrink-0 overflow-hidden rounded-xl bg-grey-55">
                <MarketProductImage
                  :src="entry.product.imageUrl"
                  :alt="entry.product.name"
                  logo-class="w-[72%] max-w-[3rem]"
                  :class="{ grayscale: !entry.inStock }"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="line-clamp-2 text-sm font-semibold text-grey-900">
                  {{ entry.product.name }}
                </p>
                <p class="mt-0.5 text-xs text-grey-300">
                  {{ entry.unit }} · {{ formatNaira(entry.quantity > 0 ? entry.lineTotalNaira / entry.quantity : entry.lineTotalNaira) }} each
                </p>
                <p
                  v-if="!entry.inStock"
                  class="mt-1 text-xs text-negative-500"
                >
                  Out of stock — remove this item to continue.
                </p>

                <div class="mt-2 w-full max-w-[7.5rem]">
                  <Button
                    v-if="!entry.inStock"
                    size="small"
                    variant="destructive"
                    class="!h-7 !rounded-full !px-3 !text-[12px] !font-semibold"
                    type="button"
                    disabled
                  >
                    Out of stock
                  </Button>
                  <MarketProductQtyStrip
                    v-else
                    :product-id="entry.productId"
                    :unit="entry.unit"
                    variant="cart"
                  />
                </div>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <p class="text-sm font-semibold text-grey-900">
                  {{ formatNaira(entry.lineTotalNaira) }}
                </p>
                <button
                  type="button"
                  class="flex size-8 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600"
                  :aria-label="isAddingToRequest ? 'Remove from request' : 'Remove line from cart'"
                  @click="removeEntry(entry)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </li>
          </ul>

          <div
            v-else
            class="flex flex-col items-center justify-center gap-2 py-16 text-center"
          >
            <component
              :is="isAddingToRequest ? ClipboardList : ShoppingCart"
              class="size-10 text-grey-100"
            />
            <p class="text-sm font-semibold text-grey-900">
              {{ isAddingToRequest ? 'No items on this request yet' : 'Your cart is empty' }}
            </p>
            <p class="max-w-xs text-xs text-grey-300">
              {{
                isAddingToRequest
                  ? 'Browse the market and tap Add to add products to this request.'
                  : 'Browse categories and tap Add to start your order.'
              }}
            </p>
          </div>
        </div>

        <div
          v-if="activeEntries.length || isAddingToRequest"
          class="border-t border-grey-50 bg-white/90 px-4 py-4 backdrop-blur"
        >
          <template v-if="isAddingToRequest">
            <div class="space-y-2 text-sm text-grey-text">
              <div class="flex items-center justify-between">
                <span>Subtotal</span>
                <span class="font-semibold text-grey-900">{{ formatNaira(footerSubtotal) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Delivery fee</span>
                <span class="font-semibold text-grey-900">{{ formatNaira(requestDeliveryFee) }}</span>
              </div>
              <div
                v-if="requestServiceCharge > 0"
                class="flex items-center justify-between"
              >
                <span>Service charge</span>
                <span class="font-semibold text-grey-900">{{ formatNaira(requestServiceCharge) }}</span>
              </div>
              <div
                v-if="requestDiscount > 0"
                class="flex items-center justify-between"
              >
                <span>Discount</span>
                <span class="font-semibold text-grey-900">−{{ formatNaira(requestDiscount) }}</span>
              </div>
              <div
                class="flex items-center justify-between border-t border-grey-50 pt-2 text-base font-semibold text-grey-900"
              >
                <span>Total</span>
                <span>{{ formatNaira(requestTotalPrice) }}</span>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <Button
                size="medium"
                variant="secondary"
                class="min-w-0 flex-1"
                type="button"
                @click="continueShoppingAction"
              >
                Continue shopping
              </Button>
              <Button
                size="medium"
                variant="primary"
                class="min-w-0 flex-1"
                type="button"
                :disabled="!canSubmitRequestDraft"
                @click="commitDraftForPrimaryAction"
              >
                {{ primaryActionLabel }}
              </Button>
            </div>
          </template>

          <template v-else-if="activeEntries.length">
            <div class="flex items-center justify-between text-sm">
              <span class="text-grey-300">Subtotal</span>
              <span class="text-lg font-semibold text-grey-900">{{ formatNaira(footerSubtotal) }}</span>
            </div>
            <button
              type="button"
              class="mt-2 cursor-pointer text-xs font-semibold text-negative-500 underline-offset-2 hover:underline"
              @click="clearCart"
            >
              Clear cart
            </button>
            <div class="mt-3 flex gap-[8px]">
              <Button
                size="medium"
                variant="secondary"
                class="min-w-0 flex-1"
                type="button"
                @click="continueShopping"
              >
                Continue shopping
              </Button>
              <Button
                size="medium"
                variant="primary"
                class="min-w-0 flex-1"
                type="button"
                :disabled="!canSubmitPrimary"
                :loading="isSubmitting"
                @click="submitCartAsRequest"
              >
                {{ primaryCtaLabel }}
              </Button>
            </div>
          </template>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
