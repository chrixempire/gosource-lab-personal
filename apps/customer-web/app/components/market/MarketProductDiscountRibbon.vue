<script setup lang="ts">
defineProps<{
  percent: number;
}>();
</script>

<template>
  <div
    class="pointer-events-none absolute right-3 top-3 z-10 flex size-12 flex-col items-center justify-center gap-px rounded-full border-2 border-white bg-[#0DBA2D] text-center text-white shadow-[0_0_0_2px_#0DBA2D]"
    aria-hidden="true"
  >
    <span class="text-[12px] font-bold leading-[18px] tracking-[0.1px]">{{ percent }}%</span>
    <span class="text-center text-[10px] font-medium leading-[18px] tracking-[0.1px]">Off</span>
  </div>
</template>
