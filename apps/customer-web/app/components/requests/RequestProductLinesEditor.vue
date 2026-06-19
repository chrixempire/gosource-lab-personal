<script setup lang="ts">
import type { RequestProductRecord } from '@gosource/api-client';
import {
  TableBody,
  TableCell,
  TableHeader,
  TableHeadRow,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { Trash2 } from 'lucide-vue-next';
import MemberConfirmOverlay from '~/components/members/MemberConfirmOverlay.vue';
import { CUSTOMER_TABLE_STRIPED_ROW_CLASS } from '~/lib/customer-table-layout';
import MarketProductImage from '~/components/market/MarketProductImage.vue';
import MarketProductQtyStrip from '~/components/market/MarketProductQtyStrip.vue';

const props = withDefaults(defineProps<{
  products: RequestProductRecord[];
  formatCurrency: (value: number) => string;
  disabled?: boolean;
  loading?: boolean;
  editable?: boolean;
  /** No outer table border — use inside a parent card. */
  embedded?: boolean;
  /** Compact horizontal rows (request details slide panel). */
  listStyle?: boolean;
}>(), {
  editable: false,
  embedded: false,
  listStyle: false,
});

const tableShellClass = computed(() =>
  props.embedded
    ? 'flex flex-col overflow-hidden'
    : 'flex flex-col overflow-hidden rounded-[18px] border border-grey-50 bg-background-on-canvas',
);

const mobileLineClass = computed(() =>
  props.embedded
    ? 'border-b border-grey-50 py-4 last:border-b-0'
    : 'rounded-[18px] border border-grey-50 bg-background-on-canvas p-4',
);

const emit = defineEmits<{
  quantityChange: [cartLineId: string, quantity: number];
  removeLine: [cartLineId: string];
}>();

const removeConfirmOpen = ref(false);
const pendingRemove = ref<RequestProductRecord | null>(null);

const tableGridTemplate = computed(() =>
  props.editable
    ? '64px minmax(0,2.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr) 3rem'
    : '64px minmax(0,2.4fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr)',
);

const skeletonColumns = computed(() => [
  { kind: 'line' as const, lineClass: 'w-8' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'w-14' },
  { kind: 'line' as const, lineClass: 'w-20' },
  { kind: 'line' as const, lineClass: 'w-16' },
  { kind: 'line' as const, lineClass: 'w-20' },
  ...(props.editable ? [{ kind: 'action' as const }] : []),
]);

function lineKey(product: RequestProductRecord, index: number) {
  return product.cartLineId ?? `${product.productId ?? product.productName}-${product.unit}-${index}`;
}

function canEditLine(product: RequestProductRecord) {
  return Boolean(product.cartLineId) && product.inStock !== false;
}

const canRemoveLine = computed(() => props.products.length > 1);
const lineControlsDisabled = computed(() => props.disabled || props.loading);

function onQuantityChange(product: RequestProductRecord, quantity: number) {
  if (!product.cartLineId) {
    return;
  }

  emit('quantityChange', product.cartLineId, quantity);
}

function promptRemove(product: RequestProductRecord) {
  if (!product.cartLineId || props.disabled || props.loading) {
    return;
  }

  pendingRemove.value = product;
  removeConfirmOpen.value = true;
}

function closeRemoveConfirm() {
  removeConfirmOpen.value = false;
  pendingRemove.value = null;
}

function confirmRemove() {
  if (!pendingRemove.value?.cartLineId || !canRemoveLine.value) {
    closeRemoveConfirm();
    return;
  }

  emit('removeLine', pendingRemove.value.cartLineId);
  closeRemoveConfirm();
}

const removeConfirmTitle = computed(() => 'Remove product');
const removeConfirmDescription = computed(() =>
  canRemoveLine.value
    ? 'This item will be removed from the request. Totals will update automatically.'
    : 'A request must include at least one product.',
);

const removeConfirmMessage = computed(() => {
  const name = pendingRemove.value?.productName ?? 'this product';
  if (!canRemoveLine.value) {
    return `You cannot remove ${name} because it is the only item on this request. Add another product first, or cancel the whole request.`;
  }

  return `Remove ${name} from this request?`;
});
</script>

<template>
  <div class="min-w-0 space-y-3">
    <p
      v-if="editable && !canRemoveLine"
      class="rounded-[12px] border border-warning-100 bg-[rgba(247,144,9,0.08)] px-3 py-2.5 text-xs leading-5 text-grey-text"
      role="status"
    >
      You cannot remove the only product on this request. Add another item first, or cancel the
      whole request if you no longer need it.
    </p>

    <div v-if="listStyle && loading" class="space-y-0 divide-y divide-grey-50">
      <div
        v-for="index in 3"
        :key="index"
        class="flex items-center gap-3 py-3"
      >
        <div class="size-10 shrink-0 animate-pulse rounded-lg bg-grey-55" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 w-40 max-w-full animate-pulse rounded bg-grey-55" />
          <div class="h-5 w-16 animate-pulse rounded-full bg-grey-55" />
        </div>
        <div class="h-4 w-20 shrink-0 animate-pulse rounded bg-grey-55" />
      </div>
    </div>

    <ul
      v-else-if="listStyle && products.length > 0"
      class="divide-y divide-grey-50"
    >
      <li
        v-for="(product, index) in products"
        :key="lineKey(product, index)"
        class="py-3 first:pt-0 last:pb-0"
      >
        <div class="flex items-start gap-3">
          <div
            v-if="product.imageUrl"
            class="relative size-10 shrink-0 overflow-hidden rounded-lg bg-grey-55"
          >
            <MarketProductImage
              :src="product.imageUrl"
              :alt="product.productName"
              logo-class="w-[70%] max-w-[1.75rem]"
              :class="{ grayscale: product.inStock === false }"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 flex-col gap-1.5">
                  <p class="break-words text-sm font-medium leading-snug text-grey-900 [overflow-wrap:anywhere]">
                    {{ product.productName }}
                  </p>
                  <span
                    class="w-fit shrink-0 rounded-full border border-grey-50 px-2 py-0.5 text-xs font-medium text-grey-300"
                  >
                    {{ product.unit || 'Standard pack' }}
                  </span>
                </div>
                <p
                  v-if="!product.cartLineId"
                  class="mt-1 text-xs text-grey-300"
                >
                  This line cannot be edited yet. Close and reopen this request, then try again.
                </p>
                <p
                  v-else-if="product.inStock === false"
                  class="mt-1 text-xs text-negative-500"
                >
                  Out of stock — remove this item to continue.
                </p>
              </div>

              <p class="shrink-0 text-sm font-semibold tabular-nums text-grey-900">
                {{ formatCurrency(product.totalPrice) }}
              </p>
            </div>

            <div
              v-if="editable && canEditLine(product)"
              class="mt-2 flex items-center justify-between gap-2"
            >
              <div class="w-full max-w-[7.5rem]">
                <MarketProductQtyStrip
                  variant="cart"
                  :model-value="product.quantity"
                  :disabled="lineControlsDisabled"
                  :allow-remove-at-min="canRemoveLine"
                  @update:model-value="onQuantityChange(product, $event)"
                  @remove="promptRemove(product)"
                />
              </div>
              <button
                type="button"
                class="flex size-8 shrink-0 items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600 disabled:cursor-not-allowed disabled:opacity-35"
                :disabled="lineControlsDisabled || !canRemoveLine"
                title="Remove from request"
                aria-label="Remove line from request"
                @click="promptRemove(product)"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
            <p
              v-else-if="!editable"
              class="mt-1 text-xs text-grey-300"
            >
              Qty {{ product.quantity }} · {{ formatCurrency(product.unitPrice) }} each
            </p>
          </div>
        </div>
      </li>
    </ul>

    <div
      v-else-if="listStyle"
      class="py-8 text-center text-sm text-grey-300"
    >
      No products have been added to this request yet.
    </div>

    <div v-else class="hidden md:block">
      <TableShell :class="tableShellClass">
        <TableHeader>
          <TableHeadRow
            :style="{ gridTemplateColumns: tableGridTemplate }"
            :class="loading ? 'pointer-events-none opacity-60' : undefined"
          >
            <TableCell>S/N</TableCell>
            <TableCell>Product</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Unit Price</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Total</TableCell>
            <TableCell v-if="editable" class="sr-only">Delete</TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableSkeleton
          v-if="loading"
          :columns="skeletonColumns"
          :grid-template-columns="tableGridTemplate"
        />

        <TableBody v-else-if="products.length > 0">
          <TableRow
            v-for="(product, index) in products"
            :key="lineKey(product, index)"
            :style="{ gridTemplateColumns: tableGridTemplate }"
            :class="CUSTOMER_TABLE_STRIPED_ROW_CLASS"
          >
            <TableCell>
              <p class="text-sm font-medium text-grey-900">
                {{ index + 1 }}
              </p>
            </TableCell>

            <TableCell class="flex items-center gap-3">
              <div
                v-if="product.imageUrl"
                class="relative size-10 shrink-0 overflow-hidden rounded-lg bg-grey-55"
              >
                <MarketProductImage
                  :src="product.imageUrl"
                  :alt="product.productName"
                  logo-class="w-[70%] max-w-[1.75rem]"
                  :class="{ grayscale: product.inStock === false }"
                />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-grey-900">
                  {{ product.productName }}
                </p>
                <p
                  v-if="!product.cartLineId"
                  class="mt-1 text-xs text-grey-300"
                >
                  This line cannot be edited yet. Close and reopen this request, then try again.
                </p>
                <p
                  v-else-if="product.inStock === false"
                  class="mt-1 text-xs text-negative-500"
                >
                  Out of stock — remove this item to continue.
                </p>
              </div>
            </TableCell>

            <TableCell>
              <div v-if="editable && canEditLine(product)" class="w-full max-w-[7.5rem]">
                <MarketProductQtyStrip
                  variant="cart"
                  :model-value="product.quantity"
                  :disabled="lineControlsDisabled"
                  :allow-remove-at-min="canRemoveLine"
                  @update:model-value="onQuantityChange(product, $event)"
                  @remove="promptRemove(product)"
                />
              </div>
              <p v-else class="text-sm font-medium text-grey-900">
                {{ product.quantity }}
              </p>
            </TableCell>

            <TableCell>
              <p class="text-sm font-medium text-grey-900">
                {{ formatCurrency(product.unitPrice) }}
              </p>
            </TableCell>

            <TableCell>
              <p class="text-sm font-medium text-grey-900">
                {{ product.unit || 'Standard pack' }}
              </p>
            </TableCell>

            <TableCell>
              <p class="text-sm font-semibold text-grey-900">
                {{ formatCurrency(product.totalPrice) }}
              </p>
            </TableCell>

            <TableCell v-if="editable" class="flex items-start justify-start">
              <button
                v-if="canEditLine(product)"
                type="button"
                class="flex size-8 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600 disabled:cursor-not-allowed disabled:opacity-35"
                :disabled="lineControlsDisabled || !canRemoveLine"
                title="Remove from request"
                aria-label="Remove line from request"
                @click="promptRemove(product)"
              >
                <Trash2 class="size-4" />
              </button>
            </TableCell>
          </TableRow>
        </TableBody>

        <TableBody v-else>
          <div class="flex min-h-[180px] items-center justify-center px-6 text-sm text-grey-300">
            No products have been added to this request yet.
          </div>
        </TableBody>
      </TableShell>
    </div>

    <div v-if="!listStyle && loading" class="grid gap-3 md:hidden">
      <div
        v-for="index in 3"
        :key="index"
        :class="mobileLineClass"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <div class="size-10 shrink-0 animate-pulse rounded-lg bg-grey-55" />
            <div class="min-w-0 flex-1">
              <div class="h-4 max-w-[11rem] animate-pulse rounded-md bg-grey-55" />
            </div>
          </div>
          <div
            v-if="editable"
            class="size-8 shrink-0 animate-pulse rounded-full bg-grey-55"
          />
        </div>

        <div
          class="mt-4"
          :class="editable ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-3'"
        >
          <div
            v-for="cardIndex in editable ? 4 : 3"
            :key="cardIndex"
            class="rounded-[16px] bg-grey-55 px-4 py-3"
          >
            <div class="h-3 w-16 animate-pulse rounded-full bg-grey-100" />
            <div class="mt-2 h-4 w-20 animate-pulse rounded-full bg-grey-100" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!listStyle && products.length > 0" class="grid w-full min-w-0 gap-3 md:hidden">
      <article
        v-for="(product, index) in products"
        :key="lineKey(product, index)"
        :class="[mobileLineClass, 'w-full min-w-0']"
      >
        <div
          class="grid min-w-0 items-start gap-x-3"
          :class="
            editable && canEditLine(product)
              ? product.imageUrl
                ? 'grid-cols-[2.5rem_minmax(0,1fr)_2rem]'
                : 'grid-cols-[minmax(0,1fr)_2rem]'
              : product.imageUrl
                ? 'grid-cols-[2.5rem_minmax(0,1fr)]'
                : 'grid-cols-1'
          "
        >
          <div
            v-if="product.imageUrl"
            class="relative size-10 shrink-0 overflow-hidden rounded-lg bg-grey-55"
          >
            <MarketProductImage
              :src="product.imageUrl"
              :alt="product.productName"
              logo-class="w-[70%] max-w-[1.75rem]"
              :class="{ grayscale: product.inStock === false }"
            />
          </div>

          <div class="min-w-0">
            <p class="w-full break-words text-base font-semibold leading-snug text-grey-900 [overflow-wrap:anywhere]">
              {{ product.productName }}
            </p>
            <p
              v-if="!product.cartLineId"
              class="mt-1 text-xs text-grey-300"
            >
              This line cannot be edited yet. Close and reopen this request, then try again.
            </p>
            <p
              v-else-if="product.inStock === false"
              class="mt-1 text-xs text-negative-500"
            >
              Out of stock — remove this item to continue.
            </p>
          </div>

          <button
            v-if="editable && canEditLine(product)"
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600 disabled:cursor-not-allowed disabled:opacity-35"
            :disabled="lineControlsDisabled || !canRemoveLine"
            title="Remove from request"
            aria-label="Remove line from request"
            @click="promptRemove(product)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <div
          v-if="editable"
          class="mt-4 flex w-full min-w-0 flex-col gap-2"
        >
          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Quantity
            </p>
            <div v-if="canEditLine(product)" class="mt-2 w-full max-w-[8.5rem] min-w-0">
              <MarketProductQtyStrip
                variant="cart"
                :model-value="product.quantity"
                :disabled="lineControlsDisabled"
                :allow-remove-at-min="canRemoveLine"
                @update:model-value="onQuantityChange(product, $event)"
                @remove="promptRemove(product)"
              />
            </div>
            <p v-else class="mt-1 text-sm font-semibold text-grey-900">
              {{ product.quantity }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Unit price
            </p>
            <p class="mt-1 break-words text-sm font-semibold tabular-nums text-grey-900">
              {{ formatCurrency(product.unitPrice) }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Unit
            </p>
            <p class="mt-1 break-words text-sm font-semibold text-grey-900">
              {{ product.unit || 'Standard pack' }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Total
            </p>
            <p class="mt-1 break-words text-sm font-semibold tabular-nums text-grey-900">
              {{ formatCurrency(product.totalPrice) }}
            </p>
          </div>
        </div>

        <div v-else class="mt-4 grid min-w-0 grid-cols-2 gap-3">
          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Quantity
            </p>
            <p class="mt-1 text-sm font-semibold text-grey-900">
              {{ product.quantity }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Unit price
            </p>
            <p class="mt-1 break-words text-sm font-semibold tabular-nums text-grey-900">
              {{ formatCurrency(product.unitPrice) }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Unit
            </p>
            <p class="mt-1 break-words text-sm font-semibold text-grey-900">
              {{ product.unit || 'Standard pack' }}
            </p>
          </div>

          <div class="min-w-0 rounded-[16px] bg-grey-55 px-3 py-3 sm:px-4">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Total
            </p>
            <p class="mt-1 break-words text-sm font-semibold tabular-nums text-grey-900">
              {{ formatCurrency(product.totalPrice) }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else-if="!listStyle"
      class="rounded-[18px] border border-grey-50 bg-background-on-canvas px-6 py-12 text-center text-sm text-grey-300 md:hidden"
    >
      No products have been added to this request yet.
    </div>

    <MemberConfirmOverlay
      :open="removeConfirmOpen"
      :title="removeConfirmTitle"
      :description="removeConfirmDescription"
      :message="removeConfirmMessage"
      :confirm-label="canRemoveLine ? 'Remove product' : 'OK'"
      :destructive="canRemoveLine"
      :loading="loading"
      @update:open="!$event && closeRemoveConfirm()"
      @confirm="canRemoveLine ? confirmRemove() : closeRemoveConfirm()"
    />
  </div>
</template>
