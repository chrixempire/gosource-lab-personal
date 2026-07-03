<script setup lang="ts">
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import PromotionForm from '~/components/promotions/PromotionForm.vue';
import PromotionFormPageHeader from '~/components/promotions/PromotionFormPageHeader.vue';
import PromotionFormSkeleton from '~/components/promotions/PromotionFormSkeleton.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
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

const {
  data,
  pending,
  error,
  refresh,
  status: fetchStatus,
} = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/promotions/${promotionId.value}`,
  {
    watch: [promotionId],
    key: computed(() => `admin-promotion-detail:${promotionId.value}`),
    fastNav: false,
  },
);

const detail = computed(() => parsePromotionDetail(data.value));
const promotionStatus = computed(() =>
  detail.value ? computePromotionStatus(detail.value) : null,
);
const isWaitingForData = computed(
  () =>
    !detail.value &&
    (pending.value || fetchStatus.value === 'idle' || fetchStatus.value === 'pending'),
);
const showInitialSkeleton = computed(() => isWaitingForData.value);
const showLoadError = computed(() => !detail.value && !isWaitingForData.value);

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
    goBack();
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: 'Promotion details' });

useHead({
  title: computed(() =>
    detail.value?.name
      ? `${detail.value.name} · Promotion details`
      : 'Promotion details',
  ),
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-4">
    <PromotionFormPageHeader
      :title="detail?.name"
      :status="promotionStatus"
      :loading="showInitialSkeleton"
      save-label="Save changes"
      :save-loading="submitting"
      :save-disabled="showInitialSkeleton"
      @back="goBack"
      @save="onSubmit"
    />

    <LoadErrorState
      v-if="showLoadError"
      :error="error"
      not-found-title="Promotion not found"
      resource-label="promotion"
      @retry="refresh()"
    />

    <template v-else>
      <PromotionFormSkeleton v-if="showInitialSkeleton" />

      <PromotionForm
        v-else
        v-model="form"
        v-model:field-errors="fieldErrors"
        mode="edit"
        :promotion-id="promotionId"
      />
    </template>
  </div>
</template>
