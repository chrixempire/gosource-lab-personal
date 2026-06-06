<script setup lang="ts">
const photos = [
  { src: '/images/about/what-a.png', alt: 'Selecting fresh produce at the market', imgClass: 'object-cover object-bottom' },
  { src: '/images/about/what-b.png', alt: 'A GoSource sourcing partner', imgClass: 'object-cover' },
  { src: '/images/about/what-c.png', alt: 'Loading bulk supplies for delivery', imgClass: 'object-cover object-bottom' },
] as const;

const featuredPhoto = photos[2];
</script>

<template>
  <section class="bg-white py-16 lg:py-24">
    <div class="site-container grid items-start gap-12 lg:grid-cols-[minmax(0,31.1875rem)_1fr] lg:gap-32">
      <div v-reveal class="flex flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">What we do</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-h1 text-grey-900">
            We handle the heavy lifting - literally and figuratively
          </h2>
          <p class="text-base leading-6 tracking-[0.00625em] text-grey-700">
            We source directly from farmers, wholesalers, and verified suppliers
            to deliver fresh, affordable food—without the market stress. Whether
            you're running a restaurant or stocking your home, GoSource ensures
            convenience, quality, and savings.
          </p>
        </div>
      </div>

      <div v-reveal="120" class="flex flex-col gap-8">
        <div class="grid grid-cols-2 gap-8">
          <div
            v-for="photo in photos.slice(0, 2)"
            :key="photo.src"
            class="group h-44 overflow-hidden rounded-2xl sm:h-52 lg:h-[17.125rem]"
          >
            <img
              :src="photo.src"
              :alt="photo.alt"
              :class="['size-full transition-transform duration-700 ease-out group-hover:scale-[1.03]', photo.imgClass]"
            />
          </div>
        </div>
        <div class="group h-44 overflow-hidden rounded-2xl sm:h-52 lg:h-[17.125rem]">
          <img
            :src="featuredPhoto.src"
            :alt="featuredPhoto.alt"
            :class="['size-full transition-transform duration-700 ease-out group-hover:scale-[1.03]', featuredPhoto.imgClass]"
          />
        </div>
      </div>
    </div>
  </section>
</template>
