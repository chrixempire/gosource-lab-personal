<script setup lang="ts">
import PromotionForm from '~/components/promotions/PromotionForm.vue';
import PromotionFormPageHeader from '~/components/promotions/PromotionFormPageHeader.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePromotionMutations } from '~/composables/usePromotionMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { createEmptyPromotionFormValues, validatePromotionForm } from '~/lib/promotion-form';

const router = useRouter();
const { createPromotion, busyPromotionId } = usePromotionMutations();
const form = reactive(createEmptyPromotionFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyPromotionId.value === 'create');

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }
  void navigateTo(ADMIN_PAGE_ROUTES.PROMOTIONS);
}

async function onSubmit() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k]);
  Object.assign(fieldErrors, validatePromotionForm(form));
  if (Object.keys(fieldErrors).length > 0) return;

  try {
    await createPromotion(form);
    goBack();
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: '' });

useHead({ title: 'Create promotion' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <PromotionFormPageHeader
      title="Create promotion"
      save-label="Create promotion"
      :save-loading="submitting"
      @back="goBack"
      @save="onSubmit"
    />

    <PromotionForm v-model="form" v-model:field-errors="fieldErrors" mode="create" />
  </div>
</template>
