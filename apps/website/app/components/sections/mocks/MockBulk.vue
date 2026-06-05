<script setup lang="ts">
const items = [
  { image: '/images/product-04.png', name: 'Fresh Tomatoes (1kg)', price: '₦1,400' },
  { image: '/images/product-07.png', name: 'Cilantro / Coriander (1 bunch)', price: '₦525' },
  { image: '/images/product-03.png', name: 'Ketchup (Alfa 5kg)', price: '₦7,500' },
  { image: '/images/product-08.png', name: 'Chicken Wings (1KG)', price: '₦7,500' },
];
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <div
      v-for="(item, i) in items"
      :key="item.name"
      class="animate-float rounded-2xl bg-white p-2.5 shadow-small"
      :style="{ '--float-dur': 6 + i + 's', '--float-delay': i * 0.4 + 's' }"
    >
      <div class="aspect-[5/4] overflow-hidden rounded-xl bg-grey-50">
        <img :src="item.image" :alt="item.name" loading="lazy" class="h-full w-full object-contain p-2" />
      </div>
      <p class="mt-2 line-clamp-1 text-xs font-medium text-grey-700">{{ item.name }}</p>
      <div class="mt-1 flex items-center justify-between">
        <span class="text-xs font-bold text-grey-900">{{ item.price }}</span>
      </div>
      <button
        type="button"
        class="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary-500 py-1.5 text-[0.6875rem] font-semibold text-white transition hover:bg-primary-600"
      >
        <Icon name="lucide:plus" class="size-3" /> Add to cart
      </button>
    </div>
  </div>
</template>
