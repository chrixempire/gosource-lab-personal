<script setup lang="ts">
import {
  Button,
  Checkbox,
  Input,
} from '@gosource/ui';
import { Info, Trash2 } from 'lucide-vue-next';
import InventorySearchableSelect from '~/components/inventory/InventorySearchableSelect.vue';
import ProductImageDropzone from '~/components/inventory/ProductImageDropzone.vue';
import {
  clearResolvedProductItemFieldErrors,
  createEmptyPricingRow,
  createEmptySpecialPriceRow,
  PRODUCT_ITEM_INPUT_CLASS,
  PRODUCT_ITEM_TEXTAREA_CLASS,
  syncComputedTotalPrice,
  updateCurrencyField,
  updateIntegerField,
  type ProductItemFormValues,
} from '~/lib/product-form';
import type { ProductUnitOption } from '~/types/inventory';

const props = defineProps<{
  form: ProductItemFormValues;
  fieldErrors: Record<string, string>;
  categoryOptions: { id: string; label: string }[];
  unitOptions: ProductUnitOption[];
  customerOptions: { id: string; label: string }[];
  isEdit?: boolean;
  submitting?: boolean;
}>();

const categorySelectOptions = computed(() =>
  props.categoryOptions.map((category) => ({ value: category.id, label: category.label })),
);

const unitSelectOptions = computed(() =>
  props.unitOptions.map((unit) => ({ value: unit.slug, label: unit.label })),
);

const customerSelectOptions = computed(() =>
  props.customerOptions.map((customer) => ({ value: customer.id, label: customer.label })),
);

watch(
  () => props.form,
  () => {
    if (Object.keys(props.fieldErrors).length === 0) {
      return;
    }

    clearResolvedProductItemFieldErrors(props.form, props.fieldErrors, {
      isEdit: props.isEdit,
    });
  },
  { deep: true },
);

/** Animate progress on the reactive array slot (not a detached plain object). */
async function runImageUploadProgress(index: number) {
  await nextTick();

  const getSlot = () => props.form.images[index];
  const slot = getSlot();
  if (!slot) {
    return;
  }

  slot.uploadProgress = 0;

  const minDurationMs = 450;
  const start = performance.now();

  const decodeReady = new Promise<void>((resolve) => {
    if (!slot.file) {
      resolve();
      return;
    }

    const probe = new Image();
    probe.onload = () => resolve();
    probe.onerror = () => resolve();
    probe.src = slot.src;
  });

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const current = getSlot();
      if (!current) {
        resolve();
        return;
      }

      const elapsed = now - start;
      const progress = Math.min(92, Math.round((elapsed / minDurationMs) * 92));
      current.uploadProgress = progress;

      if (elapsed < minDurationMs) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });

  await decodeReady;

  const current = getSlot();
  if (!current) {
    return;
  }

  current.uploadProgress = 100;
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  current.uploadProgress = null;
}

function onAddImages(files: File[]) {
  for (const file of files) {
    if (props.form.images.length >= 4) {
      break;
    }

    props.form.images.push({
      src: URL.createObjectURL(file),
      file,
      uploadProgress: 0,
    });

    void runImageUploadProgress(props.form.images.length - 1);
  }
}

function onReplaceImage(index: number, file: File) {
  const existing = props.form.images[index];
  if (!existing) {
    return;
  }

  if (existing.id) {
    props.form.imagesToRemove.push(existing.id);
  }

  if (existing.src.startsWith('blob:')) {
    URL.revokeObjectURL(existing.src);
  }

  props.form.images[index] = {
    src: URL.createObjectURL(file),
    file,
    uploadProgress: 0,
  };

  void runImageUploadProgress(index);
}

function onRemoveImage(index: number) {
  const image = props.form.images[index];
  if (!image) {
    return;
  }

  if (image.id) {
    props.form.imagesToRemove.push(image.id);
  }

  if (image.src.startsWith('blob:')) {
    URL.revokeObjectURL(image.src);
  }

  props.form.images.splice(index, 1);
}

function addPricingRow() {
  props.form.pricing.push(createEmptyPricingRow());
}

function removePricingRow(index: number) {
  if (props.form.pricing.length <= 1) {
    return;
  }
  props.form.pricing.splice(index, 1);
}

function addSpecialPriceRow() {
  props.form.specialPrices.push(createEmptySpecialPriceRow());
}

function removeSpecialPriceRow(index: number) {
  props.form.specialPrices.splice(index, 1);
}

