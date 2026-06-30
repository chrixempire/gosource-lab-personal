<script setup lang="ts">
import type { CustomerMeResponse } from '@gosource/api-client';
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
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  TooltipProvider,
  toast,
} from '@gosource/ui';
import { Menu } from 'lucide-vue-next';
import CustomerPageTitleInfo from '~/components/layout/customer/CustomerPageTitleInfo.vue';
import CustomerSidebar from '~/components/layout/customer/CustomerSidebar.vue';
import CustomerThemeToggle from '~/components/layout/customer/CustomerThemeToggle.vue';
import CustomerFeedbackWidget from '~/components/feedback/CustomerFeedbackWidget.vue';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
  CUSTOMER_MOBILE_NAV_BACKDROP_Z,
  CUSTOMER_MOBILE_NAV_DRAWER_Z,
} from '~/lib/customer-overlay-z';
import { resolveCustomerPageDescription } from '~/lib/customer-page-descriptions';
import { useCustomerRouteLoading } from '~/composables/useCustomerRouteLoading';
import { useCustomerPageHeader } from '~/composables/useCustomerPageHeader';
import MarketHeaderCartButton from '~/components/market/MarketHeaderCartButton.vue';
import MarketSearch from '~/components/market/MarketSearch.vue';
import { useBusinessBranchContext } from '~/composables/useBusinessBranchContext';
import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';
import { useMarketplaceCart } from '~/composables/useMarketplaceCart';
import { useCustomerSession } from '~/composables/useCustomerSession';
import { useCustomerSignOut } from '~/composables/useCustomerSignOut';
import { extractApiErrorMessage } from '~/utils/api-error';

const { session, clearSession } = useCustomerSession();
const { isNavigating: routeNavigating } = useCustomerRouteLoading();
const { beginIntentionalSignOut } = useCustomerSignOut();
const { clearAllDismissals } = useMarketBranchSetupDismissal();
const { resetCartState } = useMarketplaceCart();
const { ensureBranchesLoaded, clearActiveBranchForLogout, hasSession } =
  useBusinessBranchContext();

if (import.meta.client) {
  onMounted(() => {
    if (hasSession.value) {
      void ensureBranchesLoaded();
    }
  });
}

const props = withDefaults(
  defineProps<{
    /** Show cart control in header (market layout). */
    showMarketHeaderCart?: boolean;
    /** Use tighter main padding on market routes. */
    marketMainPadding?: boolean;
    /** Hide the route title in the shell header (e.g. Explore playground). */
    hidePageTitle?: boolean;
    /** Remove top padding on main so sticky bars sit flush under the header. */
    flushMainTopPadding?: boolean;
  }>(),
  {
    showMarketHeaderCart: false,
    marketMainPadding: false,
    hidePageTitle: false,
    flushMainTopPadding: false,
  },
);

const route = useRoute();
const { header: pageHeaderOverride } = useCustomerPageHeader();
const mobileNavOpen = ref(false);
const desktopSidebarOpen = useState('customer-shell-sidebar-open', () => true);
const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
const pageTitleMap: Array<{ match: string; title: string }> = [
  { match: '/market', title: 'Market' },
  { match: '/explore', title: 'Explore' },
  { match: '/business-insight', title: 'Business insight' },
  { match: '/track-orders', title: 'Orders' },
  { match: '/wallet', title: 'Wallet' },
  { match: '/credit', title: 'Credit' },
  { match: '/manage-requests', title: 'Request' },
  { match: '/checkout', title: 'Checkout' },
  { match: '/lists', title: 'Lists' },
  { match: '/branches', title: 'Branches' },
  { match: '/members', title: 'Members' },
  { match: '/settings/my-profile', title: 'My Profile' },
  // Standalone Business Profile now redirects to the Business profile tab on My Profile.
  // { match: '/settings/business-profile', title: 'Business Profile' },
  { match: '/settings/security', title: 'Security' },
  { match: '/settings/help-support', title: 'Help & Support' },
];

