<script setup lang="ts">
import { ref } from 'vue';

const dismissed = ref(false);
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300"
    leave-active-class="transition-all duration-300"
    enter-from-class="-translate-y-full opacity-0"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="!dismissed"
      class="relative z-50 flex items-center justify-center gap-3 bg-[var(--color-announce)] px-4 py-3 text-center"
    >
      <a
        href="#"
        class="group flex items-center gap-2.5 text-[0.8125rem] text-white/95 sm:text-sm"
      >
        <span
          class="hidden shrink-0 rounded-full bg-orange-500 px-2.5 py-1 text-[0.6875rem] font-semibold text-white sm:inline-flex"
        >
          🎉 New
        </span>
        <span class="line-clamp-1">
          9 popular markets in Lagos you need to visit if you need to buy
          pocket-friendly foodstuffs
        </span>
        <Icon
          name="lucide:arrow-right"
          class="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
        />
      </a>
      <button
        type="button"
        aria-label="Dismiss announcement"
        class="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white sm:block"
        @click="dismissed = true"
      >
        <Icon name="lucide:x" class="size-4" />
      </button>
    </div>
  </Transition>
</template>
