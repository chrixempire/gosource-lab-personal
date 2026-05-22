<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cva } from 'class-variance-authority';
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui';
import { cn } from '../lib/cn';

const avatarVariants = cva(
  'inline-flex shrink-0 overflow-hidden rounded-full bg-grey-55',
  {
    variants: {
      size: {
        xs: 'size-6',
        sm: 'size-8',
        md: 'size-10',
        lg: 'size-11',
        xl: 'size-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const fallbackVariants = cva(
  'flex size-full items-center justify-center rounded-full font-semibold text-white',
  {
    variants: {
      size: {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type Props = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string | null;
  alt?: string;
  fallback: string;
  class?: HTMLAttributes['class'];
  fallbackClass?: HTMLAttributes['class'];
};

const props = withDefaults(defineProps<Props>(), {
  src: '',
  alt: '',
  size: 'md',
  class: undefined,
  fallbackClass: undefined,
});
</script>

<template>
  <AvatarRoot :class="cn(avatarVariants({ size: props.size }), props.class)">
    <AvatarImage
      v-if="props.src"
      :src="props.src"
      :alt="props.alt"
      class="size-full object-cover"
    />
    <AvatarFallback
      :class="
        cn(
          fallbackVariants({ size: props.size }),
          'bg-[linear-gradient(135deg,#f97316_0%,#ec4899_45%,#8b5cf6_100%)]',
          props.fallbackClass,
        )
      "
    >
      {{ props.fallback }}
    </AvatarFallback>
  </AvatarRoot>
</template>
