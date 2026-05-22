<script setup lang="ts">
import { StatusTag, Switch } from '@gosource/ui';
import {
  customerAccountTypeLabel,
  customerAccountTypeVariant,
  customerStatusVariant,
} from '~/lib/customer-constants';
import type { CustomerDetailView } from '~/types/customers';

const props = defineProps<{
  customer: CustomerDetailView;
  busy?: boolean;
}>();

const emit = defineEmits<{
  toggleCredit: [];
}>();

const rows = computed(() => [
  { label: 'Email', value: props.customer.email },
  { label: 'Phone', value: props.customer.phoneNumber },
  { label: 'Account type', value: customerAccountTypeLabel(props.customer.accountType) },
  { label: 'Status', value: props.customer.statusLabel },
  { label: 'Date joined', value: props.customer.createdAtLabel },
]);
</script>

<template>
  <section
    class="space-y-5 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
  >
    <div class="space-y-3">
      <h2 class="text-base font-semibold text-grey-900">Basic details</h2>
      <div class="h-px w-full bg-grey-50" />
    </div>

    <dl class="space-y-4">
      <div
        v-for="row in rows"
        :key="row.label"
        class="space-y-1"
      >
        <dt class="text-sm font-semibold text-grey-700">{{ row.label }}</dt>
        <dd class="text-sm text-grey-900">{{ row.value }}</dd>
      </div>

      <div class="space-y-3 border-t border-grey-50 pt-4">
        <div class="flex items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-sm font-semibold text-grey-700">Use credit</p>
            <p class="text-sm text-grey-900">
              {{ customer.useCredit ? 'Enabled' : 'Disabled' }}
            </p>
          </div>
          <Switch
            :model-value="customer.useCredit"
            :disabled="busy"
            aria-label="Toggle credit availability"
            @update:model-value="emit('toggleCredit')"
          />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-lg bg-grey-55 px-3 py-2.5">
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Account status</p>
            <StatusTag :variant="customerStatusVariant(customer.status)" size="medium">
              {{ customer.statusLabel }}
            </StatusTag>
          </div>
          <div class="space-y-1 text-right">
            <p class="text-xs font-semibold uppercase tracking-wide text-grey-500">Customer type</p>
            <StatusTag
              :variant="customerAccountTypeVariant(customer.accountType)"
              size="medium"
            >
              {{ customerAccountTypeLabel(customer.accountType) }}
            </StatusTag>
          </div>
        </div>
      </div>
    </dl>
  </section>
</template>
