<script setup lang="ts">
import { BrandLogo, cn, TooltipProvider } from '@gosource/ui';
import { ChevronDown } from 'lucide-vue-next';
import AdminBrandMark from '~/components/brand/AdminBrandMark.vue';
import AdminSidebarSection from '~/components/shell/AdminSidebarSection.vue';
import AdminSidebarTooltip from '~/components/shell/AdminSidebarTooltip.vue';
import AdminUserMenu from '~/components/shell/AdminUserMenu.vue';
import { ADMIN_NAV_ICON_MAP } from '~/lib/admin-nav-icons';
import {
  ADMIN_NAV_ITEMS,
  ADMIN_PAGE_ROUTES,
  adminNavSectionHasActiveChild,
  isAdminNavChildActive,
} from '~/lib/admin-routes';
import { filterAdminNavByCapabilities } from '~/lib/admin-permissions';
import { useAdminCapabilities } from '~/composables/useAdminCapabilities';
import { useAdminSession } from '~/composables/useAdminSession';

const props = defineProps<{
  expanded: boolean;
}>();

const emit = defineEmits<{
  logout: [];
  mobileNavClose: [];
}>();

const route = useRoute();
const { session } = useAdminSession();
const { capabilities, ensureCapabilities } = useAdminCapabilities();
const openSections = ref<Record<string, boolean>>({});

onMounted(() => {
  void ensureCapabilities();
});

const navItems = computed(() => filterAdminNavByCapabilities(ADMIN_NAV_ITEMS, capabilities.value));

const showNavTooltips = computed(() => !props.expanded);

function isActive(path?: string) {
  if (!path) {
    return false;
  }

  if (path === ADMIN_PAGE_ROUTES.HOME) {
    return route.path === path;
  }

  return route.path === path || route.path.startsWith(`${path}/`);
}

function sectionKey(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-');
}

function toggleSection(label: string) {
  if (!props.expanded) {
    return;
  }

  const key = sectionKey(label);
  openSections.value[key] = !openSections.value[key];
}

function isSectionOpen(label: string) {
  return openSections.value[sectionKey(label)] ?? false;
}

function sectionHasActiveChild(item: (typeof ADMIN_NAV_ITEMS)[number]) {
  return adminNavSectionHasActiveChild(route.path, item.children);
}

function isChildNavActive(childTo: string) {
  return isAdminNavChildActive(route.path, childTo);
}

function navLinkClass(active: boolean) {
  return cn(
    'flex w-full items-center rounded-xl text-sm font-medium transition-[background-color,color,padding] duration-300 ease-in-out',
    props.expanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
    active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
  );
}

function navDisabledClass() {
  return cn(
    'flex w-full items-center rounded-xl text-sm font-medium transition-[background-color,color,padding] duration-300 ease-in-out cursor-not-allowed opacity-45',
    props.expanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
  );
}

function closeMobileNav() {
  emit('mobileNavClose');
}

watch(
  () => route.path,
  () => {
    for (const item of ADMIN_NAV_ITEMS) {
      if (item.children?.length && sectionHasActiveChild(item)) {
        openSections.value[sectionKey(item.label)] = true;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <aside
    class="flex h-full shrink-0 flex-col overflow-hidden bg-admin-nav-bg text-white transition-[width] duration-300 ease-in-out"
    :class="expanded ? 'w-full lg:w-[232px]' : 'w-[68px]'"
  >
    <div
      :class="[
        'flex shrink-0 items-center border-b border-white/10 transition-[padding] duration-300 ease-in-out',
        expanded ? 'justify-start px-5 py-6' : 'justify-center px-0 py-5',
      ]"
    >
      <BrandLogo
        v-if="expanded"
        class="h-7 w-[9.75rem] [&_path:nth-child(n+3)]:fill-white"
      />
      <AdminBrandMark v-else class="size-7 text-[#19B820]" />
    </div>

    <TooltipProvider :delay-duration="0">
      <nav
        :class="[
          'flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-4 transition-[padding] duration-300 ease-in-out',
          expanded ? 'px-3' : 'px-0',
        ]"
      >
        <template v-for="item in navItems" :key="item.label">
          <div v-if="item.children?.length" class="w-full">
            <AdminSidebarTooltip :label="item.label" :enabled="showNavTooltips">
              <button
                type="button"
                :class="item.disabled ? navDisabledClass() : navLinkClass(false)"
                :disabled="item.disabled"
                @click="!item.disabled && toggleSection(item.label)"
              >
                <component :is="ADMIN_NAV_ICON_MAP[item.icon]" class="size-[18px] shrink-0" />
                <span
                  v-if="expanded"
                  class="min-w-0 flex-1 truncate text-left transition-opacity duration-300"
                >
                  {{ item.label }}
                </span>
                <ChevronDown
                  v-if="expanded && !item.disabled"
                  class="size-4 shrink-0 transition-transform duration-300 ease-in-out"
                  :class="isSectionOpen(item.label) ? 'rotate-180' : ''"
                />
              </button>
            </AdminSidebarTooltip>

            <AdminSidebarSection :open="!item.disabled && isSectionOpen(item.label)" :visible="expanded && !item.disabled">
              <NuxtLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                :class="navLinkClass(isChildNavActive(child.to))"
                @click="closeMobileNav"
              >
                <span class="w-full truncate pl-9 text-left">{{ child.label }}</span>
              </NuxtLink>
            </AdminSidebarSection>
          </div>

          <AdminSidebarTooltip v-else-if="item.to" :label="item.label" :enabled="showNavTooltips">
            <button
              v-if="item.disabled"
              type="button"
              :class="navDisabledClass()"
              disabled
            >
              <component :is="ADMIN_NAV_ICON_MAP[item.icon]" class="size-[18px] shrink-0" />
              <span
                v-if="expanded"
                class="truncate transition-opacity duration-300"
              >
                {{ item.label }}
              </span>
            </button>
            <NuxtLink
              v-else
              :to="item.to"
              :class="navLinkClass(isActive(item.to))"
              @click="closeMobileNav"
            >
              <component :is="ADMIN_NAV_ICON_MAP[item.icon]" class="size-[18px] shrink-0" />
              <span
                v-if="expanded"
                class="truncate transition-opacity duration-300"
              >
                {{ item.label }}
              </span>
            </NuxtLink>
          </AdminSidebarTooltip>
        </template>
      </nav>
    </TooltipProvider>

    <div
      :class="[
        'shrink-0 border-t border-white/10 transition-[padding] duration-300 ease-in-out',
        expanded ? 'p-2' : 'p-0',
      ]"
    >
      <AdminUserMenu
        :session="session"
        :compact="!expanded"
        @logout="emit('logout')"
      />
    </div>
  </aside>
</template>
