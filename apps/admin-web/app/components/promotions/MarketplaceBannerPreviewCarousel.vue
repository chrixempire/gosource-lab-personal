<script setup lang="ts">
import { MARKETPLACE_BANNER_ROTATE_MS } from '~/lib/marketplace-banners';
import type { MarketplaceBannerDraftSlot } from '~/lib/marketplace-banners';

const props = defineProps<{
  slots: MarketplaceBannerDraftSlot[];
}>();

const activeIndex = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

const slideCount = computed(() => props.slots.length);

function goTo(index: number) {
  if (slideCount.value === 0) {
    return;
  }

  activeIndex.value = ((index % slideCount.value) + slideCount.value) % slideCount.value;
}

function startTimer() {
  stopTimer();
  if (slideCount.value <= 1) {
    return;
  }

  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slideCount.value;
  }, MARKETPLACE_BANNER_ROTATE_MS);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

watch(slideCount, () => {
  if (activeIndex.value >= slideCount.value) {
    activeIndex.value = 0;
  }
  startTimer();
});

onMounted(startTimer);
onUnmounted(stopTimer);
</script>

<template>
  <div
    class="w-full min-w-0"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
  >
    <div class="relative w-full min-w-0 overflow-hidden rounded-2xl border border-grey-50">
      <div
        class="flex w-full transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <div
          v-for="slot in slots"
          :key="slot.id"
          class="relative block w-full min-w-0 shrink-0 grow-0 basis-full overflow-hidden"
        >
          <div class="relative h-[270px] max-h-[270px] w-full bg-grey-55">
            <img
              :src="slot.src"
              :alt="slot.alt"
              class="size-full object-cover"
            >
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="slideCount > 0"
      class="mt-3 flex items-center justify-center gap-2"
      role="tablist"
      aria-label="Banner preview slides"
    >
      <button
        v-for="(slot, index) in slots"
        :key="`dot-${slot.id}`"
        type="button"
        class="h-2 cursor-pointer rounded-full bg-grey-300 transition-all duration-300 ease-out"
        :class="activeIndex === index ? 'w-6 bg-primary-500' : 'w-2'"
        :aria-label="`Show ${slot.alt}`"
        :aria-selected="activeIndex === index"
        role="tab"
        @click="goTo(index)"
      />
    </div>
  </div>
</template>