watch(
  () => [props.form.trackQuantity, props.form.marketPrice, props.form.quantity],
  () => syncComputedTotalPrice(props.form),
  { deep: true },
);
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <!-- Product details -->
    <section class="rounded-[20px] border border-grey-50 bg-white p-5 md:p-6">
      <h2 class="text-base font-semibold text-grey-900">Product details</h2>
      <div class="mt-5 space-y-5">
        <div>
          <p class="mb-1.5 text-sm font-medium text-grey-800">Image</p>
          <ProductImageDropzone
            :images="form.images"
            :disabled="submitting"
            :invalid="Boolean(fieldErrors.images)"
            @add="onAddImages"
            @remove="onRemoveImage"
            @replace="onReplaceImage"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Name</label>
          <Input
            v-model="form.name"
            :disabled="submitting"
            :invalid="Boolean(fieldErrors.name)"
            :class="PRODUCT_ITEM_INPUT_CLASS"
            placeholder="Product name"
          />
          <p v-if="fieldErrors.name" class="mt-1 text-xs text-negative-500">{{ fieldErrors.name }}</p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Description</label>
          <textarea
            v-model="form.description"
            rows="5"
            :disabled="submitting"
            :class="[PRODUCT_ITEM_TEXTAREA_CLASS, fieldErrors.description ? 'border-negative-500' : '']"
            placeholder="Describe this item"
          />
          <p v-if="fieldErrors.description" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.description }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Brand's name (optional)</label>
          <Input
            v-model="form.brand"
            :disabled="submitting"
            :class="PRODUCT_ITEM_INPUT_CLASS"
            placeholder="Optional"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Category</label>
          <InventorySearchableSelect
            v-model="form.category"
            :options="categorySelectOptions"
            placeholder="Select category"
            :invalid="Boolean(fieldErrors.category)"
            :disabled="submitting"
          />
          <p v-if="fieldErrors.category" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.category }}
          </p>
        </div>
      </div>
    </section>

    <!-- Stock inventory -->
    <section class="rounded-[20px] border border-grey-50 bg-white p-5 md:p-6">
      <h2 class="text-base font-semibold text-grey-900">Stock inventory</h2>
      <div class="mt-5 space-y-5">
        <label class="flex items-start gap-3 text-sm text-grey-800">
          <Checkbox v-model="form.trackQuantity" :disabled="submitting" class="mt-0.5" />
          <span>
            <span class="font-medium">Track quantity</span>
            <span class="mt-1 block text-xs text-grey-500">
              Keeps track of stock and notifies you when this item is low or out of stock.
            </span>
          </span>
        </label>

        <div v-if="form.trackQuantity">
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Unit</label>
          <InventorySearchableSelect
            v-model="form.purchaseUnit"
            :options="unitSelectOptions"
            placeholder="Select unit"
            :invalid="Boolean(fieldErrors.purchaseUnit)"
            :disabled="submitting"
          />
          <p v-if="fieldErrors.purchaseUnit" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.purchaseUnit }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Market price</label>
            <Input
              :model-value="form.marketPrice"
              :disabled="submitting"
              :invalid="Boolean(fieldErrors.marketPrice)"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="decimal"
              placeholder="0"
              @update:model-value="updateCurrencyField(form, 'marketPrice', form, $event)"
            />
            <p class="mt-1 text-xs text-grey-500">Original price in the market</p>
            <p v-if="fieldErrors.marketPrice" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.marketPrice }}
            </p>
          </div>

          <div v-if="form.trackQuantity">
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Quantity</label>
            <Input
              :model-value="form.quantity"
              :disabled="submitting || isEdit"
              :invalid="Boolean(fieldErrors.quantity)"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="numeric"
              placeholder="0"
              @update:model-value="updateIntegerField(form, 'quantity', form, $event)"
            />
            <p v-if="fieldErrors.quantity" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.quantity }}
            </p>
          </div>

          <div v-if="form.trackQuantity">
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Total price</label>
            <Input
              :model-value="form.totalPrice"
              disabled
              :class="PRODUCT_ITEM_INPUT_CLASS"
              placeholder="0"
            />
            <p class="mt-1 text-xs text-grey-500">Market price × quantity</p>
            <p v-if="fieldErrors.totalPrice" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.totalPrice }}
            </p>
          </div>
        </div>

        <div v-if="form.trackQuantity" class="space-y-4">
          <label class="flex items-start gap-3 text-sm text-grey-800">
            <Checkbox v-model="form.setLowStockLevel" :disabled="submitting" class="mt-0.5" />
            <span>
              <span class="font-medium">Set low stock level</span>
              <span class="mt-1 block text-xs text-grey-500">
                Get notified when stock reaches this level or below.
              </span>
            </span>
          </label>

          <div v-if="form.setLowStockLevel">
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Low stock level</label>
            <Input
              :model-value="form.stockLevel"
              :disabled="submitting"
              :invalid="Boolean(fieldErrors.stockLevel)"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="numeric"
              placeholder="1"
              @update:model-value="updateIntegerField(form, 'stockLevel', form, $event)"
            />
            <p v-if="fieldErrors.stockLevel" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.stockLevel }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="rounded-[20px] border border-grey-50 bg-white p-5 md:p-6">
      <h2 class="flex items-center gap-1.5 text-base font-semibold text-grey-900">
        Pricing
        <Info class="size-4 text-grey-400" />
      </h2>
      <p v-if="fieldErrors.pricing" class="mt-2 text-xs text-negative-500">{{ fieldErrors.pricing }}</p>

      <div class="mt-5 space-y-4">
        <div
          v-for="(row, index) in form.pricing"
          :key="index"
          class="relative grid grid-cols-1 gap-3 pr-8 md:grid-cols-3"
        >
          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Unit</label>
            <InventorySearchableSelect
              v-model="row.unit"
              :options="unitSelectOptions"
              placeholder="Select unit"
              :invalid="Boolean(fieldErrors[`pricing.${index}.unit`])"
              :disabled="submitting"
            />
            <p v-if="fieldErrors[`pricing.${index}.unit`]" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors[`pricing.${index}.unit`] }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Price per unit</label>
            <Input
              :model-value="row.price"
              :disabled="submitting"
              :invalid="Boolean(fieldErrors[`pricing.${index}.price`])"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="decimal"
              placeholder="0"
              @update:model-value="updateCurrencyField(form, 'price', row, $event)"
            />
            <p v-if="fieldErrors[`pricing.${index}.price`]" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors[`pricing.${index}.price`] }}
            </p>
          </div>

          <div v-if="form.trackQuantity">
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Q/U</label>
            <Input
              :model-value="row.quantityPerUnit"
              :disabled="submitting"
              :invalid="Boolean(fieldErrors[`pricing.${index}.quantityPerUnit`])"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="numeric"
              placeholder="0"
              @update:model-value="updateIntegerField(form, 'quantityPerUnit', row, $event)"
            />
            <p class="mt-1 text-xs text-grey-500">Quantity per main unit</p>
            <p
              v-if="fieldErrors[`pricing.${index}.quantityPerUnit`]"
              class="mt-1 text-xs text-negative-500"
            >
              {{ fieldErrors[`pricing.${index}.quantityPerUnit`] }}
            </p>
          </div>

          <button
            v-if="form.pricing.length > 1"
            type="button"
            class="absolute right-0 top-8 text-negative-500"
            :disabled="submitting"
            aria-label="Remove pricing row"
            @click="removePricingRow(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <p v-if="form.trackQuantity" class="text-xs text-grey-500">
          Q/U — quantity per main unit you're tracking against.
        </p>

        <Button
          type="button"
          variant="link"
          size="small"
          class="!h-auto !w-fit !p-0 !text-sm !font-medium"
          :disabled="submitting"
          @click="addPricingRow"
        >
          Add another measurement
        </Button>
      </div>
    </section>

    <!-- Special price -->
    <section class="rounded-[20px] border border-grey-50 bg-white p-5 md:p-6">
      <h2 class="flex items-center gap-1.5 text-base font-semibold text-grey-900">
        Special price
        <Info class="size-4 text-grey-400" />
      </h2>

      <div class="mt-5 space-y-4">
        <div
          v-for="(row, index) in form.specialPrices"
          :key="index"
          class="relative grid grid-cols-1 gap-3 pr-8 md:grid-cols-2"
        >
          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Customer</label>
            <InventorySearchableSelect
              v-model="row.customerId"
              :options="customerSelectOptions"
              placeholder="Select customer"
              :invalid="Boolean(fieldErrors[`specialPrices.${index}.customerId`])"
              :disabled="submitting"
            />
            <p
              v-if="fieldErrors[`specialPrices.${index}.customerId`]"
              class="mt-1 text-xs text-negative-500"
            >
              {{ fieldErrors[`specialPrices.${index}.customerId`] }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">New price</label>
            <Input
              :model-value="row.newPrice"
              :disabled="submitting"
              :invalid="Boolean(fieldErrors[`specialPrices.${index}.newPrice`])"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="decimal"
              placeholder="0"
              @update:model-value="updateCurrencyField(form, 'newPrice', row, $event)"
            />
            <p
              v-if="fieldErrors[`specialPrices.${index}.newPrice`]"
              class="mt-1 text-xs text-negative-500"
            >
              {{ fieldErrors[`specialPrices.${index}.newPrice`] }}
            </p>
          </div>

          <button
            type="button"
            class="absolute right-0 top-8 text-negative-500"
            :disabled="submitting"
            aria-label="Remove special price"
            @click="removeSpecialPriceRow(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <Button
          type="button"
          variant="link"
          size="small"
          class="!h-auto !w-fit !p-0 !text-sm !font-medium"
          :disabled="submitting"
          @click="addSpecialPriceRow"
        >
          Add a special price
        </Button>
      </div>
    </section>
  </div>
</template>
