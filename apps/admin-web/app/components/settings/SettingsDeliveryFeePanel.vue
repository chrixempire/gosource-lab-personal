<script setup lang="ts">
import { Button, Input, StatusTag } from '@gosource/ui';
import SettingsTwoColumnSkeleton from '~/components/settings/skeletons/SettingsTwoColumnSkeleton.vue';

const props = defineProps<{
  config: DeliveryFeeConfig | null;
  loading?: boolean;
}>();
import { useSettingsMutations } from '~/composables/useSettingsMutations';
import type { DeliveryFeeConfig } from '~/types/settings';

const emit = defineEmits<{ saved: [] }>();

const { busyKey, updateDeliveryFee } = useSettingsMutations();

const form = reactive({
  threshold: '',
  baseFee1: '',
  percentage1: '',
  baseFee2: '',
  percentage2: '',
});

const fieldErrors = reactive<Record<string, string>>({});

watch(
  () => props.config,
  (config) => {
    if (!config) return;
    form.threshold = String(config.threshold ?? '');
    form.baseFee1 = String(config.baseFee1 ?? '');
    form.baseFee2 = String(config.baseFee2 ?? '');
    form.percentage1 = String(Math.round((config.percentage1 ?? 0) * 10000) / 100);
    form.percentage2 = String(Math.round((config.percentage2 ?? 0) * 10000) / 100);
  },
  { immediate: true },
);

function validate() {
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);
  const required = ['threshold', 'baseFee1', 'baseFee2', 'percentage1', 'percentage2'] as const;
  required.forEach((key) => {
    if (!String(form[key]).trim()) fieldErrors[key] = 'This field is required';
  });
  return Object.keys(fieldErrors).length === 0;
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

async function onSubmit() {
  if (!validate()) return;
  try {
    await updateDeliveryFee({
      threshold: Number(form.threshold),
      baseFee1: Number(form.baseFee1),
      baseFee2: Number(form.baseFee2),
      percentage1: Number((Number(form.percentage1) / 100).toFixed(4)),
      percentage2: Number((Number(form.percentage2) / 100).toFixed(4)),
    });
    emit('saved');
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <SettingsTwoColumnSkeleton v-if="loading" :main-field-count="5" :sidebar-rows="3" />

  <div v-else class="flex flex-col gap-6 lg:flex-row">
    <section
      class="w-full max-w-sm rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Fees & charges</h2>
      <div v-if="config" class="mt-5 space-y-4">
        <div>
          <p class="text-xs text-grey-500">Threshold</p>
          <StatusTag variant="info" size="medium" class="mt-1 rounded-lg normal-case">
            {{ formatNaira(config.threshold) }}
          </StatusTag>
        </div>
        <div>
          <p class="text-sm font-semibold text-grey-900">Below threshold</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <StatusTag variant="default" size="medium" class="rounded-lg normal-case">
              {{ formatNaira(config.baseFee1) }} base
            </StatusTag>
            <StatusTag variant="default" size="medium" class="rounded-lg normal-case">
              {{ Math.round(config.percentage1 * 10000) / 100 }}%
            </StatusTag>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold text-grey-900">Above threshold</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <StatusTag variant="default" size="medium" class="rounded-lg normal-case">
              {{ formatNaira(config.baseFee2) }} base
            </StatusTag>
            <StatusTag variant="default" size="medium" class="rounded-lg normal-case">
              {{ Math.round(config.percentage2 * 10000) / 100 }}%
            </StatusTag>
          </div>
        </div>
      </div>
      <p v-else class="mt-5 text-sm text-grey-500">No delivery fee configured yet.</p>
    </section>

    <section
      class="min-w-0 flex-1 rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
    >
      <h2 class="text-base font-semibold text-grey-900">Delivery fee</h2>
      <form class="mt-5 space-y-4" @submit.prevent="onSubmit">
        <Input
          v-model="form.threshold"
          label="Order threshold (₦)"
          type="number"
          placeholder="e.g ₦1,000,000"
          :invalid="Boolean(fieldErrors.threshold)"
        />

        <p class="text-xs font-medium text-grey-500">Orders below threshold</p>
        <div class="grid gap-4 md:grid-cols-2">
          <Input
            v-model="form.baseFee1"
            label="Base fee"
            type="number"
            placeholder="e.g ₦18,000"
            :invalid="Boolean(fieldErrors.baseFee1)"
          />
          <Input
            v-model="form.percentage1"
            label="Percentage charge (%)"
            type="number"
            placeholder="e.g 2%"
            :invalid="Boolean(fieldErrors.percentage1)"
          />
        </div>

        <p class="text-xs font-medium text-grey-500">Orders above threshold</p>
        <div class="grid gap-4 md:grid-cols-2">
          <Input
            v-model="form.baseFee2"
            label="Base fee"
            type="number"
            placeholder="e.g ₦33,000"
            :invalid="Boolean(fieldErrors.baseFee2)"
          />
          <Input
            v-model="form.percentage2"
            label="Percentage charge (%)"
            type="number"
            placeholder="e.g 1%"
            :invalid="Boolean(fieldErrors.percentage2)"
          />
        </div>

        <Button type="submit" size="small" class="!w-fit" :loading="busyKey === 'delivery-fee'">
          Save changes
        </Button>
      </form>
    </section>
  </div>
</template>
