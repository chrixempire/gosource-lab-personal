<script setup lang="ts">
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { customerDetailPath } from '~/lib/admin-routes';
import { formatCreditDate } from '~/lib/credit-api';

const props = defineProps<{
  businessId?: string;
  displayName: string;
  phoneNumber?: string;
  cacRegistrationNumber?: string;
  tin?: string;
  dateJoined?: string;
  dateApplied?: string;
}>();

const fields = computed(() => [
  { label: 'Business name', text: props.displayName },
  { label: 'Phone number', text: props.phoneNumber || '—' },
  { label: 'CAC registration number', text: props.cacRegistrationNumber || '—' },
  { label: 'TIN', text: props.tin || '—' },
  { label: 'Date joined', text: formatCreditDate(props.dateJoined) },
  { label: 'Date applied', text: formatCreditDate(props.dateApplied) },
]);
</script>

<template>
  <CreditPanelCard title="Business information">
    <div class="space-y-6">
      <div class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-grey-500">
          {{ fields[0]?.label }}
        </p>
        <p class="text-sm font-semibold text-grey-900">{{ fields[0]?.text }}</p>
      </div>
      <div v-for="field in fields.slice(1)" :key="field.label" class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-grey-500">
          {{ field.label }}
        </p>
        <p class="text-sm font-medium text-grey-800">{{ field.text }}</p>
      </div>
      <div v-if="businessId" class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-grey-500">Business documents</p>
        <NuxtLink
          :to="`${customerDetailPath(businessId)}`"
          class="text-sm font-medium text-primary-600 underline underline-offset-2"
        >
          View business documents
        </NuxtLink>
      </div>
    </div>
  </CreditPanelCard>
</template>
