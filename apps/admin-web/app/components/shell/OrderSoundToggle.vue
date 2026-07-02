<script setup lang="ts">
import { toast } from '@gosource/ui';

const { enabled, toggle } = useOrderSoundPref();
const unlocked = useAudioUnlocked();

// Mirrors useOrderSound's asset path.
const SOUND_SRC = '/sounds/order-alert.wav';

// Sound is on, but the browser hasn't allowed audio yet this session (e.g.
// right after a reload) — nudge the admin to click once.
const needsUnlock = computed(() => enabled.value && !unlocked.value);

function onToggle() {
  const willEnable = !enabled.value;
  toggle();
  // Clicking is a user gesture, so audio is now permitted for the session.
  unlocked.value = true;

  if (willEnable) {
    // Playing inside this click gesture both previews the sound and satisfies
    // the browser autoplay policy so later order alerts will play.
    if (import.meta.client) {
      new Audio(SOUND_SRC).play().catch(() => {});
    }
    toast.success("You're all set! New order alerts are on. 🔔");
  } else {
    toast.success('Order sounds muted');
  }
}
</script>

<template>
  <button
    type="button"
    class="relative ml-auto inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-xl leading-none transition hover:bg-grey-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
    :aria-pressed="enabled"
    :title="
      needsUnlock
        ? 'Click once to turn on order sounds for this session'
        : enabled
          ? 'Order sounds on — click to mute'
          : 'Order sounds muted — click to enable'
    "
    :aria-label="enabled ? 'Mute new-order sound' : 'Enable new-order sound'"
    @click="onToggle"
  >
    <span
      v-if="needsUnlock"
      class="absolute right-1.5 top-1.5 flex size-2"
      aria-hidden="true"
    >
      <span
        class="absolute inline-flex size-full animate-ping rounded-full bg-[#F59E0B] opacity-75 motion-reduce:hidden"
      />
      <span class="relative inline-flex size-2 rounded-full bg-[#F59E0B]" />
    </span>
    {{ enabled ? '🔔' : '🔕' }}
  </button>
</template>
