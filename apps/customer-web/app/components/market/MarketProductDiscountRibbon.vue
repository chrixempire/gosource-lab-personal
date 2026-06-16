<script setup lang="ts">
defineProps<{
  percent: number;
}>();
</script>

<template>
  <div
    class="customer-image-discount-ribbon pointer-events-none absolute right-0 top-0 z-10 h-16 w-16"
    aria-hidden="true"
  >
    <svg viewBox="0 0 64 64" class="size-full" role="presentation">
      <path d="M64 0 H6 L64 62 Z" class="fill-primary-500" />
      <text
        x="46"
        y="23"
        fill="#ffffff"
        font-size="12"
        font-weight="700"
        text-anchor="middle"
        transform="rotate(45 46 23)"
      >
        {{ percent }}%
      </text>
      <text
        x="46"
        y="35"
        fill="#ffffff"
        font-size="9"
        font-weight="500"
        text-anchor="middle"
        transform="rotate(45 46 35)"
      >
        Off
      </text>
    </svg>
  </div>
</template>
