<script setup lang="ts">
import { Checkbox, StatusTag, Switch, cn } from '@gosource/ui';
import CustomerActionsMenu from '~/components/customers/CustomerActionsMenu.vue';
import AdminMobileCardStat from '~/components/shared/AdminMobileCardStat.vue';
import { customerAccountTypeVariant, customerStatusVariant } from '~/lib/customer-constants';
import type { AdminCustomerListItem } from '~/types/customers';

const props = defineProps<{
  customer: AdminCustomerListItem;
  selected?: boolean;
  busy?: boolean;
  class?: string;
}>();

const emit = defineEmits<{
  toggleSelect: [id: string, selected: boolean];
  view: [];
  toggleCredit: [];
  resetPassword: [];
  activate: [];
  deactivateAccount: [];
  deleteAccount: [];
}>();
</script>

<template>
  <article
    :class="
      cn(
        'box-border flex h-full w-full min-w-0 cursor-pointer flex-col rounded-[24px] border border-grey-50 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(16,24,40,0.12)] transition-colors duration-150 hover:border-primary-100 hover:bg-primary-50/50 sm:p-5',
        props.class,
      )
    "
    @click="emit('view')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          :model-value="selected"
          :aria-label="`Select ${customer.displayName}`"
          @click.stop
          @update:model-value="emit('toggleSelect', customer.id, $event === true)"
        />
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full border border-grey-50 bg-grey-55 text-sm font-semibold text-grey-700"
          :class="customer.accountType === 'individual' ? '' : 'rounded-xl'"
        >
          {{ customer.initials }}
        </div>
        <div class="min-w-0">
          <p class="truncate font-semibold text-grey-900">{{ customer.displayName }}</p>
          <p class="mt-0.5 truncate text-sm text-grey-500">{{ customer.email }}</p>
        </div>
      </div>
      <CustomerActionsMenu
        :customer="customer"
        :loading="busy"
        @view="emit('view')"
        @reset-password="emit('resetPassword')"
        @activate="emit('activate')"
        @deactivate-account="emit('deactivateAccount')"
        @delete-account="emit('deleteAccount')"
      />
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <StatusTag
        :variant="customerAccountTypeVariant(customer.accountType)"
        size="medium"
      >
        {{ customer.accountTypeLabel }}
      </StatusTag>
      <StatusTag :variant="customerStatusVariant(customer.status)" size="medium">
        {{ customer.statusLabel }}
      </StatusTag>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <AdminMobileCardStat label="Phone">
        {{ customer.phoneNumber }}
      </AdminMobileCardStat>
      <AdminMobileCardStat label="Date joined">
        {{ customer.createdAtLabel }}
      </AdminMobileCardStat>
    </div>

    <div class="mt-4 flex items-center justify-between border-t border-grey-50 pt-4" @click.stop>
      <span class="text-sm text-grey-600">Use credit</span>
      <Switch
        :model-value="customer.useCredit"
        :disabled="busy"
        :aria-label="`Use credit for ${customer.displayName}`"
        @update:model-value="emit('toggleCredit')"
      />
    </div>
  </article>
</template>
