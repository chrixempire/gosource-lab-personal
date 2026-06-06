<script setup lang="ts">
const columns = [
  {
    title: 'Who we serve',
    links: ['Restaurants & Bars', 'Hotels & Resorts', 'Caterers', 'Retail food sellers', 'Home consumers'],
  },
  {
    title: 'Features',
    links: ['Bulk procurement', 'Credit access', 'Dashboard management'],
  },
  {
    title: 'Quick links',
    links: ['About Us', 'Help/FAQ', 'Blog', 'Careers', 'Contact us'],
  },
];

const socials = [
  { name: 'X', icon: 'lucide:twitter', href: '#' },
  { name: 'Instagram', icon: 'lucide:instagram', href: '#' },
  { name: 'LinkedIn', icon: 'lucide:linkedin', href: '#' },
  { name: 'YouTube', icon: 'lucide:youtube', href: '#' },
];

const year = new Date().getFullYear();
</script>

<template>
  <footer id="footer" class="border-t border-grey-100 bg-white">
    <div class="site-container py-16 lg:py-20">
      <div class="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-12">
        <!-- Brand -->
        <div class="col-span-2 md:col-span-3 lg:col-span-4">
          <BrandLogo />
          <p class="mt-5 max-w-[16rem] text-[0.95rem] leading-relaxed text-grey-500">
            All your food supplies, one platform — Fast &amp; Affordable.
          </p>
        </div>

        <!-- Link columns -->
        <div
          v-for="col in columns"
          :key="col.title"
          class="lg:col-span-2"
        >
          <h3 class="font-display text-base font-medium text-grey-900">{{ col.title }}</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="link in col.links" :key="link">
              <a
                href="#"
                class="text-[0.95rem] text-grey-500 transition-colors hover:text-primary-700"
              >
                {{ link }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal + contact -->
        <div class="col-span-2 md:col-span-3 lg:col-span-2">
          <h3 class="font-display text-base font-medium text-grey-900">Legal</h3>
          <ul class="mt-4 space-y-3">
            <li>
              <NuxtLink to="/privacy-policy" class="text-[0.95rem] text-grey-500 transition-colors hover:text-primary-700">
                Privacy policy
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/terms-of-service"
                class="inline-flex items-center gap-1 text-[0.95rem] font-medium text-grey-700 transition-colors hover:text-primary-700"
              >
                Terms of Use
                <Icon name="lucide:arrow-up-right" class="size-3.5" />
              </NuxtLink>
            </li>
          </ul>

          <h3 class="mt-8 font-display text-base font-medium text-grey-900">Contact</h3>
          <address class="mt-4 space-y-3 not-italic">
            <p class="text-[0.95rem] leading-relaxed text-grey-500">123 Food Hub Avenue,<br />Ikeja, Lagos, NG</p>
            <a href="mailto:support@gosource.app" class="block text-[0.95rem] font-medium text-primary-700 underline-offset-2 hover:underline">
              support@gosource.app
            </a>
            <a href="tel:09061827124" class="block text-[0.95rem] font-medium text-primary-700 underline-offset-2 hover:underline">
              0906 182 7124
            </a>
          </address>
        </div>
      </div>

      <div class="mt-14 flex flex-col-reverse items-start justify-between gap-6 border-t border-grey-100 pt-8 sm:flex-row sm:items-center">
        <p class="flex items-center gap-2 text-sm text-grey-500">
          <Icon name="lucide:copyright" class="size-4" />
          {{ year }}, GoSource (IPC-Africa) All rights reserved.
        </p>
        <div class="flex items-center gap-3">
          <a
            v-for="s in socials"
            :key="s.name"
            :href="s.href"
            :aria-label="s.name"
            class="flex size-9 items-center justify-center rounded-lg bg-grey-900 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-supporting-900"
          >
            <Icon :name="s.icon" class="size-4" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
