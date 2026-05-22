<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { cn } from '../lib/cn';
import Input from '../input/Input.vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    invalid?: boolean;
    class?: string;
    label?: string;
    hint?: string;
  }>(),
  {
    modelValue: '',
    invalid: false,
    class: undefined,
    label: undefined,
    hint: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showPassword = ref(false);
const inputId = useId();

const hasFieldChrome = computed(() => Boolean(props.label || props.hint));
</script>

<template>
  <div v-if="hasFieldChrome" class="flex w-full flex-col gap-2">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-grey-900">
      {{ label }}
    </label>
    <p v-if="hint" class="text-xs text-grey-500">
      {{ hint }}
    </p>
    <div class="relative">
      <Input
        :id="inputId"
        :model-value="props.modelValue"
        :type="showPassword ? 'text' : 'password'"
        :invalid="props.invalid"
        :class="cn('pr-12', props.class)"
        v-bind="$attrs"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-grey-300 transition hover:text-grey-900 disabled:cursor-not-allowed"
        :disabled="$attrs.disabled === '' || $attrs.disabled === true"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </div>
  </div>
  <div v-else class="relative">
    <Input
      :model-value="props.modelValue"
      :type="showPassword ? 'text' : 'password'"
      :invalid="props.invalid"
      :class="cn('pr-12', props.class)"
      v-bind="$attrs"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-grey-300 transition hover:text-grey-900 disabled:cursor-not-allowed"
      :disabled="$attrs.disabled === '' || $attrs.disabled === true"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      @click="showPassword = !showPassword"
    >
      <EyeOff v-if="showPassword" class="size-4" />
      <Eye v-else class="size-4" />
    </button>
  </div>
</template>