const pageTitle = computed(() => {
  if (pageHeaderOverride.value.title) {
    return pageHeaderOverride.value.title;
  }

  const matchedPage = pageTitleMap.find(({ match }) => route.path === match || route.path.startsWith(`${match}/`));
  return matchedPage?.title ?? 'GoSource';
});

const pageDescription = computed(() =>
  resolveCustomerPageDescription(route.path, session.value),
);

const isMarketCategoryPage = computed(() => /^\/market\/category\/[^/]+$/.test(route.path));
const isMarketProductPage = computed(() => /^\/market\/product\/[^/]+$/.test(route.path));
const isMarketRecentOrdersPage = computed(() => route.path === '/market/recent-orders');

/** Mobile header: route segment label only (e.g. "Category", not the category name). */
const mobileHeaderTitle = computed(() => {
  if (isMarketCategoryPage.value) {
    return 'Category';
  }
  if (isMarketProductPage.value) {
    return 'Product';
  }
  if (isMarketRecentOrdersPage.value) {
    return 'Recently ordered';
  }
  return pageTitle.value;
});

const showHeaderCart = computed(
  () => props.showMarketHeaderCart && !route.path.startsWith('/checkout'),
);

const isMarketShellRoute = computed(
  () =>
    route.path === '/market' ||
    route.path.startsWith('/market/') ||
    route.path === '/explore' ||
    route.path.startsWith('/explore/'),
);

const showMarketHeaderSearch = computed(
  () => showHeaderCart.value && isMarketShellRoute.value,
);

const useTightMainPadding = computed(
  () => props.marketMainPadding && isMarketShellRoute.value,
);

