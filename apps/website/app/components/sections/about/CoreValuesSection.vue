<script setup lang="ts">
const values = [
  {
    icon: 'lucide:lightbulb',
    title: 'Innovation',
    desc: "We use innovation to solve old problems in new ways—like using data and AI to predict your needs, reduce waste, and improve sourcing efficiency. It's how we keep you one step ahead, always.",
  },
  {
    icon: 'lucide:handshake',
    title: 'Trust',
    desc: "We earn your trust by carefully vetting every supplier and ensuring every item meets strict quality standards—if it's not good enough for us, it's not good enough for you.",
  },
  {
    icon: 'lucide:smile',
    title: 'Customer success',
    desc: "And we focus on customer success – your goals are our goals. Whether it's cutting costs, saving time, or growing your business, GoSource is your partner in prosperity.",
  },
];
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container flex flex-col gap-12 lg:gap-20">
      <div v-reveal class="mx-auto flex max-w-[36.125rem] flex-col items-center gap-8 text-center">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Core values</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-h1 text-grey-900">We're your partner to prosperity</h2>
          <p class="text-base leading-6 tracking-[0.00625em] text-grey-700">
            Together, let's create a future where sourcing food is stress-free, so
            you can focus on what you do best: delighting your customers with great
            food.
          </p>
        </div>
      </div>

      <div class="grid gap-10 lg:grid-cols-3 lg:gap-8">
        <div
          v-for="(value, index) in values"
          :key="value.title"
          v-reveal="index * 120"
          class="flex flex-col gap-4"
        >
          <Icon :name="value.icon" class="size-10 text-orange-500" />
          <div class="flex flex-col gap-2">
            <h3 class="font-display text-lg font-medium tracking-[-0.0125em] text-grey-900">
              {{ value.title }}
            </h3>
            <p class="text-sm leading-[1.3125rem] tracking-[0.00625em] text-grey-700">
              {{ value.desc }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
