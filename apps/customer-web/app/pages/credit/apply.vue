<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ChevronLeft } from 'lucide-vue-next';
import CreditApplyWizard from '~/components/credit/CreditApplyWizard.vue';
import { useCreditApplyAccess } from '~/composables/useCreditApplyAccess';
import { CREDIT_PAGE_ROUTES } from '~/lib/credit-routes';

const { checkingAccess, canApplyForCredit, ensureCanApplyForCredit } = useCreditApplyAccess();

onMounted(() => {
  void ensureCanApplyForCredit({ redirectOnDenied: true });
});
</script>

<template>
  <div
    v-if="checkingAccess || !canApplyForCredit"
    class="flex min-h-[40vh] items-center justify-center"
  >
    <p class="text-sm text-grey-400">{{ checkingAccess ? 'Checking access…' : 'Redirecting…' }}</p>
  </div>

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
