<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusTag,
} from '@gosource/ui';
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import CreditTablePagination from '~/components/credit/CreditTablePagination.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { creditStatusVariant } from '~/lib/credit-constants';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';
import type { InventoryTableMeta } from '~/types/inventory';

type CreditHistoryRow = {
  id: string;
  reference: string;
  createdAtLabel: string;
  requestType: string;
  requestedAmountKobo: number;
  approvedAmountKobo: number;
  repaidAmountKobo: number;
  status: string;
  statusLabel: string;
};

defineProps<{
  rows: CreditHistoryRow[];
  meta: InventoryTableMeta;
  pending?: boolean;
}>();

const emit = defineEmits<{
  viewDetails: [id: string];
  page: [page: number];
  pageSize: [limit: number];
}>();
</script>

<template>
  <div class="space-y-4">
    <AdminMobileCardsSkeleton v-if="pending" :count="8" />

    <p
      v-else-if="!rows.length"
      class="rounded-xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500"
    >
      No credit history available yet
    </p>

    <template v-else>
      <div :class="CREDIT_CARDS_GRID_CLASS">
        <article
          v-for="row in rows"
          :key="row.id"
          :class="CREDIT_CARD_SHELL_CLASS"
          @click="emit('viewDetails', row.id)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-grey-900">{{ row.reference }}</p>
              <p class="mt-1 text-xs text-grey-500">{{ row.createdAtLabel }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2" @click.stop>
              <StatusTag :variant="creditStatusVariant(row.status)" class="capitalize">
                {{ row.statusLabel }}
              </StatusTag>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <CreditTableActionsTrigger aria-label="Credit history actions" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @select="emit('viewDetails', row.id)">
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Download invoice</DropdownMenuItem>
                  <DropdownMenuItem disabled>Send reminder</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p class="mt-3 text-sm font-medium capitalize text-grey-800">{{ row.requestType }}</p>

          <div class="mt-4 grid grid-cols-2 gap-3">
            <AdminMobileCardStat label="Requested">
              {{ formatCreditFromKobo(row.requestedAmountKobo) }}
            </AdminMobileCardStat>
            <AdminMobileCardStat label="Approved">
              {{ formatCreditFromKobo(row.approvedAmountKobo) }}
            </AdminMobileCardStat>
            <AdminMobileCardStat label="Repaid" class="col-span-2">
              {{ formatCreditFromKobo(row.repaidAmountKobo) }}
            </AdminMobileCardStat>
          </div>
        </article>
      </div>

      <CreditTablePagination
        v-if="meta.total > 0"
        standalone
        :meta="meta"
        @page="emit('page', $event)"
        @page-size="emit('pageSize', $event)"
      />
    </template>
  </div>
</template>
