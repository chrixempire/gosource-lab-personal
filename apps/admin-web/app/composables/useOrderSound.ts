const NOTIFICATION_SOUND = '/sounds/order-alert.wav';
const RECONNECT_DELAY_MS = 5000;

/**
 * Plays a notification sound whenever a new order arrives. Listens to the
 * same-origin SSE proxy (`/api/events/orders`) which streams legacy-api's
 * order events. Mount once in the authenticated layout.
 */
export function useOrderSound() {
  if (!import.meta.client) {
    return;
  }

  let eventSource: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let audio: HTMLAudioElement | null = null;
  let unlocked = false;
  let stopped = false;

  // Bumped on each new order so list pages can refresh their data live.
  const newOrderSignal = useNewOrderSignal();
  const { enabled } = useOrderSoundPref();
  const audioUnlocked = useAudioUnlocked();

  function getAudio() {
    if (!audio) {
      audio = new Audio(NOTIFICATION_SOUND);
      audio.preload = 'auto';
    }
    return audio;
  }

  // Browsers block programmatic audio until the user has interacted with the
  // page. Unlock the element on the first gesture so later order alerts play.
  function unlockAudio() {
    if (unlocked) {
      return;
    }
    // A user gesture occurred — the browser now permits audio; clear the hint.
    audioUnlocked.value = true;
    const el = getAudio();
    el.muted = true;
    el
      .play()
      .then(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
        unlocked = true;
      })
      .catch(() => {
        el.muted = false;
      });
  }

  function playSound() {
    const el = getAudio();
    el.currentTime = 0;
    el.play().catch((error) => {
      console.error('Unable to play order notification sound:', error);
    });
  }

  function connect() {
    if (stopped) {
      return;
    }
    eventSource?.close();
    eventSource = new EventSource('/api/events/orders');

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload?.type === 'order.created') {
          if (enabled.value) {
            playSound();
          }
          // Always refresh lists, even when the sound is muted.
          newOrderSignal.value += 1;
        }
      } catch {
        // Ignore malformed / heartbeat frames.
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      if (stopped) {
        return;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }

  onMounted(() => {
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    connect();
  });

  onScopeDispose(() => {
    stopped = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    eventSource?.close();
    eventSource = null;
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  });
}
