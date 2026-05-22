<script setup lang="ts">
import MarketProductImage from '~/components/market/MarketProductImage.vue';

const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    /** `circle` for table rows (members-style); `square` for cards. */
    shape?: 'circle' | 'square';
  }>(),
  {
    size: 'sm',
    shape: 'square',
  },
);

const sizeClass = computed(() => {
  if (props.shape === 'circle') {
    if (props.size === 'lg') {
      return 'size-16 rounded-full';
    }

    return props.size === 'md' ? 'size-12 rounded-full' : 'size-10 rounded-full';
  }

  if (props.size === 'lg') {
    return 'size-16 rounded-xl';
  }

  return props.size === 'md' ? 'size-16 rounded-xl' : 'size-12 rounded-[10px]';
});

const logoClass = computed(() => {
  if (props.shape === 'circle') {
    if (props.size === 'lg') {
      return 'w-[72%] max-w-[3rem]';
    }

    return props.size === 'md' ? 'w-[70%] max-w-[2.25rem]' : 'w-[72%] max-w-[1.75rem]';
  }

  if (props.size === 'lg') {
    return 'w-[72%] max-w-[3rem]';
  }

  return props.size === 'md' ? 'w-[72%] max-w-[3rem]' : 'w-[72%] max-w-[2.5rem]';
});
</script>

<template>
  <div
    :class="['relative shrink-0 overflow-hidden bg-grey-55', sizeClass]"
  >
    <MarketProductImage
      :src="src ?? undefined"
      :alt="alt ?? ''"
      :hover-zoom="false"
      :logo-class="logoClass"
    />
  </div>
</template>
