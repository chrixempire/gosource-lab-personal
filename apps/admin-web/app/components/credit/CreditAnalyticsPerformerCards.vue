<script setup lang="ts">
import { Avatar } from '@gosource/ui';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import AdminMobileCardsSkeleton from '~/components/shared/AdminMobileCardsSkeleton.vue';
import { formatCreditFromKobo } from '~/lib/credit-money';
import { CREDIT_CARD_SHELL_CLASS, CREDIT_CARDS_GRID_CLASS } from '~/lib/credit-page-layout';
import type { CreditTopPerformerRow } from '~/types/credit';

defineProps<{
  rows: CreditTopPerformerRow[];
  loading?: boolean;
}>();

function performerInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?'
  );
}

function avatarFallbackClass(isInactive: boolean) {
  return isInactive
    ? '!bg-grey-55 !text-grey-400'
    : '!bg-primary-50 !text-primary-700';
}
</script>

<template>
  <AdminMobileCardsSkeleton v-if="loading" />

  <div v-else-if="!rows.length" class="rounded-xl border border-grey-50 bg-white px-4 py-10 text-center text-sm text-grey-500">
    No performers match your search.
  </div>

  <div v-else :class="CREDIT_CARDS_GRID_CLASS">
    <article
      v-for="row in rows"
      :key="row.businessId"
      :class="CREDIT_CARD_SHELL_CLASS"
    >
      <div class="flex min-w-0 items-center gap-3">
        <Avatar
          size="md"
          :alt="row.displayName"
          :fallback="performerInitials(row.displayName)"
          :class="row.accountType === 'individual' ? 'rounded-full' : 'rounded-lg'"
          :fallback-class="avatarFallbackClass(row.status === 'inactive')"
        />
        <p class="truncate text-sm font-semibold text-grey-900">{{ row.displayName }}</p>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <AdminMobileCardStat label="Credit limit">
          {{ formatCreditFromKobo(row.creditLimitKobo) }}
        </AdminMobileCardStat>
        <AdminMobileCardStat label="Credit used">
          {{ formatCreditFromKobo(row.creditUsedKobo) }}
        </AdminMobileCardStat>
        <AdminMobileCardStat label="Repayment score" class="col-span-2">
          {{ row.repaymentScore }}
        </AdminMobileCardStat>
      </div>
    </article>
  </div>
</template>
