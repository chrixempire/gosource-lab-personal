<script setup lang="ts">
import type { ShoppingListItemRecord, ShoppingListRecord } from '@gosource/api-client';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  StatusTag,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import { ClipboardList, Trash2 } from 'lucide-vue-next';
import ListCoverImage from '~/components/lists/ListCoverImage.vue';
import ListDrawerItemsSkeleton from '~/components/lists/ListDrawerItemsSkeleton.vue';
import MarketProductQtyStrip from '~/components/market/MarketProductQtyStrip.vue';
import { formatNaira } from '~/composables/useMarketplaceCart';
import { getMeasureShortHand } from '~/lib/marketplace-data';
import {
  formatShoppingListCurrency,
  shoppingListSubtotal,
} from '~/lib/shopping-list';

const props = defineProps<{
  open: boolean;
  list: ShoppingListRecord | null;
  itemsLoading?: boolean;
  savingItemId?: string | null;
  moveSubmitting?: boolean;
  clearSubmitting?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  refresh: [];
  updateItem: [payload: { itemId: string; quantity: number; unit: string }];
  deleteItem: [itemId: string];
  clearItems: [];
  moveToCart: [itemIds: string[]];
}>();

const isMobile = useMediaQuery('(max-width: 600px)');

const selectedItemIds = ref<string[]>([]);

watch(
  () => props.list,
  (list) => {
    selectedItemIds.value = [];
    if (!list) {
      return;
    }
  },
  { immediate: true },
);

const subtotal = computed(() => (props.list ? shoppingListSubtotal(props.list) : 0));
const allSelected = computed(() => {
  if (!props.list?.items.length) {
    return false;
  }

  return props.list.items.every((item) => selectedItemIds.value.includes(item.id));
});

const selectionState = computed<boolean | 'indeterminate'>(() => {
  if (selectedItemIds.value.length === 0) {
    return false;
  }

  if (allSelected.value) {
    return true;
  }

  return 'indeterminate';
});

const hasSelectedItems = computed(() => selectedItemIds.value.length > 0);

const showItems = computed(
  () => !props.itemsLoading && Boolean(props.list?.items.length),
);

const moveToCartDisabled = computed(
  () => props.itemsLoading || !hasSelectedItems.value || Boolean(props.moveSubmitting),
);

const moveToCartButtonClass = computed(() =>
  !hasSelectedItems.value && !props.moveSubmitting
    ? '!bg-button-disabled !text-disabled !shadow-none hover:!bg-button-disabled hover:!shadow-none active:!bg-button-disabled active:!translate-y-0'
    : undefined,
);

const scrollBodyClass =
  'min-h-0 max-h-[min(52vh,22rem)] flex-1 overflow-y-auto overscroll-contain';

const drawerBodyClass = `${scrollBodyClass} px-4 py-2`;
const dialogBodyClass = `${scrollBodyClass} space-y-3 px-6 py-4`;

function unitLabel(unit: string) {
  return getMeasureShortHand(unit) || unit;
}

function lineUnitPrice(item: ShoppingListItemRecord) {
  return item.quantity > 0 ? item.totalPrice / item.quantity : item.totalPrice;
}

function toggleSelectAll() {
  if (!props.list) {
    return;
  }

  if (allSelected.value) {
    selectedItemIds.value = [];
    return;
  }

  selectedItemIds.value = props.list.items.map((item) => item.id);
}

function toggleItem(itemId: string, checked: boolean) {
  if (checked) {
    selectedItemIds.value = [...new Set([...selectedItemIds.value, itemId])];
    return;
  }

  selectedItemIds.value = selectedItemIds.value.filter((id) => id !== itemId);
}

function onQuantityChange(item: ShoppingListItemRecord, quantity: number) {
  if (quantity < 1) {
    emit('deleteItem', item.id);
    return;
  }

  if (quantity !== item.quantity) {
    emit('updateItem', { itemId: item.id, quantity, unit: item.unit });
  }
}

