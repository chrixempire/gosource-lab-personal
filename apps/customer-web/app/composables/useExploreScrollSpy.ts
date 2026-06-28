import type { Ref } from 'vue';
import { ALL_EXPLORE_CATEGORIES_ID } from '~/lib/explore-catalog-filters';

type ExploreSectionRef = {
  id: string;
};

// Slack (px) below the sticky-bar marker when deciding the active section.
const ACTIVE_MARKER_TOLERANCE = 8;

export function useExploreScrollSpy(options: {
  sections: Ref<ExploreSectionRef[]>;
  activeCategoryId: Ref<string>;
  onActiveChange?: (categoryId: string) => void;
}) {
  let scrollSpySuspendedUntil = 0;
  let scrollListenerAttached = false;

  function suspendScrollSpy(ms: number) {
    scrollSpySuspendedUntil = Date.now() + ms;
  }

  function scrollOffsetPx() {
    if (typeof document === 'undefined') {
      return 56;
    }

    const stickyBar = document.querySelector('[data-testid="explore-category-filter-bar"]');
    const measured = stickyBar?.getBoundingClientRect().height;
    if (measured && measured > 0) {
      return Math.ceil(measured);
    }

    return 56;
  }

  function updateActiveFromScroll() {
    if (Date.now() < scrollSpySuspendedUntil) {
      return;
    }

    const root = document.getElementById('customer-shell-scroll');
    if (!root || options.sections.value.length === 0) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    // A few px of slack: clicking a category scrolls its section top to exactly
    // the marker, and sub-pixel rounding / smooth-scroll settle can leave it a
    // hair below — without this tolerance the spy would re-select the previous
    // section (off-by-one).
    const marker = rootRect.top + scrollOffsetPx() + ACTIVE_MARKER_TOLERANCE;
    let nextId = ALL_EXPLORE_CATEGORIES_ID;

    const catalogStart = document.getElementById('explore-catalog-start');
    if (catalogStart) {
      const catalogTop = catalogStart.getBoundingClientRect().top;
      if (catalogTop > marker) {
        if (nextId !== options.activeCategoryId.value) {
          options.activeCategoryId.value = nextId;
          options.onActiveChange?.(nextId);
        }
        return;
      }
    }

    for (const section of options.sections.value) {
      const el = document.getElementById(`explore-section-${section.id}`);
      if (!el) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.top <= marker) {
        nextId = section.id;
      }
    }

    if (nextId !== options.activeCategoryId.value) {
      options.activeCategoryId.value = nextId;
      options.onActiveChange?.(nextId);
    }
  }

  function onShellScroll() {
    updateActiveFromScroll();
  }

  function scrollSectionIntoView(categoryId: string) {
    if (categoryId === ALL_EXPLORE_CATEGORIES_ID) {
      const root = document.getElementById('customer-shell-scroll');
      const anchor = document.getElementById('explore-catalog-start');
      if (!root || !anchor) {
        return;
      }

      const nextTop =
        anchor.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        scrollOffsetPx() +
        8;

      root.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
      return;
    }

    const root = document.getElementById('customer-shell-scroll');
    const el = document.getElementById(`explore-section-${categoryId}`);
    if (!root || !el) {
      return;
    }

    const offset = scrollOffsetPx();
    const applyScroll = () => {
      const nextTop =
        el.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        offset;
      root.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(applyScroll);
    });
  }

  function selectCategory(categoryId: string) {
    options.activeCategoryId.value = categoryId;
    suspendScrollSpy(900);
    nextTick(() => {
      scrollSectionIntoView(categoryId);
    });
  }

  function attachScrollListener() {
    if (scrollListenerAttached) {
      return;
    }

    const root = document.getElementById('customer-shell-scroll');
    if (!root) {
      return;
    }

    root.addEventListener('scroll', onShellScroll, { passive: true });
    scrollListenerAttached = true;
    updateActiveFromScroll();
  }

  function detachScrollListener() {
    if (!scrollListenerAttached) {
      return;
    }

    const root = document.getElementById('customer-shell-scroll');
    root?.removeEventListener('scroll', onShellScroll);
    scrollListenerAttached = false;
  }

  watch(
    () => options.sections.value.map((section) => section.id).join(','),
    () => {
      nextTick(updateActiveFromScroll);
    },
  );

  return {
    selectCategory,
    attachScrollListener,
    detachScrollListener,
    suspendScrollSpy,
  };
}
