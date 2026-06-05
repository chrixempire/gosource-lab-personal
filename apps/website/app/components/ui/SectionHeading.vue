<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    eyebrowClass?: string;
    title?: string;
    align?: 'left' | 'center';
    maxWidth?: string;
  }>(),
  { align: 'left', maxWidth: '34rem', eyebrowClass: '' },
);
</script>

<template>
  <div
    v-reveal
    class="flex flex-col"
    :class="align === 'center' ? 'items-center text-center' : 'items-start text-left'"
  >
    <span v-if="eyebrow" class="eyebrow" :class="eyebrowClass">{{ eyebrow }}</span>
    <h2
      v-if="title"
      class="text-h2 mt-3 text-grey-900"
      :style="{ maxWidth }"
    >
      {{ title }}
    </h2>
    <p
      v-if="$slots.default"
      class="mt-4 text-[1.05rem] leading-relaxed text-grey-500"
      :style="{ maxWidth }"
    >
      <slot />
    </p>
    <div v-if="$slots.actions" class="mt-7">
      <slot name="actions" />
    </div>
  </div>
</template>
