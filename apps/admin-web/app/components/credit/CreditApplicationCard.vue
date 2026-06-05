<script setup lang="ts">
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusTag,
  cn,
} from '@gosource/ui';
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { creditStatusVariant } from '~/lib/credit-constants';
import { CREDIT_CARD_SHELL_CLASS } from '~/lib/credit-page-layout';
import type { AdminCreditApplicationListItem } from '~/types/credit';

const props = defineProps<{
  application: AdminCreditApplicationListItem;
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
          :aria-label="`Select ${application.reference}`"
          @click.stop
          @update:model-value="emit('toggleSelect', application.id, $event === true)"
        />
        <div class="min-w-0">
          <p class="truncate font-semibold text-grey-900">{{ application.reference }}</p>
          <p class="mt-0.5 text-sm text-grey-500">{{ application.createdAtLabel }}</p>
        </div>
      </div>
      <div class="shrink-0" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <CreditTableActionsTrigger aria-label="Application actions" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="emit('view')">View details</DropdownMenuItem>
            <DropdownMenuItem
              v-if="application.businessId"
              @select="emit('viewCreditHistory')"
            >
              View credit history
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <p class="mt-3 truncate text-sm font-medium text-grey-800">{{ application.displayName }}</p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <span class="rounded-lg bg-grey-55 px-2 py-0.5 text-xs text-grey-700">
        {{ application.applicationTypeLabel }}
      </span>
      <StatusTag :variant="creditStatusVariant(application.status)" size="medium" class="capitalize">
        {{ application.statusLabel }}
      </StatusTag>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Application type">
        {{ application.applicationTypeLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Status">
        {{ application.statusLabel }}
      </AdminMobileCardStat>
    </div>
  </article>
</template>
