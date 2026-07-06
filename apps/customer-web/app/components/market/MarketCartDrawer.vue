<script setup lang="ts">
import type { RequestProductRecord } from '@gosource/api-client';
import type { CartLine } from '~/composables/useMarketplaceCart';
import type { MarketProduct } from '~/lib/marketplace-data';
import { Button } from '@gosource/ui';
import { ClipboardList, ShoppingCart, X } from 'lucide-vue-next';
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
import { MIN_ORDER_SUBTOTAL_NAIRA } from '~/lib/market-cart';
import MarketCartLineItem from './MarketCartLineItem.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { clearCart, isGuestCartMode, lines, refreshLoggedInCart, setQuantityForUnit, subtotalNaira, removeLine, syncMarketCartEntry } =
  useMarketplaceCart();

function sanitizeCartUnitLabel(unit: string | undefined) {
  const trimmed = unit?.trim() ?? '';
  if (!trimmed || /^undefined$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}
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
  updateRequestAndOpen,
  checkoutRequest,
  isBusinessOwner,
  primaryActionLabel,
  isCommittingRequest,
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

const showMinimumOrderInfo = computed(
  () =>
    !isAddingToRequest.value &&
    footerSubtotal.value < MIN_ORDER_SUBTOTAL_NAIRA,
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

// Track which request CTA is in flight so only the clicked button shows its
// loading spinner (Update vs Checkout), not both.
const pendingRequestAction = ref<'update' | 'checkout' | null>(null);

async function handleUpdateRequest() {
  if (pendingRequestAction.value) {
    return;
  }
  pendingRequestAction.value = 'update';
  try {
    await updateRequestAndOpen();
  } finally {
    pendingRequestAction.value = null;
  }
}

async function handleCheckoutRequest() {
  if (pendingRequestAction.value) {
    return;
  }
  pendingRequestAction.value = 'checkout';
  try {
    await checkoutRequest();
  } finally {
    pendingRequestAction.value = null;
  }
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
        class="fixed inset-0 z-[85] customer-modal-overlay backdrop-blur-[1px]"
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
        class="fixed right-2 top-2 bottom-2 z-[90] flex w-[calc(100%-1rem)] flex-col border border-grey-50 bg-background-on-canvas shadow-[var(--customer-drawer-shadow)] transition-colors duration-300 sm:max-w-[35%]"
        role="dialog"
        aria-modal="true"
        :aria-label="isAddingToRequest ? 'Request items' : 'Shopping cart'"
        @click.stop
      >
        <div class="border-b border-grey-50 px-4 py-4">
          <div class="flex items-center justify-between">
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
              class="customer-control-btn flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full"
              :aria-label="isAddingToRequest ? 'Close request items' : 'Close cart'"
              @click="close"
            >
              <X class="size-5" />
            </button>
          </div>

          <p
            v-if="showMinimumOrderInfo"
            class="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium leading-5 text-orange-900"
          >
            Minimum orders should be ₦25,000
          </p>
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
            <li v-for="entry in activeEntries" :key="entry.key">
              <MarketCartLineItem
                :product="entry.product"
                :product-id="entry.productId"
                :unit="entry.unit"
                :quantity="entry.quantity"
                :line-total-naira="entry.lineTotalNaira"
                :in-stock="entry.inStock"
                :unit-label="sanitizeCartUnitLabel(entry.unit)"
                :remove-label="isAddingToRequest ? 'Remove from request' : 'Remove line from cart'"
                @remove="removeEntry(entry)"
              />
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
          class="border-t border-grey-50 bg-background-on-canvas/90 px-4 py-4 backdrop-blur transition-colors duration-300"
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
              <template v-if="isBusinessOwner">
                <Button
                  size="medium"
                  variant="outline"
                  class="customer-muted-action-btn min-w-0 flex-1"
                  type="button"
                  :disabled="!canSubmitRequestDraft || isCommittingRequest"
                  :loading="pendingRequestAction === 'update'"
                  @click="handleUpdateRequest"
                >
                  Update request
                </Button>
                <Button
                  size="medium"
                  variant="primary"
                  class="min-w-0 flex-1"
                  type="button"
                  :disabled="!canSubmitRequestDraft || isCommittingRequest"
                  :loading="pendingRequestAction === 'checkout'"
                  @click="handleCheckoutRequest"
                >
                  Checkout
                </Button>
              </template>
              <template v-else>
                <Button
                  size="medium"
                  variant="outline"
                  class="customer-muted-action-btn min-w-0 flex-1"
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
                  :disabled="!canSubmitRequestDraft || isCommittingRequest"
                  :loading="pendingRequestAction === 'update'"
                  @click="handleUpdateRequest"
                >
                  {{ primaryActionLabel }}
                </Button>
              </template>
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
                variant="outline"
                class="customer-muted-action-btn min-w-0 flex-1"
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
