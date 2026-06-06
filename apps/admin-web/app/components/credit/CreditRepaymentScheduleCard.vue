<script setup lang="ts">
import { StatusTag, cn } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { creditRepaymentScheduleStatusVariant } from '~/lib/credit-constants';
import { CREDIT_CARD_SHELL_CLASS } from '~/lib/credit-page-layout';
import type { AdminRepaymentScheduleListItem } from '~/types/credit';

const props = defineProps<{
  schedule: AdminRepaymentScheduleListItem;
  showDaysOverdue?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  view: [];
}>();
</script>

<template>
  <article
    :class="cn(CREDIT_CARD_SHELL_CLASS, props.class)"
    @click="emit('view')"
  >
    <div class="min-w-0">
      <p class="truncate font-semibold text-grey-900">{{ schedule.displayName }}</p>
      <p class="mt-0.5 text-sm text-grey-500">
        Installment {{ schedule.installmentNumber || '—' }}
      </p>
    </div>

    <div class="mt-3">
      <StatusTag
        :variant="creditRepaymentScheduleStatusVariant(schedule.status)"
        size="medium"
        class="capitalize"
      >
        {{ schedule.statusLabel }}
      </StatusTag>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Due date">
        {{ schedule.dueDateLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Amount due">
        {{ schedule.amountDueLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Remaining">
        {{ schedule.remainingAmountLabel }}
      </AdminMobileCardStat>
      <AdminMobileCardStat v-if="showDaysOverdue" label="Days overdue">
        <span class="text-error-600">{{ schedule.daysOverdue ?? '—' }}</span>
      </AdminMobileCardStat>
      <AdminMobileCardStat v-else label="Reference">
        {{ schedule.referenceLabel }}
      </AdminMobileCardStat>
    </div>
  </article>
</template>
