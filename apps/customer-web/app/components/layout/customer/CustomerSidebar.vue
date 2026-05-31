<script setup lang="ts">
import type { Component } from 'vue';
import type { CustomerMeResponse } from '@gosource/api-client';
import {
  Button,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@gosource/ui';
import {
  ClipboardList,
  CreditCard,
  ChevronDown,
  BarChart3,
  LayoutGrid,
  Layers3,
  MessageCircleQuestion,
  NotebookPen,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-vue-next';
import CustomerSidebarBranchSwitcher from './CustomerSidebarBranchSwitcher.vue';
import CustomerThemeToggle from './CustomerThemeToggle.vue';
import CustomerUserMenu from './CustomerUserMenu.vue';
import { customerSignInLocation } from '~/lib/auth-redirect';
import { isBusinessOwnerSession } from '~/lib/customer-roles';

type NavLeaf = {
  label: string;
  icon: Component;
  path: string;
};

const props = defineProps<{
  session: CustomerMeResponse | null;
}>();

const emit = defineEmits<{
  logoutRequest: [];
  mobileNavClose: [];
}>();

const route = useRoute();
const settingsOpen = ref(false);
const signInTo = computed(() => customerSignInLocation(route.fullPath));

const isGuest = computed(() => !props.session?.data?.businessId);

const visibleNavItems = computed(() => {
  if (isGuest.value) {
    return navItems.filter((item) => item.path === '/market');
  }

  const owner = isBusinessOwnerSession(props.session);

  return navItems.filter((item) => {
    if (item.path === '/wallet') {
      return owner;
    }

    return true;
  });
});

function onEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.height = '0px';
  target.style.opacity = '0';
  target.style.transform = 'translateY(-4px)';

  requestAnimationFrame(() => {
    target.style.height = `${target.scrollHeight}px`;
    target.style.opacity = '1';
    target.style.transform = 'translateY(0)';
  });
}

function onAfterEnter(element: Element) {
  const target = element as HTMLElement;
  target.style.height = 'auto';
}

function onLeave(element: Element) {
  const target = element as HTMLElement;
  target.style.height = `${target.scrollHeight}px`;
  target.style.opacity = '1';
  target.style.transform = 'translateY(0)';

  requestAnimationFrame(() => {
    target.style.height = '0px';
    target.style.opacity = '0';
    target.style.transform = 'translateY(-4px)';
  });
}

const navItems: NavLeaf[] = [
  { label: 'Market', icon: LayoutGrid, path: '/market' },
  { label: 'Business insight', icon: BarChart3, path: '/business-insight' },
  { label: 'Orders', icon: ShoppingBag, path: '/track-orders' },
  { label: 'Wallet', icon: CreditCard, path: '/wallet' },
  { label: 'Request', icon: ClipboardList, path: '/manage-requests' },
  { label: 'Lists', icon: Layers3, path: '/lists' },
  { label: 'Branches', icon: Store, path: '/branches' },
  { label: 'Members', icon: Users, path: '/members' },
];

const settingsItems = [
  { label: 'My Profile', icon: NotebookPen, path: '/settings/my-profile' },
  { label: 'Business Profile', icon: Store, path: '/settings/business-profile' },
  { label: 'Security', icon: ShieldCheck, path: '/settings/security' },
  { label: 'Help & Support', icon: MessageCircleQuestion, path: '/settings/help-support' },
];

function isActivePath(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}

function closeMobileNav() {
  emit('mobileNavClose');
}
</script>

<template>
  <div class="flex h-full w-full min-w-0 flex-col overflow-hidden bg-background-on-canvas text-grey-900">
    <SidebarContent class="min-h-0 px-4 py-5">
      <SidebarMenu>
        <SidebarMenuItem v-for="item in visibleNavItems" :key="item.label">
          <NuxtLink :to="item.path" class="block w-full min-w-0 no-underline" @click="closeMobileNav">
            <SidebarMenuButton
              as="span"
              :active="isActivePath(item.path)"
              class="rounded-[16px]"
            >
              <component :is="item.icon" class="size-[18px]" />
              <span class="flex-1">{{ item.label }}</span>
            </SidebarMenuButton>
          </NuxtLink>
        </SidebarMenuItem>
      </SidebarMenu>

      <CustomerSidebarBranchSwitcher
        :session="props.session"
        @mobile-nav-close="closeMobileNav"
      />
    </SidebarContent>

    <SidebarFooter class="w-full px-4 pb-0">
      <div class="border-t border-grey-50 pb-3 pt-3">
        <CustomerThemeToggle />
      </div>

      <template v-if="isGuest">
        <div class="flex w-full flex-col gap-3 border-t border-grey-50 pb-4 pt-4">
          <NuxtLink to="/auth/register" class="block w-full no-underline" @click="closeMobileNav">
            <Button type="button" size="medium" class="w-full">
              Sign up
            </Button>
          </NuxtLink>
          <NuxtLink :to="signInTo" class="block w-full no-underline" @click="closeMobileNav">
            <Button type="button" variant="secondary" size="medium" class="w-full">
              Log in
            </Button>
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <SidebarMenu>
          <SidebarMenuItem>
            <button
              type="button"
              class="customer-sidebar-nav-hover flex w-full cursor-pointer items-center gap-3 rounded-[16px] px-4 py-2.5 text-left text-sm font-medium text-grey-text"
              @click="settingsOpen = !settingsOpen"
            >
              <ShieldCheck class="size-[18px]" />
              <span class="flex-1">Settings</span>
              <ChevronDown
                class="size-4 transition-transform"
                :class="settingsOpen ? 'rotate-0' : '-rotate-90'"
              />
            </button>
          </SidebarMenuItem>
        </SidebarMenu>

        <Transition
          enter-active-class="transition-[height,opacity,transform] duration-220 ease-out"
          leave-active-class="transition-[height,opacity,transform] duration-180 ease-in"
          @enter="onEnter"
          @after-enter="onAfterEnter"
          @leave="onLeave"
        >
          <div v-if="settingsOpen" class="w-full overflow-hidden px-4 pb-4 pt-2 will-change-[height,opacity,transform]">
            <SidebarMenu class="border-l border-grey-50 pl-4">
              <SidebarMenuItem v-for="item in settingsItems" :key="item.label">
                <NuxtLink :to="item.path" class="block w-full min-w-0 no-underline" @click="closeMobileNav">
                  <SidebarMenuButton
                    as="span"
                    :active="isActivePath(item.path)"
                    class="rounded-[14px] px-2 py-2"
                  >
                    <component :is="item.icon" class="size-4" />
                    <span>{{ item.label }}</span>
                  </SidebarMenuButton>
                </NuxtLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </Transition>

        <div class="mt-1 w-full border-t border-grey-50 pb-3 pt-3">
          <CustomerUserMenu sidebar :session="props.session" @logout-request="emit('logoutRequest')" />
        </div>
      </template>
    </SidebarFooter>
  </div>
</template>
