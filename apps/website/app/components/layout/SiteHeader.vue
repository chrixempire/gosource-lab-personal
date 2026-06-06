<script setup lang="ts">
import { ref, watch } from 'vue';
import { useScroll } from '@vueuse/core';

const { y } = useScroll(import.meta.client ? window : null);

const mobileOpen = ref(false);

const navLinks = [
  {
    label: 'Features',
    children: [
      { label: 'Bulk procurement', href: '/#features' },
      { label: 'Credit access', href: '/#features' },
      { label: 'Wallet management', href: '/#features' },
      { label: 'Dashboard insights', href: '/#features' },
    ],
  },
  { label: 'Blog', href: '#' },
  { label: 'FAQs', href: '/faq' },
  {
    label: 'Company',
    children: [
      { label: 'About us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

watch(mobileOpen, (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : '';
  }
});

function close() {
  mobileOpen.value = false;
}
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full transition-all duration-300"
    :class="y > 12 ? 'border-b border-grey-100 bg-white/90 shadow-xsmall backdrop-blur-md' : 'bg-white'"
  >
    <div class="site-container flex h-[72px] items-center justify-between gap-4">
      <NuxtLink to="/" aria-label="GoSource home" @click="close">
        <BrandLogo />
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 lg:flex">
        <div v-for="link in navLinks" :key="link.label" class="group relative">
          <component
            :is="link.href ? 'a' : 'button'"
            :href="link.href"
            type="button"
            class="flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.95rem] font-medium text-grey-700 transition-colors hover:text-grey-900"
          >
            {{ link.label }}
            <Icon
              v-if="link.children"
              name="lucide:chevron-down"
              class="size-4 text-grey-400 transition-transform duration-200 group-hover:rotate-180"
            />
          </component>

          <div
            v-if="link.children"
            class="invisible absolute left-0 top-full pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100"
          >
            <div class="w-56 rounded-2xl border border-grey-100 bg-white p-2 shadow-medium">
              <a
                v-for="child in link.children"
                :key="child.label"
                :href="child.href"
                class="block rounded-xl px-3 py-2.5 text-sm font-medium text-grey-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                {{ child.label }}
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Desktop actions -->
      <div class="hidden items-center gap-3 lg:flex">
        <a href="#" class="px-3 py-2 text-[0.95rem] font-medium text-grey-700 transition-colors hover:text-grey-900">
          Log in
        </a>
        <AppButton variant="white" size="sm" href="#" class="!h-10 !px-5">
          Explore market
          <Icon name="lucide:chevron-right" class="size-4" />
        </AppButton>
      </div>

      <!-- Mobile toggle -->
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-xl text-grey-800 transition hover:bg-grey-100 lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Toggle menu"
        @click="mobileOpen = !mobileOpen"
      >
        <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-6" />
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 -translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileOpen"
        class="absolute inset-x-0 top-full max-h-[calc(100vh-72px)] overflow-y-auto border-b border-grey-100 bg-white px-5 pb-8 pt-2 shadow-large lg:hidden"
      >
        <nav class="flex flex-col">
          <template v-for="link in navLinks" :key="link.label">
            <a
              v-if="link.href"
              :href="link.href"
              class="border-b border-grey-100 py-4 text-base font-medium text-grey-800"
              @click="close"
            >
              {{ link.label }}
            </a>
            <details v-else class="group border-b border-grey-100">
              <summary
                class="flex cursor-pointer list-none items-center justify-between py-4 text-base font-medium text-grey-800"
              >
                {{ link.label }}
                <Icon name="lucide:chevron-down" class="size-5 text-grey-400 transition-transform group-open:rotate-180" />
              </summary>
              <div class="flex flex-col gap-1 pb-3 pl-3">
                <a
                  v-for="child in link.children"
                  :key="child.label"
                  :href="child.href"
                  class="rounded-lg py-2.5 text-sm text-grey-600"
                  @click="close"
                >
                  {{ child.label }}
                </a>
              </div>
            </details>
          </template>
        </nav>

        <div class="mt-6 flex flex-col gap-3">
          <AppButton variant="white" href="#" block @click="close">Log in</AppButton>
          <AppButton variant="primary" href="#" block @click="close">
            Explore market
            <Icon name="lucide:chevron-right" class="size-4" />
          </AppButton>
        </div>
      </div>
    </Transition>
  </header>
</template>
