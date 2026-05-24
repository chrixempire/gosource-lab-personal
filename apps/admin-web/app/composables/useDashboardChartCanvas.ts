import type { Ref } from 'vue';

type UseDashboardChartCanvasOptions = {
  pending: Ref<boolean | undefined>;
  hasData: Ref<boolean>;
  canvasRef: Ref<HTMLCanvasElement | null>;
  chartContainerRef: Ref<HTMLElement | null>;
  render: () => void;
  destroy: () => void;
};

/** Keeps Chart.js in sync when the canvas is toggled by v-if (route nav, loading, filters). */
export function useDashboardChartCanvas(options: UseDashboardChartCanvasOptions) {
  const showCanvas = computed(
    () => !options.pending.value && options.hasData.value,
  );

  function scheduleRender() {
    if (!import.meta.client || !showCanvas.value) {
      return;
    }

    nextTick(() => {
      requestAnimationFrame(() => {
        if (showCanvas.value && options.canvasRef.value) {
          options.render();
        }
      });
    });
  }

  let resizeObserver: ResizeObserver | null = null;

  function bindResizeObserver() {
    resizeObserver?.disconnect();
    resizeObserver = null;

    const container = options.chartContainerRef.value;
    if (!container) {
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      if (showCanvas.value) {
        scheduleRender();
      }
    });
    resizeObserver.observe(container);
  }

  watch(
    showCanvas,
    (show) => {
      if (!show) {
        options.destroy();
        return;
      }

      scheduleRender();
    },
    { flush: 'post' },
  );

  watch(
    () => options.canvasRef.value,
    (canvas) => {
      if (canvas && showCanvas.value) {
        bindResizeObserver();
        scheduleRender();
      }
    },
  );

  watch(
    () => options.chartContainerRef.value,
    (container) => {
      if (container && showCanvas.value) {
        bindResizeObserver();
      }
    },
  );

  onMounted(() => {
    if (showCanvas.value) {
      bindResizeObserver();
      scheduleRender();
    }
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    options.destroy();
  });

  return {
    showCanvas,
    scheduleRender,
  };
}
