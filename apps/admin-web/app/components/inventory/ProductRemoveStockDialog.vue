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
  blockExtraDecimal,
  formatNumericString,
  PRODUCT_ITEM_INPUT_CLASS,
  PRODUCT_ITEM_TEXTAREA_CLASS,
  resolveProductStockUnit,
  stripToNumeric,
} from '~/lib/product-form';
import {
  buildRemoveStockBody,
  createEmptyRemoveStockForm,
  validateRemoveStockForm,
  type ProductRemoveStockFormValues,
} from '~/lib/product-stock';
import type { ProductUnitOption } from '~/types/inventory';

const open = defineModel<boolean>('open', { default: false });

const props = defineProps<{
  productId: string | null;
  productName?: string;
  /** Raw purchase unit from the product row (v2 `quantity.unit`). */
  unit?: string;
  unitOptions: ProductUnitOption[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [body: ReturnType<typeof buildRemoveStockBody>];
}>();

const form = reactive<ProductRemoveStockFormValues>(createEmptyRemoveStockForm());
const fieldErrors = reactive<Record<string, string>>({});

const unitSelectOptions = computed(() =>
  props.unitOptions.map((option) => ({
    value: option.slug,
    label: option.label,
  })),
);

function updateQuantity(value: string) {
  const sanitized = stripToNumeric(value, true) || '';
  form.quantity = formatNumericString(sanitized, true);
}

function applyUnitPrefill() {
  form.unit = resolveProductStockUnit(props.unit ?? '', props.unitOptions);
}

function resetForm() {
  Object.assign(form, createEmptyRemoveStockForm(''));
  applyUnitPrefill();
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
}

watch(open, (value) => {
  if (value) {
    resetForm();
  }
});

watch(
  () => [props.unit, props.unitOptions.length] as const,
  () => {
    if (open.value) {
      applyUnitPrefill();
    }
  },
);

onMounted(() => {
  if (open.value) {
    resetForm();
  }
});

function onSubmit() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  Object.assign(fieldErrors, validateRemoveStockForm(form));

  if (Object.keys(fieldErrors).length > 0 || !props.productId) {
    return;
  }

  emit('submit', buildRemoveStockBody(form));
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,480px)]">
      <DialogHeader>
        <DialogTitle :class="`min-w-0 flex-1 pr-2 ${ADMIN_MODAL_TITLE_CLASS}`">
          Remove stock
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

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">Quantity</label>
          <Input
            :model-value="form.quantity"
            :disabled="loading"
            :invalid="Boolean(fieldErrors.quantity)"
            :class="PRODUCT_ITEM_INPUT_CLASS"
            inputmode="decimal"
            placeholder="0"
            @keypress="blockExtraDecimal"
            @update:model-value="updateQuantity"
          />
          <p v-if="fieldErrors.quantity" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.quantity }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-grey-800">
            Reason for stock removal
          </label>
          <textarea
            v-model="form.reason"
            rows="4"
            :disabled="loading"
            :class="[PRODUCT_ITEM_TEXTAREA_CLASS, fieldErrors.reason ? 'border-negative-500' : '']"
            placeholder="Enter reason"
          />
          <p v-if="fieldErrors.reason" class="mt-1 text-xs text-negative-500">
            {{ fieldErrors.reason }}
          </p>
        </div>
      </DialogBody>

      <DialogFooter class="gap-2">
        <Button type="button" variant="outline" size="medium" @click="open = false">
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="medium"
          :loading="loading"
          :disabled="!productId"
          @click="onSubmit"
        >
          Remove stock
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
