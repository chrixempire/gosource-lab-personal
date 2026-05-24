<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
import { useMediaQuery } from '@vueuse/core';
import {
  BrandLogo,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  toast,
} from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import CustomerSidebar from '~/components/layout/customer/CustomerSidebar.vue';
import MarketHeaderCartButton from '~/components/market/MarketHeaderCartButton.vue';
import MarketSearch from '~/components/market/MarketSearch.vue';
import { getMarketCategoryById } from '~/lib/marketplace-data';
import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { extractApiErrorMessage } from '~/utils/api-error';

const { clearAllDismissals } = useMarketBranchSetupDismissal();
const { resetCartState } = useMarketplaceCart();

const props = withDefaults(
  defineProps<{
    /** Show cart control in header (market layout). */
    showMarketHeaderCart?: boolean;
    /** Use tighter main padding on market routes. */
    marketMainPadding?: boolean;
  }>(),
  {
    showMarketHeaderCart: false,
    marketMainPadding: false,
  },
);

const route = useRoute();
const mobileNavOpen = ref(false);
const desktopSidebarOpen = useState('customer-shell-sidebar-open', () => true);
const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
const session = useState<CustomerMeResponse | null>('customer-session', () => null);

const pageTitleMap: Array<{ match: string; title: string }> = [
  { match: '/market', title: 'Market' },
  { match: '/track-orders', title: 'Orders' },
  { match: '/wallet', title: 'Wallet' },
  { match: '/manage-requests', title: 'Request' },
  { match: '/checkout', title: 'Checkout' },
  { match: '/lists', title: 'Lists' },
  { match: '/branches', title: 'Branches' },
  { match: '/members', title: 'Members' },
  { match: '/settings/my-profile', title: 'My Profile' },
  { match: '/settings/business-profile', title: 'Business Profile' },
  { match: '/settings/security', title: 'Security' },
  { match: '/settings/help-support', title: 'Help & Support' },
];

const pageTitle = computed(() => {
  const matchedPage = pageTitleMap.find(({ match }) => route.path === match || route.path.startsWith(`${match}/`));
  return matchedPage?.title ?? 'GoSource';
});

const isMarketCategoryPage = computed(() => /^\/market\/category\/[^/]+$/.test(route.path));
const isMarketProductPage = computed(() => /^\/market\/product\/[^/]+$/.test(route.path));

const marketCategoryHeaderTitle = computed(() => {
  const id = route.params.id;
  if (typeof id !== 'string') {
    return '';
  }
  return getMarketCategoryById(id)?.title ?? '';
});

/** Mobile header: route segment label only (e.g. "Category", not the category name). */
const mobileHeaderTitle = computed(() => {
  if (isMarketCategoryPage.value) {
    return 'Category';
  }
  if (isMarketProductPage.value) {
    return 'Product';
  }
  return pageTitle.value;
});

const showHeaderCart = computed(() => props.showMarketHeaderCart);

const showMarketHeaderSearch = computed(
  () => showHeaderCart.value && route.path.startsWith('/market'),
);

const useTightMainPadding = computed(() => props.marketMainPadding && route.path.startsWith('/market'));

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
    await $fetch('/api/auth/session/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch (error) {
    toast.error(
      extractApiErrorMessage(error, 'Unable to reach the server to sign out. You have been signed out here.'),
    );
  } finally {
    logoutLoading.value = false;
  }

  logoutConfirmOpen.value = false;
  clearAllDismissals();
  resetCartState();
  session.value = null;
  mobileNavOpen.value = false;
  await navigateTo('/auth/sign-in');
}
</script>

