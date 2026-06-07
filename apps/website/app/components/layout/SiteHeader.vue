<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useScroll } from '@vueuse/core';

const { y } = useScroll(import.meta.client ? window : null);

import { CUSTOMER_MARKET_URL, CUSTOMER_SIGN_IN_URL } from '~/lib/customer-app';

const customerSignInUrl = CUSTOMER_SIGN_IN_URL;
const customerMarketUrl = CUSTOMER_MARKET_URL;

const headerEl = ref<HTMLElement | null>(null);
const mobileOpen = ref(false);
const menuTop = ref(72);
const expandedSections = ref<Record<string, boolean>>({});

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

function updateMenuTop() {
  if (!headerEl.value) return;
  menuTop.value = headerEl.value.getBoundingClientRect().bottom;
}

watch(mobileOpen, async (open) => {
  if (import.meta.client) {
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (open) {
    await nextTick();
    updateMenuTop();
  } else {
    expandedSections.value = {};
  }
});

onMounted(() => {
  updateMenuTop();
  window.addEventListener('resize', updateMenuTop);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMenuTop);
  if (import.meta.client) {
    document.body.style.overflow = '';
  }
});

function close() {
  mobileOpen.value = false;
}

function toggleSection(label: string) {
  expandedSections.value[label] = !expandedSections.value[label];
}

function isSectionOpen(label: string) {
  return Boolean(expandedSections.value[label]);
}

function accordionBeforeEnter(el: Element) {
  const node = el as HTMLElement;
  node.style.height = '0';
  node.style.opacity = '0';
}

function accordionEnter(el: Element, done: () => void) {
  const node = el as HTMLElement;
  node.style.transition = 'height 0.48s var(--ease-spring), opacity 0.36s ease';
  node.style.height = `${node.scrollHeight}px`;
  node.style.opacity = '1';

  const onEnd = (event: TransitionEvent) => {
    if (event.propertyName === 'height') {
      node.removeEventListener('transitionend', onEnd);
      node.style.height = 'auto';
      done();
    }
  };

  node.addEventListener('transitionend', onEnd);
}

function accordionBeforeLeave(el: Element) {
  const node = el as HTMLElement;
  node.style.height = `${node.scrollHeight}px`;
  node.style.opacity = '1';
}

function accordionLeave(el: Element, done: () => void) {
  const node = el as HTMLElement;
  void node.offsetHeight;
  node.style.transition = 'height 0.36s ease, opacity 0.28s ease';
  node.style.height = '0';
  node.style.opacity = '0';

  const onEnd = (event: TransitionEvent) => {
    if (event.propertyName === 'height') {
      node.removeEventListener('transitionend', onEnd);
      done();
    }
  };

  node.addEventListener('transitionend', onEnd);
}
</script>

