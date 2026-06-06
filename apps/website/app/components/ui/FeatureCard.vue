<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    tint: string;
    tagTint?: string;
    icon: string;
    iconClass: string;
    label: string;
    title: string;
    cta?: string;
  }>(),
  { cta: 'Learn more' },
);

const tagTintClass = computed(() => props.tagTint ?? props.tint);
</script>

<template>
  <div
    v-reveal
    class="flex h-full flex-col overflow-hidden rounded-xl border border-grey-100 bg-white p-1.5 shadow-small lg:min-h-[608px]"
  >
    <div class="relative h-[360px] shrink-0 overflow-hidden rounded-lg" :class="tint">
      <slot name="mock" />
    </div>

    <div class="flex flex-1 flex-col gap-6 p-6">
      <span
        class="inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-grey-900"
        :class="tagTintClass"
      >
        <Icon :name="icon" class="size-4 shrink-0" :class="iconClass" />
        {{ label }}
      </span>

      <div class="flex flex-col gap-2">
        <h3 class="text-h2 text-grey-900">{{ title }}</h3>
        <p class="text-base leading-6 text-grey-700">
          <slot />
        </p>
      </div>

      <a
        href="#"
        class="group/link mt-auto inline-flex items-center gap-1 text-base font-semibold text-grey-700 transition-colors hover:text-primary-700"
      >
        <slot name="cta">{{ cta }}</slot>
        <Icon
          name="lucide:chevron-right"
          class="size-5 transition-transform group-hover/link:translate-x-0.5"
        />
      </a>
    </div>
  </div>
</template>
