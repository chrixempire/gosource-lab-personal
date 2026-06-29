<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from '@gosource/ui';
import { onClickOutside, useEventListener } from '@vueuse/core';
import { Check, ChevronDown, MessageSquarePlus, X } from 'lucide-vue-next';
import { extractApiErrorMessage } from '~/utils/api-error';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
] as const;

const route = useRoute();
const { findCategoryById } = useMarketCatalog();

// Store a human-readable page: swap a category id in the URL for its name.
function resolvePage(): string {
  const queryCategory =
    typeof route.query.category === 'string' ? route.query.category : '';
  if (route.path === '/market' && queryCategory) {
    const name = findCategoryById(queryCategory)?.title;
    if (name) {
      const rest = Object.entries(route.query)
        .filter(([key]) => key !== 'category')
        .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : value}`)
        .join('&');
      return `/market?category=${name}${rest ? `&${rest}` : ''}`;
    }
  }
  const pathMatch = route.path.match(/^\/market\/category\/([^/]+)$/);
  if (pathMatch?.[1]) {
    const name = findCategoryById(pathMatch[1])?.title;
    if (name) return `/market/category/${name}`;
  }
  return route.fullPath;
}

const open = ref(false);
const submitting = ref(false);
const message = ref('');
const category = ref<string>('general');
const categoryOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const canSubmit = computed(() => message.value.trim().length > 0);
const selectedCategoryLabel = computed(
  () => CATEGORIES.find((option) => option.value === category.value)?.label ?? '',
);

function resetForm() {
  message.value = '';
  category.value = 'general';
}

function close() {
  if (submitting.value) return;
  open.value = false;
}

function toggle() {
  open.value ? close() : (open.value = true);
}

// Close on outside click (but ignore clicks while the teleported category
// dropdown is open) and on Escape.
onClickOutside(rootRef, () => {
  if (open.value && !submitting.value && !categoryOpen.value) {
    open.value = false;
  }
});
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value && !categoryOpen.value) close();
});

// Shrink/fade the button while the page is scrolling, restore when it settles
// (capture phase so it catches scrolls in any nested scroll container).
const isScrolling = ref(false);
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
useEventListener(
  window,
  'scroll',
  () => {
    if (open.value) return;
    isScrolling.value = true;
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      isScrolling.value = false;
    }, 600);
  },
  { passive: true, capture: true },
);

watch(open, (value) => {
  if (!value) resetForm();
});

async function submit() {
  if (!canSubmit.value || submitting.value) return;
  submitting.value = true;
  try {
    await $fetch('/api/feedback', {
      method: 'POST',
      body: {
        message: message.value.trim(),
        category: category.value,
        page: resolvePage(),
      },
    });
    toast.success('Thanks for your feedback! 🙌');
    open.value = false;
    resetForm();
  } catch (error) {
    toast.error(
      extractApiErrorMessage(error) ??
        'Could not send your feedback. Please try again.',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      :class="[
        'inline-flex size-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-500 text-white shadow-[0_20px_48px_-16px_rgba(11,61,18,0.5)] transition-all duration-200 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        isScrolling && !open ? 'scale-90 opacity-60' : 'scale-100 opacity-100',
      ]"
      :aria-label="open ? 'Close feedback' : 'Send feedback'"
      :aria-expanded="open"
      @click="toggle"
    >
      <X v-if="open" class="size-6" aria-hidden="true" />
      <MessageSquarePlus v-else class="size-6" aria-hidden="true" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="open"
        class="fixed left-3 right-3 z-[130] origin-bottom-right overflow-hidden rounded-2xl border border-grey-50 bg-background-on-canvas text-left shadow-[0_24px_60px_-20px_rgba(16,24,40,0.45)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:w-[22.5rem]"
      >
        <div class="flex items-start justify-between gap-2 border-b border-grey-50 px-4 py-3.5">
          <div class="min-w-0">
            <p class="text-base font-semibold text-grey-900">Share your feedback</p>
            <p class="mt-0.5 text-xs text-grey-500">
              What's working, what isn't, or what you'd love to see.
            </p>
          </div>
          <button
            type="button"
            class="-mr-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-grey-400 transition hover:bg-grey-55 hover:text-grey-700"
            aria-label="Close"
            @click="close"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <div class="flex flex-col gap-3 px-4 py-4">
          <div class="space-y-2">
            <span class="text-sm font-medium text-grey-900">Category</span>
            <DropdownMenu v-model:open="categoryOpen">
              <DropdownMenuTrigger as-child :disabled="submitting">
                <button
                  type="button"
                  class="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border-input-default bg-background-on-canvas px-3 text-left text-sm text-grey-900 outline-none transition focus:border-border-input-active data-[state=open]:border-border-input-active disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>{{ selectedCategoryLabel }}</span>
                  <ChevronDown class="size-4 shrink-0 text-grey-300" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="z-[140] w-[var(--reka-dropdown-menu-trigger-width)]"
              >
                <DropdownMenuItem
                  v-for="opt in CATEGORIES"
                  :key="opt.value"
                  @select="category = opt.value"
                >
                  <div class="flex w-full items-center justify-between gap-3">
                    <span>{{ opt.label }}</span>
                    <Check
                      v-if="category === opt.value"
                      class="size-4 text-primary-500"
                    />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div class="space-y-2">
            <label for="feedback-message" class="text-sm font-medium text-grey-900">
              Message
            </label>
            <textarea
              id="feedback-message"
              v-model="message"
              :disabled="submitting"
              rows="4"
              maxlength="2000"
              placeholder="Share the details…"
              class="w-full resize-none rounded-xl border border-grey-50 bg-background-on-canvas px-3 py-2.5 text-sm text-grey-900 outline-none focus:border-primary-400 disabled:opacity-60"
            />
          </div>

          <Button
            variant="primary"
            size="medium"
            class="w-full"
            :disabled="!canSubmit || submitting"
            :loading="submitting"
            @click="submit"
          >
            Send feedback
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>
