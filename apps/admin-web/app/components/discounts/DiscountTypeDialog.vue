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
  RadioGroup,
  RadioGroupItem,
} from '@gosource/ui';
import { TicketPercent } from 'lucide-vue-next';
import { DISCOUNT_CREATE_OPTIONS } from '~/lib/discount-constants';
import { discountCreatePath } from '~/lib/admin-routes';
import type { DiscountRouteSlug } from '~/types/discounts';

const open = defineModel<boolean>('open', { default: false });
const selected = ref<DiscountRouteSlug | ''>('');

function isCouponType(slug: DiscountRouteSlug) {
  return slug === 'amountOffOrder' || slug === 'freeDelivery';
}

function onConfirm() {
  if (!selected.value) return;
  open.value = false;
  void navigateTo(discountCreatePath(selected.value));
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="w-[min(92vw,520px)]">
      <DialogHeader>
        <DialogTitle>Choose discount type</DialogTitle>
        <DialogClose class="shrink-0" />
      </DialogHeader>
      <DialogBody>
        <RadioGroup v-model="selected" class="flex flex-col gap-3">
          <label
            v-for="option in DISCOUNT_CREATE_OPTIONS"
            :key="option.slug"
            class="flex cursor-pointer items-start gap-3 rounded-2xl border border-grey-50 p-4 transition-colors"
            :class="
              selected === option.slug
                ? 'border-primary-500 bg-primary-50/40 shadow-[0_0_0_1px_rgba(22,163,74,0.08)]'
                : 'hover:border-grey-100 hover:bg-grey-25'
            "
          >
            <RadioGroupItem :value="option.slug" class="mt-0.5" />
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-2">
                <span class="block text-sm font-medium text-grey-900">{{ option.label }}</span>
                <span
                  v-if="isCouponType(option.slug)"
                  class="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-600"
                >
                  <TicketPercent class="size-3" />
                  Coupon
                </span>
              </span>
              <span class="mt-1 block text-xs leading-5 text-grey-500">{{ option.snippet }}</span>
            </span>
          </label>
        </RadioGroup>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" size="medium" @click="open = false">Cancel</Button>
        <Button type="button" size="medium" :disabled="!selected" @click="onConfirm">Continue</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
