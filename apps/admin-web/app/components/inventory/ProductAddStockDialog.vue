<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@gosource/ui';
import InventorySearchableSelect from '~/components/inventory/InventorySearchableSelect.vue';
import { ADMIN_MODAL_TITLE_CLASS } from '~/lib/admin-dialog';
import {
  formatCurrencyFieldValue,
  formatNumericString,
  PRODUCT_ITEM_INPUT_CLASS,
  resolveProductStockUnit,
  stripToNumeric,
} from '~/lib/product-form';
import {
  buildAddStockBody,
  computeAddStockTotalPrice,
  createEmptyAddStockForm,
  validateAddStockForm,
  type ProductAddStockFormValues,
} from '~/lib/product-stock';
import type { ProductUnitOption } from '~/types/inventory';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  productId: string | null;
  productName?: string;
  /** Raw purchase unit from the product row (v2 `quantity.unit`). */
  unit?: string;
  defaultMarketPrice?: number;
  unitOptions: ProductUnitOption[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [body: ReturnType<typeof buildAddStockBody>];
}>();

const form = reactive<ProductAddStockFormValues>(createEmptyAddStockForm());
const fieldErrors = reactive<Record<string, string>>({});

const unitSelectOptions = computed(() =>
  props.unitOptions.map((option) => ({
    value: option.slug,
    label: option.label,
  })),
);

const totalPrice = computed(() => computeAddStockTotalPrice(form.marketPrice, form.quantity));

function updateMarketPrice(value: string) {
  const sanitized = stripToNumeric(value, true) || '';
  form.marketPrice = formatNumericString(sanitized, true);
}

function updateQuantity(value: string) {
  const sanitized = stripToNumeric(value, false) || '';
  form.quantity = formatNumericString(sanitized, false);
}

function applyUnitPrefill() {
  form.unit = resolveProductStockUnit(props.unit ?? '', props.unitOptions);
}

function resetForm() {
  Object.assign(
    form,
    createEmptyAddStockForm(
      '',
      props.defaultMarketPrice != null
        ? formatCurrencyFieldValue(props.defaultMarketPrice)
        : '',
    ),
  );
  applyUnitPrefill();
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
}

function syncFormFromProps() {
  if (!open.value) {
    return;
  }

  applyUnitPrefill();

  if (props.defaultMarketPrice != null) {
    form.marketPrice = formatCurrencyFieldValue(props.defaultMarketPrice);
  }
}

watch(open, (value) => {
  if (value) {
    resetForm();
  }
});

watch(
  () => [props.unit, props.defaultMarketPrice, props.unitOptions.length] as const,
  () => syncFormFromProps(),
);

onMounted(() => {
  if (open.value) {
    resetForm();
  }
});

function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateAddStockForm(form));

  if (Object.keys(fieldErrors).length > 0 || !props.productId) {
    return;
  }

  emit('submit', buildAddStockBody(form));
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,560px)]">
      <DialogHeader>
        <DialogTitle :class="`min-w-0 flex-1 pr-2 ${ADMIN_MODAL_TITLE_CLASS}`">
          Add stock
        </DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-5">
        <p v-if="productName" class="text-sm text-grey-600">
          {{ productName }}
        </p>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Unit</label>
          <InventorySearchableSelect
            v-model="form.unit"
            :options="unitSelectOptions"
            placeholder="Select unit"
            :invalid="Boolean(fieldErrors.unit)"
            disabled
          />
          <p v-if="fieldErrors.unit" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.unit }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Market price</label>
            <Input
              :model-value="form.marketPrice"
              :disabled="loading"
              :invalid="Boolean(fieldErrors.marketPrice)"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="decimal"
              placeholder="0"
              @update:model-value="updateMarketPrice"
            />
            <p class="mt-1 text-xs text-grey-500">This is the original price in the market</p>
            <p v-if="fieldErrors.marketPrice" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.marketPrice }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Quantity</label>
            <Input
              :model-value="form.quantity"
              :disabled="loading"
              :invalid="Boolean(fieldErrors.quantity)"
              :class="PRODUCT_ITEM_INPUT_CLASS"
              inputmode="numeric"
              placeholder="0"
              @update:model-value="updateQuantity"
            />
            <p v-if="fieldErrors.quantity" class="mt-1 text-xs text-negative-500">
              {{ fieldErrors.quantity }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-grey-800">Total price</label>
            <Input
              :model-value="totalPrice ? formatCurrencyFieldValue(Number(totalPrice)) : ''"
              disabled
              :class="PRODUCT_ITEM_INPUT_CLASS"
              placeholder="0"
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          size="medium"
          :loading="loading"
          :disabled="!productId"
          @click="onSubmit"
        >
          Add stock
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
