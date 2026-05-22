import type { InjectionKey, Ref } from 'vue';

export type SidebarContextValue = {
  open: Ref<boolean>;
  setOpen: (value: boolean) => void;
  toggle: () => void;
};

export const sidebarContextKey: InjectionKey<SidebarContextValue> = Symbol('gosource-sidebar');
