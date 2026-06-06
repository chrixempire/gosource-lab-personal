<script setup lang="ts">
import { Button } from '@gosource/ui';
import { FileUp, X } from 'lucide-vue-next';
import {
  CREDIT_APPLY_FILE_ACCEPT,
  CREDIT_APPLY_FILE_MAX_BYTES,
  CREDIT_APPLY_FILE_TYPES,
  validateCreditApplyFile,
} from '~/lib/credit-apply';

const props = defineProps<{
  modelValue: File | null;
  disabled?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: File | null];
  fileError: [message: string];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

function openPicker() {
  if (props.disabled) {
    return;
  }
  inputRef.value?.click();
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  if (!file) {
    return;
  }

  const validationError = validateCreditApplyFile(file, 'File');
  if (validationError) {
    emit('fileError', validationError);
    if (inputRef.value) {
      inputRef.value.value = '';
    }
    return;
  }

  emit('update:modelValue', file);
}

function clearFile() {
  emit('update:modelValue', null);
  if (inputRef.value) {
    inputRef.value.value = '';
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}
</script>

<template>
  <div class="block space-y-2">
    <span class="text-[13px] font-semibold text-grey-text">
      <slot />
    </span>

    <input
      ref="inputRef"
      type="file"
      class="hidden"
      tabindex="-1"
      :accept="CREDIT_APPLY_FILE_ACCEPT"
      :disabled="props.disabled"
      @change="onFileChange"
    />

    <div
      v-if="!props.modelValue"
      :class="[
        'rounded-[16px] border border-dashed bg-background-on-canvas px-4 py-5 text-center',
        props.error ? 'border-negative-500' : 'border-grey-50',
      ]"
    >
      <FileUp class="mx-auto size-8 text-grey-300" aria-hidden="true" />
      <p class="mt-2 text-sm text-grey-600">PDF, DOCX, JPG or PNG · max 1MB</p>
      <Button
        type="button"
        variant="neutral"
        size="small"
        class="mt-3 !w-auto"
        :disabled="props.disabled"
        @click="openPicker"
      >
        Choose file
      </Button>
    </div>

    <div
      v-else
      class="flex items-center justify-between gap-3 rounded-[16px] border border-grey-50 bg-background-on-canvas px-4 py-3"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-grey-900">{{ props.modelValue.name }}</p>
        <p class="text-xs text-grey-400">{{ formatFileSize(props.modelValue.size) }}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="small"
        class="!w-auto shrink-0"
        :disabled="props.disabled"
        @click="clearFile"
      >
        <X class="size-4" aria-hidden="true" />
        <span class="sr-only">Remove file</span>
      </Button>
    </div>

    <p class="text-xs text-grey-400">
      Bank statement from the last 6 months helps us assess cash flow and stability.
    </p>
    <p v-if="props.error" class="text-[12px] font-medium text-negative-500">{{ props.error }}</p>
  </div>
</template>
