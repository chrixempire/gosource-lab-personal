<script setup lang="ts">
// Join us — recruiting CTA and team-photo collage on grey-50 (Figma 891:12309).
</script>

<template>
  <section class="bg-grey-50 py-16 lg:py-24">
    <div class="site-container flex flex-col gap-12 lg:gap-20">
      <div v-reveal class="flex max-w-[33.125rem] flex-col gap-8">
        <span class="text-lg font-semibold tracking-[0.02em] text-orange-500">Join us</span>
        <div class="flex flex-col gap-2">
          <h2 class="text-h1 text-grey-900">Come work with us</h2>
          <p class="text-base leading-6 tracking-[0.00625em] text-grey-700">
            Come do meaningful work with kind, smart colleagues who're invested in
            your growth.
          </p>
        </div>
        <div>
          <AppButton variant="primary" size="sm" href="/careers">
            View open roles
            <Icon name="lucide:chevron-right" class="size-5 transition-transform group-hover:translate-x-0.5" />
          </AppButton>
        </div>
      </div>

      <div class="flex flex-col gap-10 lg:gap-[2.625rem]">
        <div
          v-reveal="80"
          class="group h-56 overflow-hidden rounded-3xl bg-grey-75 sm:h-72 lg:h-[20.6875rem]"
        >
          <img
            src="/images/about/join-top.png"
            alt="The GoSource team"
            class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
        </div>

        <div class="grid gap-10 lg:grid-cols-[28.3125rem_1fr] lg:gap-[2.625rem]">
          <div
            v-reveal="140"
            class="group h-56 overflow-hidden rounded-3xl bg-grey-75 sm:h-64 lg:h-[20.6875rem]"
          >
            <img
              src="/images/about/join-bl.png"
              alt="GoSource colleagues"
              class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          </div>
          <div
            v-reveal="200"
            class="group h-56 overflow-hidden rounded-3xl bg-grey-75 sm:h-64 lg:h-[20.6875rem]"
          >
            <img
              src="/images/about/join-br.png"
              alt="GoSource colleagues"
              class="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
