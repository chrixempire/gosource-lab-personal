import type { Component } from 'vue';

export type AdminHeaderOptions = {
  title?: string;
  goBack?: boolean;
  goBackTo?: string;
  rightComponent?: Component;
};

export function useAdminHeader() {
  const { setHeader } = inject('admin-layout', {
    setHeader: (_options: AdminHeaderOptions) => {
      if (import.meta.dev) {
        console.warn('Admin layout is not available');
      }
    },
  });

  function updateHeader(options: AdminHeaderOptions) {
    setHeader({
      ...options,
      rightComponent: options.rightComponent ? markRaw(options.rightComponent) : undefined,
    });
  }

  return { updateHeader };
}
