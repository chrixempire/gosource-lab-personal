<script setup lang="ts">
import { Checkbox, StatusTag, cn } from '@gosource/ui';
import { Check, Copy } from 'lucide-vue-next';
import DiscountActionsMenu from '~/components/discounts/DiscountActionsMenu.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { discountStatusVariant } from '~/lib/discount-constants';
import type { AdminDiscountListItem } from '~/types/discounts';

const props = defineProps<{
  discount: AdminDiscountListItem;
  selected?: boolean;
  busy?: boolean;
  copied?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  toggleSelect: [id: string, selected: boolean];
  copy: [];
  edit: [];
  activate: [];
  deactivate: [];
  delete: [];
}>();
</script>

<template>
  <article
    :class="
      cn(
        'flex flex-col rounded-[24px] border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] sm:p-5',
        props.class,
      )
    "
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          :model-value="selected"
          @update:model-value="emit('toggleSelect', discount.id, $event === true)"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate font-semibold text-grey-900">{{ discount.code }}</p>
            <button
              type="button"
              class="cursor-pointer text-grey-400 transition-colors hover:text-primary-600"
              @click.stop="emit('copy')"
            >
              <Check v-if="copied" class="size-4 text-primary-500" />
              <Copy v-else class="size-4" />
            </button>
          </div>
          <p class="mt-0.5 text-sm text-grey-500">{{ discount.description }}</p>
        </div>
      </div>
      <DiscountActionsMenu
        :discount="discount"
        :disabled="busy"
        @copy="emit('copy')"
        @edit="emit('edit')"
        @activate="emit('activate')"
        @deactivate="emit('deactivate')"
        @delete="emit('delete')"
      />
    </div>

    <div class="mt-3">
      <StatusTag :variant="discountStatusVariant(discount.status)" size="medium">
        {{ discount.statusLabel }}
      </StatusTag>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Type">{{ discount.categoryLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Expires">{{ discount.expiryDateLabel }}</AdminMobileCardStat>
      <AdminMobileCardStat label="Usage">
        {{ `${discount.usageCount}/${discount.usageLimit > 0 ? discount.usageLimit : '∞'}` }}
      </AdminMobileCardStat>
    </div>
  </article>
</template>