const mainPaddingClass = computed(() => {
  if (useTightMainPadding.value || props.flushMainTopPadding) {
    return 'pb-4 pt-0 lg:pb-6';
  }

  return 'py-4 lg:py-6';
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
  beginIntentionalSignOut();

  try {
    await $fetch('/api/auth/session/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      'Unable to reach the server to sign out. You have been signed out here.',
    );
    if (message) {
      toast.error(message);
    }
  } finally {
    logoutLoading.value = false;
  }

  logoutConfirmOpen.value = false;
  clearAllDismissals();
  clearActiveBranchForLogout();
  resetCartState();
  clearSession();
  // Reset the feedback button to its default (grouped) position on sign-out —
  // drag placement is treated as a within-session nudge, not a permanent pref.
  if (import.meta.client) {
    localStorage.removeItem('customer-feedback-fab-pos');
  }
  mobileNavOpen.value = false;

  await navigateTo('/auth/sign-in');
}
</script>

<template>
  <SidebarProvider v-model:open="desktopSidebarOpen">
    <TooltipProvider :delay-duration="200">
    <div>
      <div
        v-if="routeNavigating"
        class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left animate-pulse bg-primary-500"
        role="progressbar"
        aria-hidden="true"
      />
      <div
        class="customer-shell-frame flex h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden text-grey-900 lg:h-screen lg:max-h-screen"
      >
        <!-- Desktop sidebar: shares the frame surface (no border); brand lives at its top. -->
        <div class="hidden shrink-0 lg:block">
          <Sidebar class="h-screen" width="250px" collapsed-width="0rem">
            <CustomerSidebar
              :session="session"
              @logout-request="openLogoutConfirm"
              @mobile-nav-close="mobileNavOpen = false"
            />
          </Sidebar>
        </div>

        <!-- Content: a floating, rounded white card inset from the frame on desktop. -->
        <SidebarInset class="flex min-h-0 min-w-0 flex-1 flex-col p-0 lg:p-2">
          <div
            class="customer-content-surface flex min-h-0 flex-1 flex-col overflow-hidden border-grey-50 shadow-[0_1px_2px_0_rgba(16,24,40,0.04)] lg:rounded-xl lg:border"
          >
            <header
              class="relative z-30 flex h-16 shrink-0 items-center gap-2 border-b border-grey-50 px-3 sm:gap-3 sm:px-4 lg:h-[60px] lg:px-5"
              :class="showMarketHeaderSearch ? '' : 'justify-between'"
            >
              <!-- Mobile: open the navigation drawer. -->
              <button
                type="button"
                class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-grey-900 transition-colors hover:bg-grey-55 lg:hidden"
                @click="mobileNavOpen = true"
              >
                <span class="sr-only">Open navigation</span>
                <Menu class="size-5" />
              </button>

              <!-- Desktop: collapse / expand the sidebar. -->
              <SidebarTrigger
                class="hidden shrink-0 cursor-pointer text-grey-900 transition-colors hover:bg-grey-55 lg:inline-flex"
              />

              <span
                class="hidden h-5 w-px shrink-0 bg-grey-50 lg:block"
                aria-hidden="true"
              />

              <div
                v-if="!hidePageTitle"
                class="flex min-w-0 items-center gap-0.5"
                :class="
                  showMarketHeaderSearch
                    ? 'flex-1 lg:max-w-[min(100%,12rem)] lg:shrink-0 lg:flex-none'
                    : 'flex-1'
                "
              >
                <h1 class="min-w-0 truncate text-h5 lg:text-h4">
                  <span class="lg:hidden">{{ mobileHeaderTitle }}</span>
                  <span v-if="isMarketRecentOrdersPage" class="hidden lg:contents">
                    <span>Market</span>
                    <span class="mx-1 font-normal">/</span>
                    <span class="text-grey-300">Recently ordered</span>
                  </span>
                  <span v-else class="hidden lg:inline">{{ pageTitle }}</span>
                </h1>
                <CustomerPageTitleInfo
                  v-if="pageDescription"
                  :description="pageDescription"
                  class="shrink-0"
                />
              </div>

              <div v-else class="min-w-0 flex-1" aria-hidden="true" />

              <MarketSearch v-if="showMarketHeaderSearch" class="shrink-0 lg:min-w-0 lg:flex-1" />

              <div class="ml-auto flex shrink-0 items-center gap-2">
                <CustomerThemeToggle />
                <!-- Notification bell is intentionally disabled until the in-app notification flow is implemented. -->
                <MarketHeaderCartButton v-if="showHeaderCart" />
              </div>
            </header>

            <main
              id="customer-shell-scroll"
              :class="[
                'customer-content-surface min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 [-webkit-overflow-scrolling:touch] sm:px-5 lg:px-6',
                mainPaddingClass,
              ]"
            >
              <div class="mx-auto w-full">
                <slot name="before-content" />
                <slot />
              </div>
            </main>
          </div>
        </SidebarInset>

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
              class="customer-shell-overlay fixed inset-0 backdrop-blur-[2px] lg:hidden"
              :class="CUSTOMER_MOBILE_NAV_BACKDROP_Z"
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
              class="customer-shell-frame fixed inset-y-0 left-0 w-[min(84vw,20rem)] border-r border-grey-50 shadow-[24px_0_64px_-24px_rgba(16,24,40,0.32)] lg:hidden"
              :class="CUSTOMER_MOBILE_NAV_DRAWER_Z"
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

      <!-- Floating actions: feedback on every page; the cart joins it (to the
           right, 8px apart) on market pages via the floating-actions slot. -->
      <div
        class="fixed z-[60] flex items-center gap-2 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] sm:bottom-6 sm:right-6"
      >
        <ClientOnly>
          <CustomerFeedbackWidget />
        </ClientOnly>
        <slot name="floating-actions" />
      </div>

      <Dialog :open="logoutConfirmOpen" @update:open="onLogoutDialogOpenChange">
        <DialogContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
          <DialogHeader>
            <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
              <DialogTitle>Log out?</DialogTitle>
              <DialogDescription class="text-body-sm text-grey-text">
                You will need to sign in again to access your workspace.
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
    </div>
    </TooltipProvider>
  </SidebarProvider>
</template>
