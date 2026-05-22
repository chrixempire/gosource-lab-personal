<script setup lang="ts">
import { Dialog, DialogClose, DialogContent, Popover, PopoverAnchor, PopoverContent } from '@gosource/ui';
import { useEventListener, useMediaQuery, watchDebounced } from '@vueuse/core';
import { Search } from 'lucide-vue-next';
import MarketSearchInput from '~/components/market/MarketSearchInput.vue';
import MarketSearchResults from '~/components/market/MarketSearchResults.vue';
import { useMarketCatalog } from '~/composables/useMarketCatalog';
import { hasMarketSearchQuery, searchMarketCatalog } from '~/lib/market-search';
import type { MarketCategory } from '~/lib/marketplace-data';

const props = defineProps<{
  class?: string;
}>();

const router = useRouter();
const { catalogList, hydrateFromStorage } = useMarketCatalog();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const query = ref('');
const desktopOpen = ref(false);
const mobileOpen = ref(false);
const isSearching = ref(false);
const anchorRef = ref<HTMLElement | null>(null);
const desktopInputRef = ref<InstanceType<typeof MarketSearchInput> | null>(null);
const mobileInputRef = ref<InstanceType<typeof MarketSearchInput> | null>(null);

const categories = computed(() => catalogList());
const results = computed(() => searchMarketCatalog(categories.value, query.value));

const hasQuery = computed(() => query.value.length > 0);
const showActionButton = computed(() => hasQuery.value);
const showDesktopDropdown = computed(
  () => isDesktop.value && desktopOpen.value && hasMarketSearchQuery(query.value),
);
const showMobileResults = computed(
  () => mobileOpen.value && hasMarketSearchQuery(query.value),
);
const hasResults = computed(
  () => results.value.categories.length > 0 || results.value.products.length > 0,
);

function isOurSearchElement(element: HTMLElement) {
  return Boolean(anchorRef.value?.contains(element) || element.closest('[data-market-search-modal]'));
}

function activeInput() {
  return isDesktop.value ? desktopInputRef.value : mobileInputRef.value;
}

function focusSearchInput() {
  activeInput()?.focus();
}

function isEventInsideAnchor(target: EventTarget | null) {
  return Boolean(target && anchorRef.value?.contains(target as Node));
}

function onFocusOutside(event: { preventDefault: () => void; target: EventTarget | null }) {
  if (isEventInsideAnchor(event.target)) {
    event.preventDefault();
  }
}

function onPointerDownOutside(event: { preventDefault: () => void; target: EventTarget | null }) {
  if (isEventInsideAnchor(event.target)) {
    event.preventDefault();
  }
}

function resetSearchState() {
  query.value = '';
  isSearching.value = false;
  desktopOpen.value = false;
}

function closeMobileSearch() {
  mobileOpen.value = false;
  resetSearchState();
}

function openMobileSearch() {
  mobileOpen.value = true;
}

function onMobileOpenChange(nextOpen: boolean) {
  if (!nextOpen) {
    closeMobileSearch();
    return;
  }

  mobileOpen.value = true;
  nextTick(focusSearchInput);
}

function onSelectCategory(category: MarketCategory) {
  resetSearchState();
  mobileOpen.value = false;
  void router.push(`/market/category/${category.id}`);
}

function onSelectProduct(productId: string) {
  resetSearchState();
  mobileOpen.value = false;
  void router.push(`/market/product/${productId}`);
}

function onSearchFocus() {
  if (isDesktop.value && hasMarketSearchQuery(query.value)) {
    desktopOpen.value = true;
  }
}

function onSearchInput() {
  if (!query.value.trim()) {
    isSearching.value = false;
    desktopOpen.value = false;
    return;
  }

  isSearching.value = true;

  if (isDesktop.value) {
    desktopOpen.value = hasMarketSearchQuery(query.value);
  }
}

