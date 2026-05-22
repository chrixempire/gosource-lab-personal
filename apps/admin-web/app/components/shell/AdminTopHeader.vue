<script setup lang="ts">
import { SidebarRail, SidebarTrigger } from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import type { AdminHeaderOptions } from '~/composables/useAdminHeader';

defineProps<{
  header: AdminHeaderOptions;
}>();

const emit = defineEmits<{
  openMobileNav: [];
}>();
</script>

<template>
  <header class="flex h-[70px] shrink-0 items-stretch border-b border-grey-50 bg-white">
    <div class="flex w-[52px] shrink-0 items-center justify-center border-r border-grey-50 lg:hidden">
      <button
        type="button"
        class="inline-flex size-10 items-center justify-center rounded-xl border border-grey-50 bg-white text-grey-900"
        aria-label="Open navigation"
        @click="emit('openMobileNav')"
      >
        <Menu class="size-5" />
      </button>
    </div>

    <SidebarRail class="hidden bg-grey-50 lg:block" />

    <div class="hidden w-[68px] shrink-0 items-center justify-center lg:flex">
      <SidebarTrigger class="text-grey-900 hover:bg-grey-55" />
    </div>

    <div class="hidden items-center py-4 lg:flex">
      <SidebarRail class="h-full bg-grey-50" />
    </div>

    <div class="flex min-w-0 flex-1 items-center gap-3 px-4 md:px-6">
      <button
        v-if="header.goBack"
        type="button"
        class="rounded-lg p-2 text-grey-text hover:bg-grey-25"
        aria-label="Go back"
        @click="header.goBackTo ? navigateTo(header.goBackTo) : $router.back()"
      >
        <Icon name="i-lucide-arrow-left" class="h-5 w-5" />
      </button>

      <h1 v-if="header.title" class="min-w-0 flex-1 truncate text-lg font-semibold text-grey-900">
        {{ header.title }}
      </h1>

      <component :is="header.rightComponent" v-if="header.rightComponent" />
    </div>
  </header>
</template>