<template>
  <header
    ref="headerEl"
    class="sticky top-0 w-full transition-[background-color,box-shadow,border-color] duration-300"
    :class="[
      mobileOpen
        ? 'z-[70] border-b border-grey-100 bg-white shadow-none'
        : 'z-40',
      !mobileOpen && y > 12
        ? 'border-b border-grey-100 bg-white/90 shadow-xsmall backdrop-blur-md'
        : !mobileOpen
          ? 'bg-white'
          : '',
    ]"
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
        <a
          :href="customerSignInUrl"
          class="px-3 py-2 text-[0.95rem] font-medium text-grey-700 transition-colors hover:text-grey-900"
        >
          Log in
        </a>
        <AppButton variant="white" size="sm" :href="customerMarketUrl" class="!h-10 !px-5">
          Explore market
          <Icon name="lucide:chevron-right" class="size-4" />
        </AppButton>
      </div>

      <!-- Mobile toggle -->
      <button
        type="button"
        class="relative flex size-10 items-center justify-center rounded-xl text-grey-800 transition hover:bg-grey-100 lg:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Toggle menu"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="relative block h-[18px] w-[22px]" aria-hidden="true">
          <span
            class="mobile-menu-bar mobile-menu-bar-top"
            :class="{ 'mobile-menu-bar-top-open': mobileOpen }"
          />
          <span
            class="mobile-menu-bar mobile-menu-bar-middle"
            :class="{ 'mobile-menu-bar-middle-open': mobileOpen }"
          />
          <span
            class="mobile-menu-bar mobile-menu-bar-bottom"
            :class="{ 'mobile-menu-bar-bottom-open': mobileOpen }"
          />
        </span>
      </button>
    </div>

    <Teleport to="body">
      <!-- Dimmed page behind drawer -->
      <Transition name="mobile-backdrop">
        <button
          v-if="mobileOpen"
          type="button"
          class="fixed inset-0 z-[65] bg-grey-900/40 lg:hidden"
          :style="{ top: `${menuTop}px` }"
          aria-label="Close menu"
          @click="close"
        />
      </Transition>

      <!-- Full-height mobile drawer -->
      <Transition name="mobile-drawer">
        <div
          v-if="mobileOpen"
          class="fixed inset-x-0 bottom-0 z-[68] flex flex-col bg-white lg:hidden"
          :style="{ top: `${menuTop}px` }"
        >
          <nav class="flex-1 overflow-y-auto overscroll-contain px-5 pt-3">
            <template v-for="(link, index) in navLinks" :key="link.label">
              <a
                v-if="link.href"
                :href="link.href"
                class="mobile-nav-item flex items-center border-b border-grey-100 py-[1.125rem] text-[1.05rem] font-medium text-grey-800 transition-colors hover:text-primary-700"
                :style="{ '--nav-delay': `${index * 70 + 100}ms` }"
                @click="close"
              >
                {{ link.label }}
              </a>

              <div
                v-else
                class="mobile-nav-item border-b border-grey-100"
                :style="{ '--nav-delay': `${index * 70 + 100}ms` }"
              >
                <button
                  type="button"
                  class="flex w-full cursor-pointer items-center justify-between py-[1.125rem] text-left text-[1.05rem] font-medium transition-colors duration-200"
                  :class="isSectionOpen(link.label) ? 'text-primary-700' : 'text-grey-800'"
                  :aria-expanded="isSectionOpen(link.label)"
                  @click="toggleSection(link.label)"
                >
                  <span
                    class="transition-transform duration-300 ease-[var(--ease-spring)]"
                    :class="isSectionOpen(link.label) ? 'translate-x-1' : ''"
                  >
                    {{ link.label }}
                  </span>
                  <span
                    class="flex size-8 items-center justify-center rounded-full transition-all duration-300 ease-[var(--ease-spring)]"
                    :class="isSectionOpen(link.label) ? 'rotate-180 bg-primary-50 text-primary-600' : 'bg-grey-50 text-grey-500'"
                  >
                    <Icon name="lucide:chevron-down" class="size-4" />
                  </span>
                </button>

                <Transition
                  @before-enter="accordionBeforeEnter"
                  @enter="accordionEnter"
                  @before-leave="accordionBeforeLeave"
                  @leave="accordionLeave"
                >
                  <div v-if="isSectionOpen(link.label)" class="overflow-hidden">
                    <div
                      class="submenu-panel flex flex-col gap-0.5 pb-4 pl-1"
                      :class="{ 'submenu-panel-open': isSectionOpen(link.label) }"
                    >
                      <a
                        v-for="(child, childIndex) in link.children"
                        :key="child.label"
                        :href="child.href"
                        class="mobile-submenu-link flex items-center gap-2 rounded-xl px-3 py-3 text-[0.9375rem] text-grey-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                        :style="{ '--child-delay': `${childIndex * 55 + 80}ms` }"
                        @click="close"
                      >
                        <span class="size-1.5 shrink-0 rounded-full bg-primary-400" />
                        {{ child.label }}
                      </a>
                    </div>
                  </div>
                </Transition>
              </div>
            </template>
          </nav>

          <div
            class="mobile-nav-actions shrink-0 border-t border-grey-100 bg-white px-5 py-6"
            :style="{ '--nav-delay': `${navLinks.length * 70 + 160}ms` }"
          >
            <div class="flex flex-col gap-3">
              <AppButton variant="white" :href="customerSignInUrl" block @click="close">
                Log in
              </AppButton>
              <AppButton variant="primary" :href="customerMarketUrl" block @click="close">
                Explore market
                <Icon name="lucide:chevron-right" class="size-4" />
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.mobile-menu-bar {
  position: absolute;
  left: 0;
  display: block;
  height: 2px;
  width: 100%;
  border-radius: 9999px;
  background-color: var(--color-grey-800);
  transform-origin: center;
  transition:
    transform 0.42s var(--ease-spring),
    top 0.42s var(--ease-spring),
    bottom 0.42s var(--ease-spring),
    opacity 0.2s ease,
    width 0.42s var(--ease-spring);
}

.mobile-menu-bar-top {
  top: 0;
}

.mobile-menu-bar-middle {
  top: 8px;
}

.mobile-menu-bar-bottom {
  bottom: 0;
}

.mobile-menu-bar-top-open {
  top: 8px;
  width: 100%;
  transform: rotate(45deg);
}

.mobile-menu-bar-middle-open {
  opacity: 0;
  transform: scaleX(0);
}

.mobile-menu-bar-bottom-open {
  bottom: 8px;
  width: 100%;
  transform: rotate(-45deg);
}

.mobile-backdrop-enter-active,
.mobile-backdrop-leave-active {
  transition: opacity 0.35s ease;
}

.mobile-backdrop-enter-from,
.mobile-backdrop-leave-to {
  opacity: 0;
}

.mobile-drawer-enter-active {
  transition: transform 0.52s var(--ease-spring), opacity 0.4s ease;
}

.mobile-drawer-leave-active {
  transition: transform 0.32s ease, opacity 0.24s ease;
}

.mobile-drawer-enter-from {
  opacity: 0;
  transform: translateY(-18px);
}

.mobile-drawer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-drawer-enter-active .mobile-nav-item,
.mobile-drawer-enter-active .mobile-nav-actions {
  animation: mobile-nav-in 0.55s var(--ease-spring) both;
  animation-delay: var(--nav-delay, 0ms);
}

.submenu-panel-open .mobile-submenu-link {
  animation: mobile-submenu-in 0.48s var(--ease-spring) both;
  animation-delay: var(--child-delay, 0ms);
}

@keyframes mobile-nav-in {
  from {
    opacity: 0;
    transform: translate3d(-18px, 8px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes mobile-submenu-in {
  from {
    opacity: 0;
    transform: translate3d(-14px, 6px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-drawer-enter-active .mobile-nav-item,
  .mobile-drawer-enter-active .mobile-nav-actions {
    animation: none;
  }

  .submenu-panel-open .mobile-submenu-link {
    animation: none;
  }
}
</style>
