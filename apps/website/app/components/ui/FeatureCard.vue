<script setup lang="ts">
defineProps<{
  tint: string;
  icon: string;
  iconClass: string;
  pillClass: string;
  label: string;
  title: string;
}>();
</script>

<template>
  <div
    v-reveal
    class="flex h-full flex-col overflow-hidden rounded-3xl"
    :class="tint"
  >
    <!-- Visual / mockup region -->
    <div class="relative px-5 pt-6 sm:px-7 sm:pt-8">
      <slot name="mock" />
    </div>

    <!-- Copy region -->
    <div class="px-5 pb-7 pt-2 sm:px-8 sm:pb-9">
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold text-grey-900"
        :class="pillClass"
      >
        <Icon :name="icon" class="size-4" :class="iconClass" />
        {{ label }}
      </span>
      <h3 class="text-h3 mt-4 text-grey-900">{{ title }}</h3>
      <p class="mt-2.5 max-w-md text-[0.95rem] leading-relaxed text-grey-500">
        <slot />
      </p>
      <a
        href="#"
        class="group/link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-grey-900 transition-colors hover:text-primary-700"
      >
        <slot name="cta">Learn more</slot>
        <Icon name="lucide:chevron-right" class="size-4 transition-transform group-hover/link:translate-x-1" />
      </a>
    </div>
  </div>
</template>
