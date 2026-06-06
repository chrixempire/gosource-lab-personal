<script setup lang="ts">
import CreditDocumentRow from '~/components/credit/CreditDocumentRow.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';

const props = defineProps<{
  bvn?: string;
  identityType?: string;
  identityUrl?: string;
}>();

const identityTitle = computed(() => props.identityType?.trim() || 'Identity document');
const hasIdentityDocument = computed(
  () => Boolean(props.identityType?.trim() || props.identityUrl?.trim()),
);
</script>

<template>
  <CreditPanelCard title="KYC">
    <div class="space-y-6">
      <div class="space-y-1">
        <p class="text-xs text-grey-500">BVN</p>
        <p class="text-sm font-medium text-grey-900">{{ props.bvn || '—' }}</p>
      </div>

      <CreditDocumentRow
        v-if="hasIdentityDocument"
        :title="identityTitle"
        :url="props.identityUrl"
      />
      <p v-else class="text-sm text-grey-500">No identity document uploaded</p>
    </div>
  </CreditPanelCard>
</template>
