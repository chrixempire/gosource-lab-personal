<script setup lang="ts">
const props = defineProps<{
  modelValue: number;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const editing = ref(false);
const draft = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

function activateEdit() {
  if (props.readonly) {
    return;
  }
  draft.value = props.modelValue > 0 ? String(props.modelValue) : '';
  editing.value = true;
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function commit() {
  const parsed = Number(draft.value);
  const next = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  emit('update:modelValue', next);
  editing.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
  if (event.key === 'Escape') {
    editing.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-[9rem]">
    <button
      v-if="!editing"
      type="button"
      class="inline-flex min-h-10 w-full items-center rounded-md border border-transparent px-2 py-1 text-left text-sm text-grey-900 hover:border-grey-200 hover:bg-grey-50 disabled:cursor-default disabled:text-grey-500 disabled:hover:border-transparent disabled:hover:bg-transparent"
      :disabled="readonly"
      @click="activateEdit"
    >
      {{ modelValue > 0 ? modelValue : 0 }}
    </button>
    <input
      v-else
      ref="inputRef"
      v-model="draft"
      type="number"
      min="0"
      step="1"
      inputmode="numeric"
      placeholder="Enter quantity"
      class="flex h-10 w-full rounded-[10px] border border-border-input-default bg-grey-55 px-3 text-sm text-grey-900 outline-none focus:border-border-input-active"
      @blur="commit"
      @keydown="onKeydown"
    >
  </div>
</template>
