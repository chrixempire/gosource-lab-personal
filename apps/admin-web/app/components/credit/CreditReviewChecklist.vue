<script setup lang="ts">
import { Button, Checkbox } from '@gosource/ui';
import { LoaderCircle } from 'lucide-vue-next';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useCreditMutations } from '~/composables/useCreditMutations';
import { customerDetailPath } from '~/lib/admin-routes';
import { parseCreditChecklist } from '~/lib/credit-api';
import { CREDIT_DEFAULT_CHECKLIST_ITEMS, CREDIT_LINK_BUTTON_CLASS } from '~/lib/credit-constants';

const props = defineProps<{
  applicationId: string;
  businessId?: string;
  editable: boolean;
}>();

const emit = defineEmits<{
  refreshed: [];
}>();

const { busyId, initialiseChecklist, updateChecklistItem } = useCreditMutations();

const applicationId = toRef(props, 'applicationId');

const { data, refresh, status } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/credit/applications/${applicationId.value}/checklist`,
  {
    watch: [applicationId],
    key: computed(() => `admin-credit-checklist:${applicationId.value}`),
  },
);

const items = computed(() => parseCreditChecklist(data.value));
const initialising = ref(false);
const togglingItemName = ref<string | null>(null);

const checklistBusy = computed(
  () => togglingItemName.value !== null || busyId.value === applicationId.value,
);

watch(
  items,
  async (list) => {
    if (list.length > 0 || initialising.value || status.value === 'pending') return;
    initialising.value = true;
    try {
      await initialiseChecklist(props.applicationId, [...CREDIT_DEFAULT_CHECKLIST_ITEMS]);
      await refresh();
      emit('refreshed');
    } catch {
      // toast in composable
    } finally {
      initialising.value = false;
    }
  },
  { immediate: true },
);

async function onToggle(documentName: string, verified: boolean) {
  if (!props.editable || togglingItemName.value) return;
  togglingItemName.value = documentName;
  try {
    await updateChecklistItem(props.applicationId, documentName, verified);
    await refresh();
    emit('refreshed');
  } catch {
    // toast in composable
  } finally {
    togglingItemName.value = null;
  }
}

function viewOrderHistory() {
  if (props.businessId) {
    void navigateTo(`${customerDetailPath(props.businessId)}?tab=orders`);
  }
}
</script>

<template>
  <CreditPanelCard title="Review checklist">
    <div v-if="status === 'pending' && items.length === 0" class="text-sm text-grey-500">
      Loading checklist…
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="item in items"
        :key="item.name"
        class="flex items-start justify-between gap-3"
      >
        <label
          class="flex min-w-0 flex-1 items-center gap-2"
          :class="editable && !checklistBusy ? 'cursor-pointer' : 'cursor-default'"
        >
          <span
            v-if="togglingItemName === item.name"
            class="inline-flex size-4 shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <LoaderCircle class="size-4 animate-spin text-orange-500" />
          </span>
          <Checkbox
            v-else
            :model-value="item.verified"
            :disabled="!editable || checklistBusy"
            @update:model-value="onToggle(item.name, $event === true)"
          />
          <span class="text-sm font-medium text-grey-800">{{ item.name }}</span>
        </label>
        <Button
          v-if="item.name === 'GoSource order history' && businessId"
          type="button"
          variant="link"
          size="small"
          :class="CREDIT_LINK_BUTTON_CLASS"
          @click="viewOrderHistory"
        >
          View history
        </Button>
      </div>
    </div>
  </CreditPanelCard>
</template>
