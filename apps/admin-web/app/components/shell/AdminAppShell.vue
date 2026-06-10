<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SidebarProvider,
  TooltipProvider,
  toast,
} from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import type { AdminHeaderOptions } from '~/composables/useAdminHeader';
import AdminMobileNav from '~/components/shell/AdminMobileNav.vue';
import AdminSidebar from '~/components/shell/AdminSidebar.vue';
import AdminTopHeader from '~/components/shell/AdminTopHeader.vue';
import { useAdminAuthService } from '~/services/auth.service';
import { useAdminSession } from '~/composables/useAdminSession';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

const route = useRoute();
const mobileNavOpen = ref(false);
const sidebarExpanded = useState('admin-shell-sidebar-open', () => true);
const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
const { session, clearSession } = useAdminSession();
const authService = useAdminAuthService();

const headerState = ref<AdminHeaderOptions>({
  title: 'Dashboard',
});

watch(isDesktopViewport, (isDesktop) => {
  if (isDesktop) {
    mobileNavOpen.value = false;
  }
});

watch(
  () => route.fullPath,
  () => {
    if (!isDesktopViewport.value) {
      mobileNavOpen.value = false;
    }
  },
);

function setHeader(options: AdminHeaderOptions) {
  headerState.value = {
    ...options,
  };
}

provide('admin-layout', {
  setHeader,
});

const logoutConfirmOpen = ref(false);
const logoutLoading = ref(false);

function openLogoutConfirm() {
  logoutConfirmOpen.value = true;
}

function closeLogoutConfirm() {
  if (!logoutLoading.value) {
    logoutConfirmOpen.value = false;
  }
}

function onLogoutDialogOpenChange(value: boolean) {
  if (!value) {
    closeLogoutConfirm();
  }
}

async function confirmLogout() {
  if (logoutLoading.value) {
    return;
  }

  logoutLoading.value = true;

  try {
    await authService.logout();
  } catch {
    toast.error('Unable to reach the server to sign out. You have been signed out here.');
  } finally {
    logoutLoading.value = false;
  }

  logoutConfirmOpen.value = false;
  clearSession();
  mobileNavOpen.value = false;
  await navigateTo(ADMIN_PAGE_ROUTES.SIGN_IN);
}
</script>

<template>
  <TooltipProvider :delay-duration="200">
  <SidebarProvider v-model:open="sidebarExpanded">
    <div class="flex h-[100dvh] max-h-[100dvh] min-h-0 gap-0 overflow-hidden bg-[#1F4031] p-0 lg:gap-3 lg:p-3">
      <div v-if="isDesktopViewport" class="hidden shrink-0 lg:flex">
        <AdminSidebar
          :expanded="sidebarExpanded"
          @logout="openLogoutConfirm"
          @mobile-nav-close="mobileNavOpen = false"
        />
      </div>

      <div
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-2xl lg:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]"
      >
        <AdminTopHeader
          :header="headerState"
          @open-mobile-nav="mobileNavOpen = true"
        />

        <main class="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-6">
          <div class="mx-auto w-full max-w-[1650px]">
            <slot />
          </div>
        </main>
      </div>

      <AdminMobileNav
        :open="mobileNavOpen"
        @close="mobileNavOpen = false"
        @logout="openLogoutConfirm"
      />
    </div>

    <Dialog :open="logoutConfirmOpen" @update:open="onLogoutDialogOpenChange">
      <DialogContent class="z-[100]">
        <DialogHeader>
          <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription class="text-body-sm text-grey-text">
              You will need to sign in again to access the admin workspace.
            </DialogDescription>
          </div>
          <DialogClose class="shrink-0" :disabled="logoutLoading" />
        </DialogHeader>

        <DialogBody>
          <p class="text-body-sm text-grey-text">
            You will be signed out on this device.
          </p>
        </DialogBody>

        <DialogFooter class="grid grid-cols-2 gap-3">
          <Button variant="neutral" size="medium" class="w-full" :disabled="logoutLoading" @click="closeLogoutConfirm">
            Cancel
          </Button>
          <Button variant="destructive" size="medium" class="w-full" :loading="logoutLoading" @click="confirmLogout">
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </SidebarProvider>
  </TooltipProvider>
</template>
