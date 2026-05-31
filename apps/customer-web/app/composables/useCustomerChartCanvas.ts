import type { Ref } from 'vue';

type UseCustomerChartCanvasOptions = {
  pending: Ref<boolean | undefined>;
  showChart: Ref<boolean>;
  canvasRef: Ref<HTMLCanvasElement | null>;
  chartContainerRef: Ref<HTMLElement | null>;
  render: () => void;
  destroy: () => void;
  /** Prefer resize on container changes; falls back to render when omitted. */
  resize?: () => void;
};

/** Keeps Chart.js in sync when the canvas is toggled or the container resizes. */
export function useCustomerChartCanvas(options: UseCustomerChartCanvasOptions) {
  function scheduleRender() {
    if (!import.meta.client || !options.showChart.value) {
      return;
    }

    nextTick(() => {
      requestAnimationFrame(() => {
        if (options.showChart.value && options.canvasRef.value) {
          options.render();
        }
      });
    });
  }

  function scheduleResize() {
    if (!import.meta.client || !options.showChart.value) {
      return;
    }

    requestAnimationFrame(() => {
      if (!options.showChart.value) {
        return;
      }

      if (options.resize) {
        options.resize();
        return;
      }

      if (options.canvasRef.value) {
        options.render();
      }
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
      scheduleResize();
    });
    resizeObserver.observe(container);
  }

  watch(
    options.showChart,
    (show) => {
      if (!show) {
        options.destroy();
        resizeObserver?.disconnect();
        resizeObserver = null;
        return;
      }

      scheduleRender();
    },
    { flush: 'post' },
  );

  watch(
    () => options.canvasRef.value,
    (canvas) => {
      if (canvas && options.showChart.value) {
        bindResizeObserver();
        scheduleRender();
      }
    },
  );

  watch(
    () => options.chartContainerRef.value,
    (container) => {
      if (container && options.showChart.value) {
        bindResizeObserver();
      }
    },
  );

  onMounted(() => {
    if (options.showChart.value) {
      bindResizeObserver();
      scheduleRender();
    }
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    options.destroy();
  });

  return { scheduleRender, scheduleResize };
}
