import type { Ref } from 'vue';

/**
 * Shared loading registry for the dashboard (and the inventory report, which
 * reuses the same date filter). Each data section reports its own `pending`
 * ref under a stable key; the date filter reads the aggregate so the "Apply"
 * button can spin while the sections refetch for a newly-applied range.
 */
export function useDashboardLoading() {
  const sections = useState<Record<string, boolean>>('dashboard:section-loading', () => ({}));

  const isLoading = computed(() => Object.values(sections.value).some(Boolean));

  function setSection(key: string, value: boolean) {
    if (sections.value[key] === value) {
      return;
    }
    sections.value = { ...sections.value, [key]: value };
  }

  /** Mirror a section's `pending` into the registry for the lifetime of the caller. */
  function trackDashboardSection(key: string, pending: Ref<boolean>) {
    watch(pending, (value) => setSection(key, value), { immediate: true });

    onScopeDispose(() => {
      const next = { ...sections.value };
      delete next[key];
      sections.value = next;
    });
  }

  return { isLoading, trackDashboardSection };
}
