<script setup lang="ts">
import { BrandLogo } from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import CustomerUserMenu from './CustomerUserMenu.vue';

defineProps<{
  title: string;
  description: string;
  session: {
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };
  } | null;
}>();

const emit = defineEmits<{
  toggleMobileNav: [];
  settings: [];
  logoutRequest: [];
}>();
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-grey-50 bg-background-on-canvas/90 backdrop-blur">
    <div class="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full border border-grey-50 bg-background-on-canvas text-grey-900 lg:hidden"
          @click="emit('toggleMobileNav')"
        >
          <Menu class="size-5" />
        </button>

        <NuxtLink to="/market" class="lg:hidden">
          <BrandLogo class="w-28" />
        </NuxtLink>

        <div class="hidden min-w-0 sm:block">
          <h1 class="truncate text-lg font-semibold text-grey-900">
            {{ title }}
          </h1>
          <p class="truncate text-xs text-grey-300">
            {{ description }}
          </p>
        </div>
      </div>

      <CustomerUserMenu :session="session" @settings="emit('settings')" @logout-request="emit('logoutRequest')" />
    </div>
  </header>
</template>
