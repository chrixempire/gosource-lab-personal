<script setup lang="ts">
import {
  StatusTag,
  TableBody,
  TableCell,
  TableHeadRow,
  TableHeader,
  TableRow,
  TableShell,
  TableSkeleton,
} from '@gosource/ui';
import { CUSTOMER_TABLE_DATA_ROW_CLASS } from '~/lib/customer-table-layout';
import type { RequestListItem } from '~/components/requests/RequestCards.vue';

defineProps<{
  branchName: string;
  requests: RequestListItem[];
  loading?: boolean;
  currentRequestId: string;
}>();

const emit = defineEmits<{
  select: [request: RequestListItem];
}>();

const gridTemplate = 'minmax(0,1.2fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.8fr)';

const skeletonColumns = [
  { kind: 'stack' as const, lineClass: 'w-full', sublineClass: 'w-2/3' },
  { kind: 'line' as const, lineClass: 'w-full' },
  { kind: 'line' as const, lineClass: 'h-7 w-24 rounded-full' },
  { kind: 'line' as const, lineClass: 'w-20' },
];
</script>

<template>
  <section class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-semibold text-grey-900">
        Other requests from this branch
      </h2>
      <p class="mt-1 text-sm text-grey-text">
        More order requests from {{ branchName }}.
      </p>
    </div>

    <div class="hidden md:block">
      <TableShell class="flex flex-col">
        <TableHeader>
          <TableHeadRow :style="{ gridTemplateColumns: gridTemplate }">
            <TableCell>Request</TableCell>
            <TableCell>Initiator</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total</TableCell>
          </TableHeadRow>
        </TableHeader>

        <TableSkeleton
          v-if="loading"
          :columns="skeletonColumns"
          :grid-template-columns="gridTemplate"
          :row-count="4"
        />

        <TableBody v-else-if="requests.length">
          <TableRow
            v-for="request in requests"
            :key="request.id"
            :class="CUSTOMER_TABLE_DATA_ROW_CLASS"
            :style="{ gridTemplateColumns: gridTemplate }"
            @click="emit('select', request)"
          >
            <TableCell>
              <p class="truncate text-sm font-semibold text-grey-900">
                {{ request.reference }}
              </p>
              <p class="truncate text-xs text-grey-300">
                {{ request.createdLabel }}
              </p>
            </TableCell>
            <TableCell>
              <p class="truncate text-sm font-medium text-grey-900">
                {{ request.initiatorName }}
              </p>
            </TableCell>
            <TableCell>
              <StatusTag
                :variant="request.statusVariant"
                size="medium"
                class="rounded-full px-3 py-1 text-xs font-semibold normal-case"
              >
                {{ request.statusLabel }}
              </StatusTag>
            </TableCell>
            <TableCell>
              <p class="text-sm font-medium text-grey-900">
                {{ request.amountLabel }}
              </p>
            </TableCell>
          </TableRow>
        </TableBody>

        <div
          v-else
          class="flex min-h-[120px] items-center justify-center px-6 text-sm text-grey-300"
        >
          No other requests for this branch.
        </div>
      </TableShell>
    </div>

    <div v-if="loading" class="grid gap-3 md:hidden">
      <div
        v-for="index in 3"
        :key="index"
        class="rounded-[18px] border border-grey-50 bg-background-on-canvas p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-4 max-w-[10rem] animate-pulse rounded-md bg-grey-55" />
            <div class="h-3 w-24 animate-pulse rounded-md bg-grey-55" />
          </div>
          <div class="h-7 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-grey-55" />
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-[16px] bg-grey-55 px-4 py-3">
            <div class="h-3 w-16 animate-pulse rounded-full bg-grey-100" />
            <div class="mt-2 h-4 w-24 animate-pulse rounded-full bg-grey-100" />
          </div>
          <div class="rounded-[16px] bg-grey-55 px-4 py-3">
            <div class="h-3 w-16 animate-pulse rounded-full bg-grey-100" />
            <div class="mt-2 h-4 w-20 animate-pulse rounded-full bg-grey-100" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="requests.length" class="grid gap-3 md:hidden">
      <article
        v-for="request in requests"
        :key="request.id"
        class="cursor-pointer rounded-[18px] border border-grey-50 bg-background-on-canvas p-4 transition-colors duration-150 hover:bg-primary-50/45"
        @click="emit('select', request)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-semibold text-grey-900">
              {{ request.reference }}
            </p>
            <p class="mt-1 truncate text-sm text-grey-300">
              {{ request.createdLabel }}
            </p>
          </div>
          <StatusTag
            :variant="request.statusVariant"
            size="medium"
            class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold normal-case"
          >
            {{ request.statusLabel }}
          </StatusTag>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-[16px] bg-grey-55 px-4 py-3">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Initiator
            </p>
            <p class="mt-1 text-sm font-semibold text-grey-900">
              {{ request.initiatorName }}
            </p>
          </div>
          <div class="rounded-[16px] bg-grey-55 px-4 py-3">
            <p class="text-xs font-medium uppercase tracking-[0.08em] text-grey-300">
              Total
            </p>
            <p class="mt-1 text-sm font-semibold text-grey-900">
              {{ request.amountLabel }}
            </p>
          </div>
        </div>
      </article>
    </div>

    <div
      v-else
      class="rounded-[18px] border border-grey-50 bg-background-on-canvas px-6 py-12 text-center text-sm text-grey-300 md:hidden"
    >
      No other requests for this branch.
    </div>
  </section>
</template>
