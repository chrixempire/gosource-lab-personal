<script setup lang="ts">
import {
  Button,
  DatePickerField,
  Input,
  Switch,
  toast,
} from '@gosource/ui';
import { Trash2 } from 'lucide-vue-next';
import PromotionIconPicker from '~/components/promotions/PromotionIconPicker.vue';
import PromotionProductSearch from '~/components/promotions/PromotionProductSearch.vue';
import type { AdminProductListItem } from '~/types/inventory';
import type { PromotionFormProduct, PromotionFormValues } from '~/types/promotions';

const form = defineModel<PromotionFormValues>({ required: true });
const fieldErrors = defineModel<Record<string, string>>('fieldErrors', { default: () => ({}) });

const props = defineProps<{ mode: 'create' | 'edit'; promotionId?: string }>();

function onProductSelected(product: AdminProductListItem) {
  if (form.value.productIds.includes(product.id)) {
    toast.error('Item has already been added');
    return;
  }

  const onAnotherPromotion =
    product.hasPromotion &&
    (!props.promotionId || product.promotionId !== props.promotionId);

  if (onAnotherPromotion) {
    toast.error('Item is already on promotion');
    return;
  }

  const entry: PromotionFormProduct = {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    hasPromotion: product.hasPromotion,
  };

  form.value.productIds = [...form.value.productIds, product.id];
  form.value.products = [...form.value.products, entry];
  delete fieldErrors.value.products;
}

function removeProduct(id: string) {
  form.value.productIds = form.value.productIds.filter((entry) => entry !== id);
  form.value.products = form.value.products.filter((entry) => entry.id !== id);
}

watch(
  () => form.value.startDate,
  (start) => {
    if (form.value.endDate && start && form.value.endDate < start) {
      form.value.endDate = '';
    }
  },
);
</script>

<template>
  <div class="w-full space-y-6">
    <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
      <h2 class="text-lg font-semibold text-grey-900">Promotion details</h2>
      <div class="mt-4 space-y-4">
        <PromotionIconPicker
          v-model="form.icon"
          v-model:color="form.color"
          v-model:field-error="fieldErrors.icon"
        />

        <div class="space-y-2">
          <p class="text-sm font-medium text-grey-900">Name</p>
          <Input
            v-model="form.name"
            placeholder="Christmas mega sales"
            :invalid="Boolean(fieldErrors.name)"
          />
          <p v-if="fieldErrors.name" class="text-xs text-negative-500">{{ fieldErrors.name }}</p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-grey-900">Description</p>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full rounded-xl border border-grey-50 bg-white px-3 py-2.5 text-sm text-grey-900 outline-none transition focus:border-primary-300"
            :class="fieldErrors.description ? 'border-negative-500' : ''"
            placeholder="Description"
          />
          <p v-if="fieldErrors.description" class="text-xs text-negative-500">
            {{ fieldErrors.description }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium text-grey-900">Start date</p>
            <DatePickerField
              v-model="form.startDate"
              placeholder="Start date"
              :invalid="Boolean(fieldErrors.startDate)"
            />
            <p v-if="fieldErrors.startDate" class="text-xs text-negative-500">
              {{ fieldErrors.startDate }}
            </p>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-grey-900">End date</p>
            <DatePickerField
              v-model="form.endDate"
              placeholder="End date"
              :min="form.startDate || undefined"
              :invalid="Boolean(fieldErrors.endDate)"
            />
            <p v-if="fieldErrors.endDate" class="text-xs text-negative-500">
              {{ fieldErrors.endDate }}
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3 rounded-xl border border-grey-50 p-3">
          <Switch v-model="form.isPercentageDiscounted" />
          <div>
            <p class="text-sm font-medium text-grey-900">Set discount percentage</p>
            <p class="text-xs text-grey-500">
              Set a custom percentage off for users shopping this promotion.
            </p>
          </div>
        </div>

        <div v-if="form.isPercentageDiscounted" class="space-y-2">
          <p class="text-sm font-medium text-grey-900">Discount percentage</p>
          <Input
            v-model="form.discountPercentage"
            type="number"
            min="1"
            max="100"
            placeholder="e.g. 15"
            :invalid="Boolean(fieldErrors.discountPercentage)"
          />
          <p v-if="fieldErrors.discountPercentage" class="text-xs text-negative-500">
            {{ fieldErrors.discountPercentage }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-grey-50 bg-white p-5 shadow-sm">
      <h2 class="text-lg font-semibold text-grey-900">Items</h2>
      <div class="mt-4 space-y-4">
        <PromotionProductSearch @select="onProductSelected" />
        <p v-if="fieldErrors.products" class="text-xs text-negative-500">
          {{ fieldErrors.products }}
        </p>

        <ul v-if="form.products.length > 0" class="space-y-3">
          <li
            v-for="product in form.products"
            :key="product.id"
            class="flex items-center gap-3"
          >
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="size-12 rounded-lg object-cover"
            >
            <div
              v-else
              class="flex size-12 items-center justify-center rounded-lg bg-grey-55 text-xs text-grey-400"
            >
              —
            </div>
            <p class="min-w-0 flex-1 truncate text-sm font-medium text-grey-900">
              {{ product.name }}
            </p>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              class="!text-negative-500 hover:!bg-negative-50"
              aria-label="Remove item"
              @click="removeProduct(product.id)"
            >
              <Trash2 class="size-4" />
            </Button>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
