/**
 * v-reveal — fades + lifts an element into view the first time it intersects.
 * Optional binding value sets a stagger delay in ms: v-reveal="120"
 */
export default defineNuxtPlugin((nuxtApp) => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          (entries, obs) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                (entry.target as HTMLElement).classList.add('is-revealed');
                obs.unobserve(entry.target);
              }
            }
          },
          { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        )
      : null;

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      if (reduceMotion || !observer) {
        el.classList.add('is-revealed');
        return;
      }
      const delay = Number(binding.value) || 0;
      el.style.setProperty('--reveal-delay', `${delay}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    },
    unmounted(el: HTMLElement) {
      observer?.unobserve(el);
    },
  });
});
