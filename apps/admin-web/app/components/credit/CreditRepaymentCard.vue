<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusTag,
  cn,
} from '@gosource/ui';
import CreditTableActionsTrigger from '~/components/credit/CreditTableActionsTrigger.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { creditPaymentStatusLabel, creditPaymentStatusVariant } from '~/lib/credit-constants';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_CARD_SHELL_CLASS } from '~/lib/credit-page-layout';
import type { AdminRepaymentListItem, CreditPaymentStatus } from '~/types/credit';

const props = defineProps<{
  repayment: AdminRepaymentListItem;
  allowManage?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  updateStatus: [status: CreditPaymentStatus];
  downloadInvoice: [];
}>();
</script>

<template>
  <article :class="cn(CREDIT_CARD_SHELL_CLASS, 'cursor-default hover:bg-white', props.class)">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate font-semibold text-grey-900">{{ repayment.referenceCode }}</p>
        <p class="mt-0.5 truncate text-sm text-grey-500">{{ repayment.businessName }}</p>
      </div>
      <div class="shrink-0" @click.stop>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <CreditTableActionsTrigger aria-label="Repayment actions" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="emit('downloadInvoice')">
              Download invoice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Payment date">
        {{ repayment.paymentDateLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Amount paid">
        {{ formatCreditFromKobo(repayment.amountKobo) }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Method">
        {{ repayment.paymentMethodLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Status">
        <StatusTag :variant="creditPaymentStatusVariant(repayment.status)" size="medium">
          {{ creditPaymentStatusLabel(repayment.status) }}
        </StatusTag>
      </AdminMobileCardStat>
    </div>

    <div
      v-if="repayment.status === 'PENDING_APPROVAL' && allowManage"
      class="mt-4 flex flex-wrap gap-2"
    >
      <Button
        type="button"
        size="small"
        variant="primary"
        @click="emit('updateStatus', 'COMPLETED')"
      >
        Confirm
      </Button>
      <Button
        type="button"
        size="small"
        variant="outline"
        @click="emit('updateStatus', 'CANCELLED')"
      >
        Reject
      </Button>
    </div>
  </article>
</template>
