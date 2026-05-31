<script setup lang="ts">
const BANNER_COUNT = 3;
const ROTATE_MS = 5500;

const activeIndex = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

function goTo(index: number) {
  activeIndex.value = index % BANNER_COUNT;
}

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % BANNER_COUNT;
  }, ROTATE_MS);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

onMounted(startTimer);
onUnmounted(stopTimer);
</script>

<template>
  <div class="w-full" @mouseenter="stopTimer" @mouseleave="startTimer">
    <div class="relative w-full overflow-hidden rounded-[16px]">
      <div
        class="flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <NuxtLink
          v-for="index in BANNER_COUNT"
          :key="index"
          :to="index === 1 ? '/business-insight' : index === 2 ? '/business-insight' : '/market'"
          class="flex h-[250px] w-full shrink-0 cursor-pointer items-center justify-center bg-grey-55 px-6 no-underline transition-colors hover:bg-grey-50 dark:hover:bg-white/5"
        >
          <div class="text-center">
            <p class="text-sm font-semibold text-grey-300">
              {{
                index === 1
                  ? 'Business insight'
                  : index === 2
                    ? 'Order again'
                    : 'Promotions'
              }}
            </p>
            <p class="mt-1 text-xs text-grey-300/80">Banner placeholder</p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-center gap-2" role="tablist" aria-label="Banner slides">
      <button
        v-for="index in BANNER_COUNT"
        :key="`dot-${index}`"
        type="button"
        class="h-2 cursor-pointer rounded-full bg-grey-300 transition-all duration-300 ease-out dark:bg-grey-50"
        :class="activeIndex === index - 1 ? 'w-6 bg-primary-500 dark:bg-primary-500/80' : 'w-2'"
        :aria-label="`Show banner ${index}`"
        :aria-selected="activeIndex === index - 1"
        role="tab"
        @click="goTo(index - 1)"
      />
    </div>
  </div>
</template>
