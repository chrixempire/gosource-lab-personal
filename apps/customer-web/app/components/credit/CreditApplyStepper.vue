<script setup lang="ts">
import { Check } from 'lucide-vue-next';

const props = defineProps<{
  currentStep: number;
  steps: Array<{ label: string; value: number }>;
}>();
</script>

<template>
  <ol class="mb-8 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:gap-0 sm:overflow-visible">
    <template v-for="(step, index) in props.steps" :key="step.value">
      <li class="flex shrink-0 items-center">
        <div
          class="flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors"
          :class="
            props.currentStep === step.value
              ? 'bg-primary-50 text-primary-700'
              : props.currentStep > step.value
                ? 'bg-button-primary text-white'
                : 'bg-grey-55 text-grey-500'
          "
        >
          <Check
            v-if="props.currentStep > step.value"
            class="size-4 text-white"
            aria-hidden="true"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span
          class="ml-2 whitespace-nowrap text-xs font-medium sm:ml-3 sm:text-sm"
          :class="props.currentStep >= step.value ? 'text-grey-700' : 'text-grey-400'"
        >
          {{ step.label }}
        </span>
      </li>
      <div
        v-if="index < props.steps.length - 1"
        class="mx-2 hidden h-0.5 min-w-4 flex-1 sm:block"
        :class="props.currentStep > step.value ? 'bg-primary-500' : 'bg-grey-100'"
        aria-hidden="true"
      />
    </template>
  </ol>
</template>