function onGlobalSearchShortcut(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
    return;
  }

  const active = document.activeElement;
  if (active instanceof HTMLElement && !isOurSearchElement(active)) {
    const tag = active.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable) {
      return;
    }
  }

  event.preventDefault();

  if (isDesktop.value) {
    focusSearchInput();
    if (hasMarketSearchQuery(query.value)) {
      desktopOpen.value = true;
    }
    return;
  }

  openMobileSearch();
}

defineExpose({ focus: focusSearchInput });

onMounted(() => {
  hydrateFromStorage();
});

watch(query, (value) => {
  if (!value.trim()) {
    isSearching.value = false;
    desktopOpen.value = false;
    return;
  }

  if (isDesktop.value) {
    desktopOpen.value = hasMarketSearchQuery(value);
  }
});

watchDebounced(
  query,
  () => {
    isSearching.value = false;
  },
  { debounce: 200, maxWait: 400 },
);

watch(desktopOpen, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen && isDesktop.value) {
    nextTick(focusSearchInput);
  }
});

watch(mobileOpen, (isOpen) => {
  if (isOpen) {
    nextTick(focusSearchInput);
  }
});

useEventListener(window, 'keydown', onGlobalSearchShortcut, { capture: true });
</script>

<template>
  <div :class="['shrink-0 lg:mx-auto lg:min-w-0 lg:w-full lg:max-w-[600px] lg:flex-1', props.class]">
    <button
      type="button"
      class="inline-flex size-10 cursor-pointer items-center justify-center rounded-xl border border-grey-50 bg-white text-grey-900 lg:hidden"
      aria-label="Search market"
      @click="openMobileSearch"
    >
      <Search class="size-5" aria-hidden="true" />
    </button>

    <div ref="anchorRef" class="relative hidden w-full lg:block">
      <Popover v-model:open="desktopOpen" :modal="false">
        <PopoverAnchor as-child>
          <MarketSearchInput
            ref="desktopInputRef"
            v-model="query"
            :is-searching="isSearching"
            :show-action-button="showActionButton"
            @focus="onSearchFocus"
            @input="onSearchInput"
          />
        </PopoverAnchor>

        <PopoverContent
          v-if="showDesktopDropdown"
          align="start"
          :side-offset="8"
          class="z-[80] max-h-96 w-[var(--reka-popover-trigger-width)] overflow-y-auto overscroll-contain rounded-xl border border-grey-50 bg-white p-2 shadow-[0_16px_40px_-12px_rgba(16,24,40,0.18)]"
          @open-auto-focus.prevent
          @close-auto-focus.prevent
          @focus-outside="onFocusOutside"
          @pointer-down-outside="onPointerDownOutside"
        >
          <MarketSearchResults
            :results="results"
            :has-results="hasResults"
            :show-empty="true"
            @select-category="onSelectCategory"
            @select-product="onSelectProduct"
          />
        </PopoverContent>
      </Popover>
    </div>

    <Dialog :open="mobileOpen" @update:open="onMobileOpenChange">
      <DialogContent
        data-market-search-modal
        overlay-class="lg:hidden"
        class="fixed inset-0 left-0 top-0 z-[90] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-white shadow-none lg:hidden"
        @open-auto-focus.prevent
        @close-auto-focus.prevent
      >
        <div
          class="shrink-0 border-b border-grey-50 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        >
          <div class="flex items-center gap-3">
            <DialogClose aria-label="Close search" />
            <div class="min-w-0 flex-1">
              <MarketSearchInput
                ref="mobileInputRef"
                v-model="query"
                :is-searching="isSearching"
                :show-action-button="showActionButton"
                @input="onSearchInput"
              />
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-2">
          <MarketSearchResults
            v-if="showMobileResults"
            :results="results"
            :has-results="hasResults"
            :show-empty="true"
            @select-category="onSelectCategory"
            @select-product="onSelectProduct"
          />
          <p
            v-else-if="hasQuery && !hasMarketSearchQuery(query)"
            class="px-3 py-6 text-center text-sm text-grey-400"
          >
            Type at least 2 characters to search.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