function handleMoveToCart() {
  if (!hasSelectedItems.value) {
    return;
  }

  emit('moveToCart', [...selectedItemIds.value]);
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[94vh]">
      <DrawerHeader class="text-left">
        <DrawerTitle class="text-xl font-semibold text-grey-900">
          {{ list?.name ?? 'List details' }}
        </DrawerTitle>
        <p v-if="list?.description" class="text-sm text-grey-300">
          {{ list.description }}
        </p>
      </DrawerHeader>

      <DrawerBody :class="drawerBodyClass">
        <ListDrawerItemsSkeleton v-if="itemsLoading" />

        <div v-else-if="showItems" class="space-y-3">
          <div class="flex items-center justify-between gap-3 px-1">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-grey-text">
              <Checkbox
                :model-value="selectionState"
                aria-label="Select all items"
                @update:model-value="toggleSelectAll"
              />
              Select all
            </label>
            <p class="text-sm font-medium text-grey-900">
              Subtotal {{ formatShoppingListCurrency(subtotal) }}
            </p>
          </div>

          <ul class="divide-y divide-grey-50">
            <li
              v-for="item in list?.items ?? []"
              :key="item.id"
              class="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Checkbox
                :model-value="selectedItemIds.includes(item.id)"
                class="mt-3"
                :aria-label="`Select ${item.productName}`"
                @update:model-value="(checked) => toggleItem(item.id, checked === true)"
              />

              <ListCoverImage
                :src="item.imageUrl"
                :alt="item.productName"
                shape="circle"
                size="lg"
                :class="{ 'opacity-60 grayscale': !item.inStock }"
              />

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="line-clamp-2 text-sm font-semibold text-grey-900">
                      {{ item.productName }}
                    </p>
                    <p class="mt-0.5 text-xs text-grey-300">
                      {{ unitLabel(item.unit) }} · {{ formatNaira(lineUnitPrice(item)) }} each
                    </p>
                  </div>
                  <div class="flex shrink-0 flex-col items-end gap-1">
                    <p class="text-sm font-semibold text-grey-900">
                      {{ formatShoppingListCurrency(item.totalPrice) }}
                    </p>
                    <StatusTag
                      v-if="!item.inStock"
                      variant="negative"
                      size="medium"
                      class="shrink-0 px-2 py-0.5 text-[10px]"
                    >
                      Out of stock
                    </StatusTag>
                  </div>
                </div>

                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="w-full max-w-[7.5rem]">
                    <Button
                      v-if="!item.inStock"
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
                      :model-value="item.quantity"
                      variant="cart"
                      allow-remove-at-min
                      :disabled="savingItemId === item.id"
                      @update:model-value="(quantity) => onQuantityChange(item, quantity)"
                      @remove="emit('deleteItem', item.id)"
                    />
                  </div>
                  <button
                    type="button"
                    class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600"
                    :disabled="savingItemId === item.id"
                    aria-label="Remove item"
                    @click="emit('deleteItem', item.id)"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center px-4 py-12 text-center"
        >
          <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-grey-55">
            <ClipboardList class="size-7 text-grey-100" />
          </div>
          <p class="text-base font-medium text-grey-900">This list is empty</p>
          <p class="mt-1 max-w-xs text-sm text-grey-300">
            Add products from the market with Add to list.
          </p>
        </div>
      </DrawerBody>

      <DrawerFooter class="gap-3 border-t border-grey-50">
        <Button
          variant="neutral"
          size="medium"
          :disabled="itemsLoading || !list?.items.length || clearSubmitting"
          :loading="clearSubmitting"
          @click="emit('clearItems')"
        >
          Clear all
        </Button>
        <Button
          variant="primary"
          size="medium"
          :disabled="moveToCartDisabled"
          :class="moveToCartButtonClass"
          :loading="moveSubmitting"
          @click="handleMoveToCart"
        >
          Move to cart
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="flex max-h-[88vh] max-w-lg flex-col overflow-hidden p-0 sm:max-w-md">
      <DialogHeader class="shrink-0 border-b border-grey-50 px-6 py-5">
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle class="text-xl font-semibold text-grey-900">
            {{ list?.name ?? 'List details' }}
          </DialogTitle>
          <DialogDescription v-if="list?.description" class="text-sm text-grey-300">
            {{ list.description }}
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody :class="dialogBodyClass">
        <ListDrawerItemsSkeleton v-if="itemsLoading" />

        <template v-else-if="showItems">
          <div class="flex items-center justify-between gap-3">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-grey-text">
              <Checkbox
                :model-value="selectionState"
                aria-label="Select all items"
                @update:model-value="toggleSelectAll"
              />
              Select all
            </label>
            <p class="text-sm font-medium text-grey-900">
              Subtotal {{ formatShoppingListCurrency(subtotal) }}
            </p>
          </div>

          <ul class="divide-y divide-grey-50">
            <li
              v-for="item in list?.items ?? []"
              :key="item.id"
              class="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Checkbox
                :model-value="selectedItemIds.includes(item.id)"
                class="mt-3"
                :aria-label="`Select ${item.productName}`"
                @update:model-value="(checked) => toggleItem(item.id, checked === true)"
              />

              <ListCoverImage
                :src="item.imageUrl"
                :alt="item.productName"
                shape="circle"
                size="lg"
                :class="{ 'opacity-60 grayscale': !item.inStock }"
              />

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="line-clamp-2 text-sm font-semibold text-grey-900">
                      {{ item.productName }}
                    </p>
                    <p class="mt-0.5 text-xs text-grey-300">
                      {{ unitLabel(item.unit) }} · {{ formatNaira(lineUnitPrice(item)) }} each
                    </p>
                  </div>
                  <div class="flex shrink-0 flex-col items-end gap-1">
                    <p class="text-sm font-semibold text-grey-900">
                      {{ formatShoppingListCurrency(item.totalPrice) }}
                    </p>
                    <StatusTag
                      v-if="!item.inStock"
                      variant="negative"
                      size="medium"
                      class="shrink-0 px-2 py-0.5 text-[10px]"
                    >
                      Out of stock
                    </StatusTag>
                  </div>
                </div>

                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="w-full max-w-[7.5rem]">
                    <Button
                      v-if="!item.inStock"
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
                      :model-value="item.quantity"
                      variant="cart"
                      allow-remove-at-min
                      :disabled="savingItemId === item.id"
                      @update:model-value="(quantity) => onQuantityChange(item, quantity)"
                      @remove="emit('deleteItem', item.id)"
                    />
                  </div>
                  <button
                    type="button"
                    class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-negative-500 transition hover:bg-negative-50 hover:text-negative-600"
                    :disabled="savingItemId === item.id"
                    aria-label="Remove item"
                    @click="emit('deleteItem', item.id)"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </template>

        <div
          v-else
          class="flex flex-col items-center justify-center px-4 py-12 text-center"
        >
          <div class="mb-3 flex size-14 items-center justify-center rounded-full bg-grey-55">
            <ClipboardList class="size-7 text-grey-100" />
          </div>
          <p class="text-base font-medium text-grey-900">This list is empty</p>
          <p class="mt-1 max-w-xs text-sm text-grey-300">
            Add products from the market with Add to list.
          </p>
        </div>
      </DialogBody>

      <DialogFooter class="shrink-0 gap-3 border-t border-grey-50 px-6 py-4">
        <Button
          variant="neutral"
          size="medium"
          :disabled="itemsLoading || !list?.items.length || clearSubmitting"
          :loading="clearSubmitting"
          @click="emit('clearItems')"
        >
          Clear all
        </Button>
        <Button
          variant="primary"
          size="medium"
          :disabled="moveToCartDisabled"
          :class="moveToCartButtonClass"
          :loading="moveSubmitting"
          @click="handleMoveToCart"
        >
          Move to cart
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
