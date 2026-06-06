<script setup lang="ts">
const teamPhotos = [
  { src: '/images/careers/team-1.png', alt: 'GoSource team member in branded polo shirt' },
  { src: '/images/careers/team-2.png', alt: 'GoSource colleagues collaborating in the office' },
  { src: '/images/careers/team-3.png', alt: 'GoSource team member smiling at work' },
  { src: '/images/careers/team-4.png', alt: 'GoSource team culture moment' },
];
</script>

<template>
  <section class="relative overflow-hidden bg-orange-25">
    <div
      class="site-container relative flex flex-col items-center pb-10 pt-14 sm:pt-16 lg:min-h-[45.8125rem] lg:justify-start lg:pb-16 lg:pt-[8.125rem]"
    >
      <div v-reveal class="relative z-10 mx-auto flex max-w-[42rem] flex-col items-center gap-6 text-center">
        <h1 class="text-display text-grey-900">Let's make it happen</h1>
        <p class="max-w-[42rem] text-base leading-relaxed tracking-[-0.015em] text-grey-700 sm:text-lg lg:text-xl lg:leading-[1.5]">
          It doesn't matter how you look, where you are from, or any other aspect about
          yourself, we can't wait to meet you.
        </p>
        <AppButton variant="primary" size="sm" href="#open-roles">
          View open roles
          <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
        </AppButton>
      </div>

      <div
        v-reveal="160"
        class="relative mt-12 w-full lg:absolute lg:bottom-0 lg:mt-0 lg:translate-y-2"
      >
        <div class="hmask overflow-hidden pb-4">
          <div class="flex w-max animate-hscroll items-center gap-8">
            <div
              v-for="(photo, index) in [...teamPhotos, ...teamPhotos]"
              :key="`${photo.src}-${index}`"
              class="group h-40 w-56 shrink-0 overflow-hidden rounded-2xl bg-[#fadcd6] sm:h-52 sm:w-72 lg:h-[17.5625rem] lg:w-[21.3125rem]"
            >
              <img
                :src="photo.src"
                :alt="index < teamPhotos.length ? photo.alt : ''"
                :aria-hidden="index >= teamPhotos.length ? 'true' : undefined"
                class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
          </div>
        </div>

        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-orange-25 to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
</template>
