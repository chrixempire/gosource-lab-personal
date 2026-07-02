/**
 * Whether the browser has allowed audio playback this session (set true after
 * the first user gesture). Not persisted — a reload re-locks audio until the
 * next interaction. The header bell shows a hint while sound is enabled but
 * still locked.
 */
export function useAudioUnlocked() {
  return useState<boolean>('admin-audio-unlocked', () => false);
}
