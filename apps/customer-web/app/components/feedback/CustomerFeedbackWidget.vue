<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  toast,
} from '@gosource/ui';
import {
  onClickOutside,
  StorageSerializers,
  useEventListener,
  useLocalStorage,
} from '@vueuse/core';
import { Check, ChevronDown, MessageCircle, X } from 'lucide-vue-next';
import { extractApiErrorMessage } from '~/utils/api-error';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
] as const;

const FAB_SIZE = 52;

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
const fabRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const canSubmit = computed(() => message.value.trim().length > 0);
const selectedCategoryLabel = computed(
  () => CATEGORIES.find((option) => option.value === category.value)?.label ?? '',
);
// Show the "Feedback" label when idle & closed (CSS also hides it on mobile);
// collapses to an icon-only circle while scrolling or when the panel is open.
const showLabel = computed(() => !open.value && !isScrolling.value);

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

/* ---- Draggable FAB ------------------------------------------------------ */
// Position persists across sessions. `null` = default (grouped with the cart).
const dragPos = useLocalStorage<{ x: number; y: number } | null>(
  'customer-feedback-fab-pos',
  null,
  // Force the JSON serializer — the default "any" serializer (used when the
  // initial value is null) would persist the object as "[object Object]".
  { serializer: StorageSerializers.object },
);
const dragging = ref(false);
let moved = false;
let startX = 0;
let startY = 0;
let originLeft = 0;
let originTop = 0;

// When a position is stored, the FAB floats freely (fixed); otherwise it stays
// a normal flex item in the floating stack next to the cart.
const fabStyle = computed(() =>
  dragPos.value
    ? {
        position: 'fixed' as const,
        left: `${dragPos.value.x}px`,
        top: `${dragPos.value.y}px`,
      }
    : {},
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function onPointerMove(event: PointerEvent) {
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (!moved && Math.hypot(dx, dy) > 4) moved = true;
  if (!moved) return;
  const w = fabRef.value?.offsetWidth ?? FAB_SIZE;
  const h = fabRef.value?.offsetHeight ?? FAB_SIZE;
  dragPos.value = {
    x: clamp(originLeft + dx, 8, window.innerWidth - w - 8),
    y: clamp(originTop + dy, 8, window.innerHeight - h - 8),
  };
  if (open.value) positionPanel();
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove);
  dragging.value = false;
}

function onPointerDown(event: PointerEvent) {
  if (event.button != null && event.button !== 0) return;
  const rect = fabRef.value?.getBoundingClientRect();
  if (!rect) return;
  originLeft = rect.left;
  originTop = rect.top;
  startX = event.clientX;
  startY = event.clientY;
  moved = false;
  dragging.value = true;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp, { once: true });
}

// A drag ends with a click event too — ignore that click so it doesn't toggle.
function onClick() {
  if (moved) {
    moved = false;
    return;
  }
  toggle();
}

/* ---- Popover positioning (anchored to the FAB, clamped to viewport) ----- */
const panelStyle = ref<Record<string, string>>({});
function positionPanel() {
  const rect = fabRef.value?.getBoundingClientRect();
  if (!rect) return;
  const gap = 12;
  const width = Math.min(360, window.innerWidth - 24);
  const left = clamp(rect.right - width, 12, window.innerWidth - width - 12);
  const panelHeight = panelRef.value?.offsetHeight ?? 0;
  const spaceAbove = rect.top - gap;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  // Flip downward when there isn't room above but there is below.
  const openDown = panelHeight > spaceAbove && spaceBelow > spaceAbove;
  panelStyle.value = openDown
    ? { left: `${left}px`, top: `${rect.bottom + gap}px`, width: `${width}px` }
    : {
        left: `${left}px`,
        bottom: `${window.innerHeight - rect.top + gap}px`,
        width: `${width}px`,
      };
}

function clampDragPos() {
  if (!dragPos.value) return;
  const w = fabRef.value?.offsetWidth ?? FAB_SIZE;
  const h = fabRef.value?.offsetHeight ?? FAB_SIZE;
  dragPos.value = {
    x: clamp(dragPos.value.x, 8, window.innerWidth - w - 8),
    y: clamp(dragPos.value.y, 8, window.innerHeight - h - 8),
  };
}

watch(open, (value) => {
  if (value) nextTick(positionPanel);
  else resetForm();
});
onMounted(clampDragPos);
useEventListener(window, 'resize', () => {
  clampDragPos();
  if (open.value) positionPanel();
});

/* ---- Dismissal + scroll shrink ------------------------------------------ */
onClickOutside(rootRef, () => {
  if (open.value && !submitting.value && !categoryOpen.value) open.value = false;
});
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value && !categoryOpen.value) close();
});

const isScrolling = ref(false);
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
useEventListener(
  window,
  'scroll',
  () => {
    if (open.value || dragging.value) return;
    isScrolling.value = true;
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      isScrolling.value = false;
    }, 600);
  },
  { passive: true, capture: true },
);

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
  <div ref="rootRef" :class="dragPos ? 'z-40' : 'relative'" :style="fabStyle">
    <button
      ref="fabRef"
      type="button"
      :class="[
        'inline-flex h-[52px] shrink-0 cursor-pointer touch-none select-none items-center justify-center rounded-full bg-primary-500 text-white shadow-[0_20px_48px_-16px_rgba(11,61,18,0.5)] transition-all duration-200 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        showLabel ? 'w-[52px] sm:w-auto sm:gap-2 sm:px-5' : 'w-[52px]',
        isScrolling && !open ? 'opacity-70' : 'opacity-100',
        dragging ? 'cursor-grabbing' : '',
      ]"
      :aria-label="open ? 'Close feedback' : 'Send feedback'"
      :aria-expanded="open"
      @pointerdown="onPointerDown"
      @click="onClick"
    >
      <X v-if="open" class="size-6 shrink-0" aria-hidden="true" />
      <MessageCircle v-else class="size-6 shrink-0" aria-hidden="true" />
      <span
        v-if="showLabel"
        class="hidden whitespace-nowrap text-sm font-semibold sm:inline"
      >
        Feedback
      </span>
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
        ref="panelRef"
        :style="panelStyle"
        class="fixed z-[130] max-h-[70vh] origin-bottom-right overflow-y-auto rounded-2xl border border-grey-50 bg-background-on-canvas text-left shadow-[0_24px_60px_-20px_rgba(16,24,40,0.45)]"
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
