<script setup lang="ts">
import { DatePickerField } from '@gosource/ui';
import MessageFormHeader from '~/components/messages/MessageFormHeader.vue';
import LoadErrorState from '~/components/shared/LoadErrorState.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useMessageMutations } from '~/composables/useMessageMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { parseSingleMessage } from '~/lib/message-api';

type ColourOption = { name: string; hex: string };

const route = useRoute();
const messageId = computed(() => String(route.params.id ?? ''));
const loading = ref(true);
const loadError = ref<unknown>(null);
const { updateAlert, busyMessageId } = useMessageMutations();
const form = reactive({
  message: '',
  startDate: '',
  endDate: '',
  selectedColour: '',
});

const colourOptions: ColourOption[] = [
  { name: 'Warning', hex: '#D97706' },
  { name: 'Neutral', hex: '#374151' },
  { name: 'Positive', hex: '#059669' },
  { name: 'Negative', hex: '#DC2626' },
];

const dateError = computed(() => {
  if (!form.startDate || !form.endDate) return '';
  return form.startDate > form.endDate
    ? 'Start date cannot be later than the end date'
    : '';
});
const isFormValid = computed(() =>
  Boolean(
    form.message.trim() &&
    form.startDate &&
    form.endDate &&
    form.selectedColour &&
    !dateError.value,
  ),
);

async function loadMessage() {
  loading.value = true;
  loadError.value = null;
  try {
    const payload = await $fetch(`/api/messages/${messageId.value}`);
    const message = parseSingleMessage(payload);
    if (!message || message.type !== 'alert') {
      throw new Error('Alert message not found');
    }
    form.message = message.message;
    form.startDate = message.startDate?.slice(0, 10) ?? '';
    form.endDate = message.endDate?.slice(0, 10) ?? '';
    form.selectedColour = message.theme ?? '';
  } catch (error) {
    loadError.value = error;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.MESSAGES);
}

async function saveAlert() {
  if (!isFormValid.value) return;
  try {
    await updateAlert(messageId.value, {
      message: form.message.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      theme: form.selectedColour,
    });
    await navigateTo(ADMIN_PAGE_ROUTES.MESSAGES);
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: 'Edit alert message' });
useHead({ title: 'Edit alert message' });
onMounted(loadMessage);
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <MessageFormHeader
      action-label="Save changes"
      :disabled="loading || !isFormValid"
      :loading="busyMessageId === messageId"
      @back="goBack"
      @submit="saveAlert"
    />

    <div
      v-if="loading"
      class="flex min-h-64 items-center justify-center rounded-2xl border border-grey-50 bg-white"
    >
      <div
        class="size-8 animate-spin rounded-full border-2 border-grey-100 border-t-primary-500"
      />
    </div>
    <LoadErrorState
      v-else-if="loadError"
      :error="loadError"
      resource-label="alert message"
      @retry="loadMessage"
    />
    <template v-else>
      <section
        class="flex flex-col gap-6 rounded-2xl border border-grey-50 bg-white p-6"
      >
        <div class="flex flex-col gap-4">
          <h2 class="text-base font-medium text-grey-900">Message Details</h2>
          <div class="h-px bg-grey-50" />
        </div>

        <div class="flex flex-col gap-2">
          <label for="alert-message" class="text-sm font-medium text-grey-900"
            >Message</label
          >
          <textarea
            id="alert-message"
            v-model="form.message"
            rows="6"
            placeholder="Enter message ..."
            class="w-full resize-y rounded-xl border border-border-input-default bg-grey-55 px-4 py-3 text-sm text-grey-900 outline-none transition placeholder:text-grey-400 focus:border-border-input-active"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-grey-900"
                >Start date</label
              >
              <DatePickerField
                v-model="form.startDate"
                placeholder="Select start date"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-grey-900">End date</label>
              <DatePickerField
                v-model="form.endDate"
                placeholder="Select end date"
              />
            </div>
          </div>
          <p v-if="dateError" class="text-xs text-negative-500">
            {{ dateError }}
          </p>
        </div>
      </section>

      <section
        class="flex flex-col gap-6 rounded-2xl border border-grey-50 bg-white p-6"
      >
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <h2 class="text-base font-medium text-grey-900">Alert preview</h2>
            <p class="text-sm leading-5 text-grey-400">
              Select a colour for your alert, this colour will be used to
              indicate the importance of the message
            </p>
          </div>
          <div class="h-px bg-grey-50" />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="option in colourOptions"
            :key="option.name"
            type="button"
            class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-left transition hover:bg-grey-55/60"
            :style="{
              borderColor:
                form.selectedColour === option.hex ? option.hex : '#E5E7EB',
            }"
            @click="form.selectedColour = option.hex"
          >
            <span
              class="h-6 w-16 rounded"
              :style="{ backgroundColor: option.hex }"
            />
            <span class="text-base font-medium text-grey-900">{{
              option.name
            }}</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
