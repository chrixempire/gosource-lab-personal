<script setup lang="ts">
import { Button } from '@gosource/ui';
import { Trash2 } from 'lucide-vue-next';
import CreditDocumentDownloadLink from '~/components/credit/CreditDocumentDownloadLink.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { useCreditMutations } from '~/composables/useCreditMutations';
import type { CreditAdditionalDoc } from '~/types/credit';

const props = defineProps<{
  applicationId: string;
  documents: CreditAdditionalDoc[];
  editable: boolean;
}>();

const emit = defineEmits<{
  refreshed: [];
}>();

const { busyId, uploadAdditionalDocuments, deleteAdditionalDocument } = useCreditMutations();

const pendingFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const hasPending = computed(() => pendingFiles.value.length > 0);

function onPickFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  pendingFiles.value = [...pendingFiles.value, ...files];
  input.value = '';
}

function removePending(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index);
}

async function savePending() {
  if (!pendingFiles.value.length) return;
  try {
    await uploadAdditionalDocuments(props.applicationId, pendingFiles.value);
    pendingFiles.value = [];
    emit('refreshed');
  } catch {
    // toast in composable
  }
}

async function removeUploaded(docKey: string) {
  try {
    await deleteAdditionalDocument(props.applicationId, docKey);
    emit('refreshed');
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <CreditPanelCard :title="editable ? 'Upload additional documents' : 'Additional documents'">
    <template v-if="editable">
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="onPickFiles"
      />
      <button
        type="button"
        class="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-grey-100 bg-grey-25 px-4 py-8 text-sm text-grey-600"
        @click="fileInput?.click()"
      >
        <span class="font-medium text-grey-800">Click to upload</span>
        <span class="mt-1 text-xs">Maximum size: 1MB per file (legacy limit)</span>
      </button>
    </template>

    <ul v-if="pendingFiles.length" class="mt-4 space-y-2">
      <li
        v-for="(file, index) in pendingFiles"
        :key="`${file.name}-${index}`"
        class="flex items-center justify-between rounded-lg border border-warning-100 bg-warning-75 px-3 py-2 text-sm"
      >
        <span class="truncate">{{ file.name }}</span>
        <button type="button" class="text-grey-600" @click="removePending(index)">
          <Trash2 class="size-4" />
        </button>
      </li>
    </ul>

    <Button
      v-if="hasPending"
      type="button"
      size="small"
      variant="primary"
      class="mt-3"
      :loading="busyId === applicationId"
      @click="savePending"
    >
      Save {{ pendingFiles.length }} {{ pendingFiles.length === 1 ? 'file' : 'files' }}
    </Button>

    <ul v-if="documents.length" class="mt-4 space-y-2">
      <li
        v-for="doc in documents"
        :key="doc.key"
        class="flex items-center justify-between gap-2 rounded-lg border border-grey-50 px-3 py-2"
      >
        <span class="truncate text-sm font-medium text-grey-800">{{ doc.key }}</span>
        <div class="flex shrink-0 items-center gap-1">
          <CreditDocumentDownloadLink :url="doc.url" icon-only />
          <button
            v-if="editable"
            type="button"
            class="rounded-lg p-2 text-grey-600 hover:bg-grey-25"
            aria-label="Delete"
            @click="removeUploaded(doc.key)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
      </li>
    </ul>

    <p v-else-if="!hasPending" class="mt-4 text-sm text-grey-500">No additional documents uploaded</p>
  </CreditPanelCard>
</template>
