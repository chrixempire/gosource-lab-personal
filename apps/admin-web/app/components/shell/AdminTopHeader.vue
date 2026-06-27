<script setup lang="ts">
import { SidebarRail, SidebarTrigger } from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import AdminPageTitleInfo from '~/components/shell/AdminPageTitleInfo.vue';
import OrderSoundToggle from '~/components/shell/OrderSoundToggle.vue';
import type { AdminHeaderOptions } from '~/composables/useAdminHeader';
import { resolveAdminPageDescription } from '~/lib/admin-page-descriptions';

const props = defineProps<{
  header: AdminHeaderOptions;
}>();

const emit = defineEmits<{
  openMobileNav: [];
}>();

const route = useRoute();

const pageDescription = computed(() => {
  if (props.header.description !== undefined) {
    return props.header.description;
  }

  return resolveAdminPageDescription(route.path);
});
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

      <div v-if="header.title" class="flex min-w-0 flex-1 items-center gap-0.5">
        <h1 class="min-w-0 truncate text-h6 lg:text-h4">
          {{ header.title }}
        </h1>
        <AdminPageTitleInfo
          v-if="pageDescription"
          :description="pageDescription"
          class="shrink-0"
        />
      </div>

      <component :is="header.rightComponent" v-if="header.rightComponent" />

      <OrderSoundToggle />
    </div>
  </header>
</template>
