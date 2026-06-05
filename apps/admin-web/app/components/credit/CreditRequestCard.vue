<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusTag,
  Checkbox,
  cn,
} from '@gosource/ui';
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { creditStatusVariant } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_CARD_SHELL_CLASS } from '~/lib/credit-page-layout';
import type { AdminCreditRequestListItem } from '~/types/credit';

const props = defineProps<{
  request: AdminCreditRequestListItem;
  selected?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  toggleSelect: [id: string, selected: boolean];
  view: [];
  viewCreditHistory: [];
}>();
</script>

<template>
  <article
    :class="cn(CREDIT_CARD_SHELL_CLASS, props.class)"
    @click="emit('view')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          :model-value="selected"
          :aria-label="`Select request #${request.reference}`"
          @click.stop
          @update:model-value="emit('toggleSelect', request.id, $event === true)"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-grey-900">#{{ request.reference }}</p>
          <p class="mt-0.5 text-sm text-grey-500">{{ request.createdAtLabel }}</p>
        </div>
      </div>
      <div class="shrink-0" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <CreditTableActionsTrigger aria-label="Credit request actions" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="emit('view')">View details</DropdownMenuItem>
            <DropdownMenuItem
              v-if="request.businessId"
              @select="emit('viewCreditHistory')"
            >
              View credit history
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <p class="mt-3 truncate text-sm font-medium text-grey-800">{{ request.displayName }}</p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span class="rounded-lg bg-grey-55 px-2 py-0.5 text-xs text-grey-700">
        {{ request.requestTypeLabel }}
      </span>
      <StatusTag :variant="creditStatusVariant(request.status)" size="medium" class="capitalize">
        {{ request.statusLabel }}
      </StatusTag>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Requested">
        {{ formatCreditFromKobo(request.requestedAmountKobo) }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Credit limit">
        {{ formatCreditFromKobo(request.creditLimitKobo) }}
      </AdminMobileCardStat>
    </div>
  </article>
</template>
