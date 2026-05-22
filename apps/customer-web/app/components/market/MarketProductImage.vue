<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    hoverZoom?: boolean;
    loading?: 'lazy' | 'eager';
    logoClass?: string;
  }>(),
  { hoverZoom: true, loading: 'lazy', logoClass: 'w-[82%] max-w-[10rem]' },
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
  <div class="absolute inset-0">
    <template v-if="src">
      <NuxtImg
        ref="imgRef"
        :src="src"
        :alt="alt ?? ''"
        :loading="loading"
        class="absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-200"
        :class="[
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
          hoverZoom
            ? 'transition-transform duration-300 ease-in-out group-hover:scale-110'
            : '',
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
