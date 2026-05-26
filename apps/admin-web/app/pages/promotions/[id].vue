<script setup lang="ts">
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import PromotionForm from '~/components/promotions/PromotionForm.vue';
import PromotionFormPageHeader from '~/components/promotions/PromotionFormPageHeader.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { usePromotionMutations } from '~/composables/usePromotionMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import {
  computePromotionStatus,
  parsePromotionDetail,
} from '~/lib/promotion-api';
import {
  createEmptyPromotionFormValues,
  mapPromotionToFormValues,
  validatePromotionForm,
} from '~/lib/promotion-form';

const route = useRoute();
const router = useRouter();
const promotionId = computed(() => String(route.params.id ?? ''));
const { updatePromotion, busyPromotionId } = usePromotionMutations();
const form = reactive(createEmptyPromotionFormValues());
const fieldErrors = reactive<Record<string, string>>({});
const submitting = computed(() => busyPromotionId.value === promotionId.value);

const { data, pending, error, refresh } = await useFetch<unknown>(
  () => `/api/promotions/${promotionId.value}`,
  { watch: [promotionId] },
);

const detail = computed(() => parsePromotionDetail(data.value));
const status = computed(() => (detail.value ? computePromotionStatus(detail.value) : null));

watch(
  data,
  (payload) => {
    const row = parsePromotionDetail(payload);
    if (row) {
      Object.assign(form, mapPromotionToFormValues(row));
    }
  },
  { immediate: true },
);

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
    await updatePromotion(promotionId.value, form);
    await refresh();
    await navigateTo(ADMIN_PAGE_ROUTES.PROMOTIONS);
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: '' });

useHead({
  title: computed(() =>
    detail.value?.name ? `${detail.value.name} · Promotions` : 'Edit promotion',
  ),
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <PromotionFormPageHeader
      :title="detail?.name"
      :status="status"
      :loading="pending"
      save-label="Save changes"
      :save-loading="submitting"
      :save-disabled="pending"
      @back="goBack"
      @save="onSubmit"
    />

    <LoadErrorState
      v-if="!pending && error"
      :error="error"
      not-found-title="Promotion not found"
      resource-label="promotion"
      @retry="refresh()"
    />

    <p v-else-if="pending" class="text-sm text-grey-500">Loading promotion…</p>

    <PromotionForm
      v-else-if="!error"
      v-model="form"
      v-model:field-errors="fieldErrors"
      mode="edit"
      :promotion-id="promotionId"
    />
  </div>
</template>
