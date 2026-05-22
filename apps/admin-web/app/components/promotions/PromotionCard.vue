<script setup lang="ts">
import { Checkbox, StatusTag, cn } from '@gosource/ui';
import PromotionActionsMenu from '~/components/promotions/PromotionActionsMenu.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { promotionStatusVariant } from '~/lib/promotion-constants';
import type { AdminPromotionListItem } from '~/types/promotions';

const props = defineProps<{
  promotion: AdminPromotionListItem;
  selected?: boolean;
  busy?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  toggleSelect: [id: string, selected: boolean];
  edit: [];
  duplicate: [];
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
          @update:model-value="emit('toggleSelect', promotion.id, $event === true)"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-grey-900">{{ promotion.name }}</p>
          <p class="mt-0.5 line-clamp-2 text-sm text-grey-500">{{ promotion.description }}</p>
        </div>
      </div>
      <PromotionActionsMenu
        :promotion="promotion"
        :disabled="busy"
        @edit="emit('edit')"
        @duplicate="emit('duplicate')"
        @activate="emit('activate')"
        @deactivate="emit('deactivate')"
        @delete="emit('delete')"
      />
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <StatusTag :variant="promotionStatusVariant(promotion.status)" size="medium">
        {{ promotion.statusLabel }}
      </StatusTag>
      <span
        v-if="promotion.discountLabel !== '—'"
        class="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
      >
        {{ promotion.discountLabel }}
      </span>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Usage">
        {{ promotion.usageCount }} {{ promotion.usageCount === 1 ? 'order' : 'orders' }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Items">
        {{ promotion.itemsCount }} {{ promotion.itemsCount === 1 ? 'item' : 'items' }}
      </AdminMobileCardStat>
    </div>
  </article>
</template>
