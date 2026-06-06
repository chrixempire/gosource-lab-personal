import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';

const THUMB_HEIGHT = 40;
const SCROLL_OFFSET = 140;

export function useLegalScrollSpy(sectionIds: string[]) {
  const activeId = ref(sectionIds[0] ?? '');
  const navItemRefs: Ref<(HTMLElement | null)[]> = ref([]);
  const pipeRef = ref<HTMLElement | null>(null);
  const indicatorTop = ref(0);

  function setNavRef(el: HTMLElement | null, index: number) {
    navItemRefs.value[index] = el;
  }

  function updateIndicator() {
    const index = sectionIds.indexOf(activeId.value);
    const button = navItemRefs.value[index];
    const pipe = pipeRef.value;
    if (!button || !pipe) return;

    const pipeTop = pipe.getBoundingClientRect().top;
    const buttonRect = button.getBoundingClientRect();
    indicatorTop.value = Math.max(
      0,
      buttonRect.top - pipeTop + buttonRect.height / 2 - THUMB_HEIGHT / 2,
    );
  }

  function resolveActiveSection() {
    if (!import.meta.client) return;

    let current = sectionIds[0] ?? '';
    const marker = window.scrollY + SCROLL_OFFSET;

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= marker) {
        current = id;
      }
    }

    if (current !== activeId.value) {
      activeId.value = current;
    } else {
      updateIndicator();
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeId.value = id;
    requestAnimationFrame(updateIndicator);
  }

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      resolveActiveSection();
      updateIndicator();
      ticking = false;
    });
  }

  onMounted(() => {
    resolveActiveSection();
    requestAnimationFrame(updateIndicator);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateIndicator);
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', updateIndicator);
  });

  watch(activeId, () => {
    requestAnimationFrame(updateIndicator);
  });

  return {
    activeId,
    indicatorTop,
    thumbHeight: THUMB_HEIGHT,
    scrollTo,
    setNavRef,
    pipeRef,
    updateIndicator,
  };
}
