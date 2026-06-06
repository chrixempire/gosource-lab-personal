<script setup lang="ts">
import { CloudDownload, LoaderCircle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import CreditDocumentFileIcon from '~/components/credit/CreditDocumentFileIcon.vue';
import {
  creditDocumentTypeLabel,
  creditDocumentFilename,
  inferCreditDocumentKind,
} from '~/lib/credit-document';
import { downloadCreditDocument } from '~/lib/download-credit-document';

const props = defineProps<{
  title: string;
  url?: string | null;
}>();

const downloading = ref(false);

const resolvedUrl = computed(() => String(props.url ?? '').trim());
const kind = computed(() =>
  resolvedUrl.value ? inferCreditDocumentKind(resolvedUrl.value) : 'document',
);
const typeLabel = computed(() => creditDocumentTypeLabel(kind.value));
const canDownload = computed(() => Boolean(resolvedUrl.value));

async function onDownload() {
  if (!resolvedUrl.value || downloading.value) {
    return;
  }

  downloading.value = true;
  try {
    await downloadCreditDocument(resolvedUrl.value, creditDocumentFilename(resolvedUrl.value));
  } catch {
    toast.error('Unable to download document');
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border border-grey-50 px-3 py-2.5">
    <CreditDocumentFileIcon :kind="kind" />

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-grey-900">{{ title }}</p>
      <p class="text-xs text-grey-500">{{ typeLabel }}</p>
    </div>

    <button
      v-if="canDownload"
      type="button"
      class="shrink-0 cursor-pointer rounded-lg p-2 text-grey-600 transition-colors hover:bg-grey-25 disabled:cursor-not-allowed disabled:opacity-50"
      :aria-label="downloading ? `Downloading ${title}` : `Download ${title}`"
      :disabled="downloading"
      @click="onDownload"
    >
      <LoaderCircle
        v-if="downloading"
        class="size-5 animate-spin text-primary-500"
        aria-hidden="true"
      />
      <CloudDownload v-else class="size-5" aria-hidden="true" />
    </button>
  </div>
</template>
