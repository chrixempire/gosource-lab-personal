<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    hoverZoom?: boolean;
    /** How the photo fills its frame (`contain` shows the full product). */
    objectFit?: 'cover' | 'contain';
    loading?: 'lazy' | 'eager';
    logoClass?: string;
  }>(),
  {
    hoverZoom: true,
    objectFit: 'cover',
    loading: 'lazy',
    logoClass: 'w-[82%] max-w-[10rem]',
  },
);

const objectFitClass = computed(() =>
  props.objectFit === 'contain' ? 'object-contain' : 'object-cover',
);

const hoverScaleClass = computed(() =>
  props.hoverZoom
    ? props.objectFit === 'contain'
      ? 'transition-transform duration-300 ease-in-out group-hover:scale-[1.04]'
      : 'transition-transform duration-300 ease-in-out group-hover:scale-110'
    : '',
);

const imgRef = ref<{ $el?: HTMLImageElement } | HTMLImageElement | null>(null);
const isLoaded = ref(false);
const hasError = ref(false);

const showLogoLoader = computed(
  () => Boolean(props.src) && (!isLoaded.value || hasError.value),
);

function resolveImgEl(): HTMLImageElement | null {
  const node = imgRef.value;
  if (!node) {
    return null;
  }
  if (node instanceof HTMLImageElement) {
    return node;
  }
  return node.$el ?? null;
}

function syncLoadedFromDom() {
  const img = resolveImgEl();
  if (!img || !props.src) {
    return;
  }
  if (img.complete && img.naturalWidth > 0) {
    isLoaded.value = true;
    hasError.value = false;
  }
}

function onLoad() {
  isLoaded.value = true;
  hasError.value = false;
}

function onError() {
  hasError.value = true;
  isLoaded.value = false;
}

watch(
  () => props.src,
  () => {
    isLoaded.value = false;
    hasError.value = false;
    nextTick(syncLoadedFromDom);
  },
);

onMounted(() => {
  nextTick(syncLoadedFromDom);
});
</script>

<template>
  <div class="absolute inset-0 min-h-0 min-w-0">
    <template v-if="src">
      <NuxtImg
        ref="imgRef"
        :src="src"
        :alt="alt ?? ''"
        :loading="loading"
        class="absolute inset-0 z-0 size-full max-w-none object-center transition-opacity duration-200"
        :class="[
          objectFitClass,
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
          hoverScaleClass,
        ]"
        @load="onLoad"
        @error="onError"
      />
      <div
        v-if="showLogoLoader"
        class="absolute inset-0 z-[1] flex items-center justify-center bg-grey-55"
      >
        <img
          src="/images/logo.png"
          alt=""
          class="w-[82%] max-w-[10rem] animate-pulse object-contain grayscale"
          aria-hidden="true"
        >
      </div>
    </template>

    <template v-else>
      <div class="absolute inset-0 z-[1] flex items-center justify-center bg-grey-55">
        <img
          src="/images/logo.png"
          alt=""
          :class="[props.logoClass, 'animate-pulse object-contain grayscale']"
          aria-hidden="true"
        >
      </div>
    </template>
  </div>
</template>
