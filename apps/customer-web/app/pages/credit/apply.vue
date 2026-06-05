<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CreditApplyWizard from '~/components/credit/CreditApplyWizard.vue';
import { isBusinessOwnerSession } from '~/lib/customer-roles';
import { CREDIT_PAGE_ROUTES } from '~/lib/credit-routes';

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const isOwner = computed(() => isBusinessOwnerSession(session.value));

watch(
  session,
  (value) => {
    if (value && !isBusinessOwnerSession(value)) {
      void navigateTo(CREDIT_PAGE_ROUTES.HOME, { replace: true });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="!isOwner" class="text-sm text-grey-400">Redirecting…</div>
  <div v-else class="flex flex-col gap-6">
    <div class="w-fit self-start">
      <Button
        type="button"
        variant="neutral"
        size="small"
        class="!w-fit shrink-0"
        :left-icon="ChevronLeft"
        @click="navigateTo(CREDIT_PAGE_ROUTES.HOME)"
      >
        Back to credit
      </Button>
    </div>

    <CreditApplyWizard />
  </div>
</template>
