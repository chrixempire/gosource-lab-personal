<script setup lang="ts">
import type { WalletTransactionRecord } from '@gosource/api-client';
import { StatusTag } from '@gosource/ui';
import {
  formatWalletTransactionAmount,
  walletTransactionStatusVariant,
  walletTransactionTypeIndicatorClass,
} from '~/lib/wallet-transaction-display';
import { formatRequestDate } from '~/lib/request-details';

defineProps<{
  transactions: WalletTransactionRecord[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  rowClick: [transaction: WalletTransactionRecord];
}>();

const cardArticleInteractiveClass =
  'cursor-pointer hover:border-primary-100 hover:bg-primary-50/50 hover:shadow-[0_22px_48px_-28px_rgba(16,24,40,0.2)] active:bg-primary-50/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500/35';

const cardArticleClass =
  'max-w-[500px] w-full min-w-0 flex-[1_1_320px] rounded-[24px] border border-grey-50 bg-white p-4 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.16)] transition-[background-color,box-shadow,border-color] duration-150';
</script>

<template>
  <div v-if="loading" class="flex flex-wrap gap-4">
    <div
      v-for="index in 4"
      :key="index"
      :class="cardArticleClass"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-5 max-w-[11rem] animate-pulse rounded-md bg-grey-55" />
          <div class="h-3.5 w-full max-w-[20rem] animate-pulse rounded-md bg-grey-55" />
        </div>
        <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div
          v-for="cardIndex in 4"
          :key="cardIndex"
          class="rounded-[18px] bg-grey-55 px-4 py-3"
        >
          <div class="h-3 w-20 animate-pulse rounded-full bg-grey-100" />
          <div class="mt-2 h-4 w-16 animate-pulse rounded-full bg-grey-100" />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="!transactions.length"
    class="rounded-[24px] border border-grey-50 bg-white px-6 py-14 text-center"
  >
    <p class="text-base font-semibold text-grey-900">No transactions found</p>
    <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-grey-300">
      Try a different filter or fund your wallet to see activity here.
    </p>
  </div>

  <div v-else class="flex flex-wrap gap-4">
    <article
      v-for="row in transactions"
      :key="row.id"
      :class="[cardArticleClass, cardArticleInteractiveClass]"
      role="button"
      tabindex="0"
      @click="emit('rowClick', row)"
      @keydown.enter="emit('rowClick', row)"
      @keydown.space.prevent="emit('rowClick', row)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-semibold text-grey-900">
            {{ row.description }}
          </p>
          <p class="mt-1 truncate text-sm text-grey-300">
            {{ row.reference }}
          </p>
        </div>
        <StatusTag
          :variant="walletTransactionStatusVariant(row.status)"
          size="medium"
          class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
        >
          {{ row.status }}
        </StatusTag>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Type
          </p>
          <div class="mt-1 flex items-center gap-2 capitalize">
            <span
              class="size-2 shrink-0 rounded-full"
              :class="walletTransactionTypeIndicatorClass(row.type)"
              aria-hidden="true"
            />
            <span class="text-sm font-semibold text-grey-900">{{ row.type }}</span>
          </div>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Amount
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ formatWalletTransactionAmount(row) }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Payment ref
          </p>
          <p class="mt-1 truncate text-sm font-semibold text-grey-900">
            {{ row.paymentReference || '—' }}
          </p>
        </div>
        <div class="rounded-[18px] bg-grey-55 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
            Date
          </p>
          <p class="mt-1 text-sm font-semibold text-grey-900">
            {{ formatRequestDate(row.createdAt) }}
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
