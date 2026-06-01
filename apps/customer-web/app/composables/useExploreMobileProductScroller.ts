export function useExploreMobileProductScroller(scrollerRef: Ref<HTMLElement | null>) {
  const canScroll = ref(false);
  const canScrollLeft = ref(false);
  const canScrollRight = ref(false);

  function updateScrollHints() {
    const scroller = scrollerRef.value;
    if (!scroller) {
      canScroll.value = false;
      canScrollLeft.value = false;
      canScrollRight.value = false;
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = scroller;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

    canScroll.value = scrollWidth > clientWidth + 2;
    canScrollLeft.value = scrollLeft > 1;
    canScrollRight.value = scrollLeft < maxScrollLeft - 1;
  }

  function scrollByDirection(direction: -1 | 1) {
    if (direction === -1 && !canScrollLeft.value) {
      return;
    }

    if (direction === 1 && !canScrollRight.value) {
      return;
    }

    const scroller = scrollerRef.value;
    if (!scroller) {
      return;
    }

    const gapPx = 12;
    const columnWidth = 182;
    const amount = columnWidth + gapPx;
    scroller.scrollTo({
      left: scroller.scrollLeft + direction * amount,
      behavior: 'smooth',
    });
  }

  function scheduleScrollHintsUpdate() {
    nextTick(() => {
      updateScrollHints();
      requestAnimationFrame(updateScrollHints);
    });
  }

  let resizeObserver: ResizeObserver | null = null;
  let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

  function onScrollerScroll() {
    updateScrollHints();
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
    }
    scrollEndTimer = setTimeout(updateScrollHints, 120);
  }

  function attachScrollerListeners(scroller: HTMLElement) {
    scroller.addEventListener('scroll', onScrollerScroll, { passive: true });
    scroller.addEventListener('scrollend', onScrollerScroll, { passive: true });
  }

  function detachScrollerListeners(scroller: HTMLElement | null) {
    if (!scroller) {
      return;
    }

    scroller.removeEventListener('scroll', onScrollerScroll);
    scroller.removeEventListener('scrollend', onScrollerScroll);
  }

  watch(scrollerRef, (scroller, previousScroller) => {
    detachScrollerListeners(previousScroller);
    resizeObserver?.disconnect();
    resizeObserver = null;

    if (!scroller) {
      canScroll.value = false;
      canScrollLeft.value = false;
      canScrollRight.value = false;
      return;
    }

    attachScrollerListeners(scroller);
    resizeObserver = new ResizeObserver(() => {
      updateScrollHints();
    });
    resizeObserver.observe(scroller);
    scheduleScrollHintsUpdate();
  });

  onMounted(() => scheduleScrollHintsUpdate());

  onUnmounted(() => {
    detachScrollerListeners(scrollerRef.value);
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
    }
  });

  return {
    canScroll,
    canScrollLeft,
    canScrollRight,
    scrollByDirection,
    scheduleScrollHintsUpdate,
  };
}
