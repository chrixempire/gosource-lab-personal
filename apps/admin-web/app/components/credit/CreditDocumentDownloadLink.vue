<script setup lang="ts">
import { Download, LoaderCircle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { creditDocumentFilename } from '~/lib/credit-document';
import { downloadCreditDocument } from '~/lib/download-credit-document';
import { CREDIT_DOCUMENT_LINK_CLASS } from '~/lib/credit-constants';

const props = withDefaults(
  defineProps<{
    url?: string | null;
    label?: string;
    iconOnly?: boolean;
  }>(),
  {
    label: 'Download',
    iconOnly: false,
  },
);

const downloading = ref(false);
const canDownload = computed(() => Boolean(String(props.url ?? '').trim()));

async function onDownload() {
  const url = String(props.url ?? '').trim();
  if (!url || downloading.value) {
    return;
  }

  downloading.value = true;
  try {
    await downloadCreditDocument(url, creditDocumentFilename(url));
  } catch {
    toast.error('Unable to download document');
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <button
    v-if="canDownload"
    type="button"
    :class="[
      CREDIT_DOCUMENT_LINK_CLASS,
      'cursor-pointer disabled:cursor-not-allowed',
      iconOnly && 'rounded-lg p-2 text-grey-600 hover:bg-grey-25 hover:no-underline',
    ]"
    :aria-label="iconOnly ? (downloading ? 'Downloading document' : 'Download document') : undefined"
    :disabled="downloading"
    @click="onDownload"
  >
    <LoaderCircle
      v-if="downloading"
      class="size-4 animate-spin text-primary-500"
      aria-hidden="true"
    />
    <Download v-else class="size-4" aria-hidden="true" />
    <span v-if="!iconOnly">{{ downloading ? 'Downloading…' : label }}</span>
  </button>
</template>
