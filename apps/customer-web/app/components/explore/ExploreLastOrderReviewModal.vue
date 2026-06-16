<script setup lang="ts">
import type { OrderRecord } from '@gosource/api-client';
import { toast } from '@gosource/ui';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@gosource/ui';
import { Trash2 } from 'lucide-vue-next';
import {
  buildExploreLastOrderDraftLines,
  draftLinesSubtotal,
  sanitizeOrderUnitLabel,
  type ExploreLastOrderDraftLine,
} from '~/lib/explore-last-order';
import { useExploreLastOrder } from '~/composables/useExploreLastOrder';
import { useExploreProcurementInsight } from '~/composables/useExploreProcurementInsight';
import { formatNaira, useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useMarketplaceUi } from '~/composables/useMarketplaceUi';
import { useMarketBranchGate } from '~/composables/useMarketBranchGate';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import MarketProductQtyStrip from '~/components/market/MarketProductQtyStrip.vue';

const props = defineProps<{
  open: boolean;
  order: OrderRecord | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();


const { setQuantityForUnit, loadCart } = useMarketplaceCart();
const { navigateToMarketAndOpenCart } = useMarketplaceUi();
const { ensureBranchForAction } = useMarketBranchGate();
const { refresh: refreshExploreLastOrder } = useExploreLastOrder();
const { refresh: refreshExploreProcurement } = useExploreProcurementInsight();

const draftLines = ref<ExploreLastOrderDraftLine[]>([]);
const adding = ref(false);

watch(
  () => [props.open, props.order?.id] as const,
  ([isOpen]) => {
    if (isOpen && props.order) {
      draftLines.value = buildExploreLastOrderDraftLines(props.order);
    }
  },
  { immediate: true },
);

const visibleLines = computed(() => draftLines.value.filter((line) => line.quantity > 0));

const subtotal = computed(() => draftLinesSubtotal(visibleLines.value));

function close() {
  emit('update:open', false);
}

function lineTotal(line: ExploreLastOrderDraftLine) {
  return line.unitPrice * line.quantity;
}

function updateLineQuantity(key: string, quantity: number) {
  const next = Math.max(0, Math.min(999, Math.floor(quantity)));
  draftLines.value = draftLines.value.map((line) =>
    line.key === key ? { ...line, quantity: next } : line,
  );
}

function removeLine(key: string) {
  updateLineQuantity(key, 0);
}

async function onAddToCart() {
  if (adding.value || visibleLines.value.length === 0) {
    return;
  }

  if (!(await ensureBranchForAction())) {
    return;
  }

  adding.value = true;

  try {
    let added = 0;

    for (const line of visibleLines.value) {
      const success = await setQuantityForUnit(line.productId, line.unit, line.quantity, {
        silent: true,
        product: line.product,
        deferCartReload: true,
      });

      if (success) {
        added += 1;
      }
    }

    await loadCart(true);

    if (added === 0) {
      toast.error('Could not add items to cart.');
      return;
    }

    toast.success(
      added === 1 ? 'Item added to cart.' : `${added} items added to cart.`,
    );
    void refreshExploreLastOrder({ force: true });
    void refreshExploreProcurement({ force: true });

    await navigateToMarketAndOpenCart();
    close();
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <Dialog :open="open && Boolean(order)" @update:open="emit('update:open', $event)">
    <DialogContent
      class="z-100 flex max-h-[min(92dvh,44rem)] w-[min(96vw,520px)] max-w-[520px] flex-col overflow-hidden p-0 sm:rounded-[24px]"
    >
      <DialogHeader
        class="shrink-0 items-center gap-3 border-b border-grey-50 px-4 py-4 sm:px-5"
      >
        <div class="min-w-0 flex-1">
          <DialogTitle class="text-left text-lg font-semibold text-grey-900">
            Review last order
          </DialogTitle>
          <p class="mt-1 text-sm leading-snug text-grey-300">
            Adjust quantities, then add to cart.
          </p>
        </div>
        <DialogClose class="shrink-0 self-center" />
      </DialogHeader>

      <DialogBody class="flex min-h-0 flex-1 flex-col overflow-hidden !p-0">
        <div
          class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5"
          tabindex="0"
          role="region"
          aria-label="Order items"
        >
          <ul v-if="visibleLines.length" class="space-y-3">
            <li
              v-for="line in visibleLines"
              :key="line.key"
              class="flex gap-3 rounded-[16px] border border-grey-50 bg-background-on-canvas p-3 shadow-sm transition-colors duration-300"
            >
              <div
                class="relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-[14px] bg-grey-55"
              >
                <MarketProductImage
                  :src="line.imageUrl ?? undefined"
                  :alt="line.productName"
                  :hover-zoom="false"
                  logo-class="w-[72%] max-w-[3.25rem]"
                  :class="{ grayscale: !line.inStock }"
                />
              </div>

              <div class="min-w-0 flex-1">
                <p class="line-clamp-2 text-sm font-semibold text-grey-900">
                  {{ line.productName }}
                </p>
                <p class="mt-0.5 text-xs text-grey-300">
                  <template v-if="sanitizeOrderUnitLabel(line.unit)">
                    {{ sanitizeOrderUnitLabel(line.unit) }} ·
                  </template>
                  {{ formatNaira(line.unitPrice) }} each
                </p>

                <div class="mt-2 w-full max-w-[7.75rem]">
                  <MarketProductQtyStrip
                    v-if="line.inStock"
                    :model-value="line.quantity"
                    variant="cart"
                    allow-remove-at-min
                    @update:model-value="updateLineQuantity(line.key, $event)"
                    @remove="removeLine(line.key)"
                  />
                  <Button
                    v-else
                    size="small"
                    variant="destructive"
                    class="!h-7 !rounded-full !px-3 !text-[12px] !font-semibold"
                    type="button"
                    disabled
                  >
                    Out of stock
                  </Button>
                </div>
              </div>

              <div class="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <p class="text-sm font-semibold tabular-nums text-grey-900">
                  {{ formatNaira(lineTotal(line)) }}
                </p>
                <button
                  type="button"
                  class="flex size-8 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600"
                  aria-label="Remove item"
                  @click="removeLine(line.key)"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </li>
          </ul>

          <p v-else class="py-12 text-center text-sm text-grey-300">
            No items to add. Increase quantities to continue.
          </p>
        </div>

        <div
          class="flex shrink-0 items-center justify-between gap-4 border-t border-grey-50 bg-background-on-canvas px-4 py-3 sm:px-5"
        >
          <span class="text-sm font-semibold text-grey-900">Total</span>
          <span class="text-sm font-semibold tabular-nums text-grey-900">{{ formatNaira(subtotal) }}</span>
        </div>
      </DialogBody>

      <DialogFooter
        class="flex shrink-0 flex-col gap-2 border-t border-grey-50 bg-background-on-canvas !px-4 !py-3 sm:flex-row sm:justify-end sm:!px-5"
      >
        <Button
          type="button"
          variant="neutral"
          size="medium"
          class="!rounded-full sm:min-w-[7rem]"
          :disabled="adding"
          @click="close"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="medium"
          class="!rounded-full sm:min-w-[9rem]"
          :loading="adding"
          :disabled="visibleLines.length === 0"
          @click="onAddToCart"
        >
          Add to cart
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