<template>
  <SidebarProvider v-model:open="desktopSidebarOpen">
    <div>
      <div
        class="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#f7fbf7_0%,#ffffff_100%)] text-grey-900 lg:h-screen lg:max-h-screen"
      >
        <header
          class="flex h-16 max-lg:h-16 shrink-0 items-stretch border-b border-grey-50 bg-background-on-canvas lg:h-[72px]"
        >
          <div class="flex w-[52px] shrink-0 items-center justify-center border-r border-grey-50 lg:hidden">
            <button
              type="button"
              class="inline-flex size-10 items-center justify-center rounded-xl border border-grey-50 bg-white text-grey-900"
              @click="mobileNavOpen = true"
            >
              <span class="sr-only">Open navigation</span>
              <Menu class="size-5" />
            </button>
          </div>

          <div
            class="flex min-w-0 max-w-[38%] shrink-0 items-center px-2.5 sm:max-w-[46%] sm:px-4 lg:w-[270px] lg:max-w-none lg:px-6"
          >
            <BrandLogo class="h-5 w-auto max-w-[6.25rem] sm:h-6 sm:max-w-[7.25rem] lg:h-auto lg:w-[128px] lg:max-w-none" />
          </div>

          <SidebarRail class="hidden bg-grey-50 lg:block" />

          <div class="hidden w-[72px] shrink-0 items-center justify-center lg:flex">
            <SidebarTrigger class="text-grey-900 hover:bg-grey-55" />
          </div>

          <div class="hidden items-center py-4 lg:flex">
            <SidebarRail class="h-full bg-grey-50" />
          </div>

          <div
            class="flex min-w-0 flex-1 items-center gap-2 px-2.5 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6"
            :class="showMarketHeaderSearch ? '' : 'justify-between'"
          >
            <h1
              class="truncate text-[15px] font-semibold leading-tight text-grey-900 lg:text-lg"
              :class="
                showMarketHeaderSearch
                  ? 'min-w-0 flex-1 lg:max-w-[9rem] lg:shrink-0 lg:flex-none'
                  : 'min-w-0 flex-1'
              "
            >
              <span class="lg:hidden">{{ mobileHeaderTitle }}</span>
              <span
                v-if="isMarketCategoryPage && marketCategoryHeaderTitle"
                class="hidden lg:contents"
              >
                <span>Market</span>
                <span class="mx-1 font-normal">/</span>
                <span class="text-grey-300">{{ marketCategoryHeaderTitle }}</span>
              </span>
              <span v-else class="hidden lg:inline">{{ pageTitle }}</span>
            </h1>

            <MarketSearch v-if="showMarketHeaderSearch" class="shrink-0 lg:min-w-0 lg:flex-1" />

            <MarketHeaderCartButton v-if="showHeaderCart" class="shrink-0" />
          </div>
        </header>

        <div class="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <Sidebar
            class="hidden h-[calc(100vh-72px)] border-r border-grey-50 bg-background-on-canvas lg:flex"
            width="271px"
            collapsed-width="0rem"
          >
            <CustomerSidebar
              :session="session"
              @logout-request="openLogoutConfirm"
              @mobile-nav-close="mobileNavOpen = false"
            />
          </Sidebar>

          <SidebarInset class="flex min-h-0 min-w-0 flex-1 flex-col">
            <main
              id="customer-shell-scroll"
              :class="[
                'min-h-0 flex-1 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-y-contain px-4 [overflow-scrolling:touch] sm:px-5 lg:max-h-none lg:h-[calc(100vh-72px)] lg:px-6',
                useTightMainPadding ? 'pb-4 pt-0 lg:pb-6' : 'py-4 lg:py-6',
              ]"
            >
              <div class="mx-auto w-full">
                <slot name="before-content" />
                <slot />
              </div>
            </main>
          </SidebarInset>
        </div>

        <Teleport to="body">
          <Transition
            enter-active-class="transition-opacity duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-250 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="mobileNavOpen"
              class="fixed inset-0 z-50 bg-[rgba(16,24,40,0.3)] backdrop-blur-[2px] lg:hidden"
              @click="mobileNavOpen = false"
            />
          </Transition>

          <Transition
            enter-active-class="transition-transform duration-300 ease-out"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition-transform duration-250 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
          >
            <aside
              v-if="mobileNavOpen"
              class="fixed inset-y-0 left-0 z-[60] w-[min(84vw,20rem)] border-r border-grey-50 bg-background-on-canvas shadow-[24px_0_64px_-24px_rgba(16,24,40,0.32)] lg:hidden"
            >
              <CustomerSidebar
                :session="session"
                @logout-request="openLogoutConfirm"
                @mobile-nav-close="mobileNavOpen = false"
              />
            </aside>
          </Transition>
        </Teleport>
      </div>

      <slot name="overlays" />

      <Dialog :open="logoutConfirmOpen" @update:open="onLogoutDialogOpenChange">
        <DialogContent class="z-[100]">
          <DialogHeader>
            <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
              <DialogTitle class="text-[24px] font-semibold text-grey-900">
                Log out?
              </DialogTitle>
              <DialogDescription class="text-[12px] leading-5 text-grey-text">
                You will need to sign in again to access your workspace.
              </DialogDescription>
            </div>
            <DialogClose class="shrink-0" :disabled="logoutLoading" />
          </DialogHeader>

          <DialogBody>
            <p class="text-sm leading-6 text-grey-text">
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
    </div>
  </SidebarProvider>
</template>
