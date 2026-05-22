<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { Avatar, cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@gosource/ui';
import { ChevronDown, CircleHelp, Info, LogOut } from 'lucide-vue-next';

type SessionShape = {
  user_type?: 'customer' | 'employee';
  data?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    /** Present for `user_type === 'employee'` (e.g. `manager` | `employee`). */
    role?: string | null;
  };
};

const props = defineProps<{
  session: SessionShape | null;
  sidebar?: boolean;
}>();

const emit = defineEmits<{
  logoutRequest: [];
}>();

const open = ref(false);
const initials = computed(() => {
  const first = props.session?.data?.firstName?.[0] ?? '';
  const last = props.session?.data?.lastName?.[0] ?? '';
  const email = props.session?.data?.email?.[0] ?? '';

  return (first + last || email).toUpperCase() || 'G';
});

const fullName = computed(() => {
  const first = props.session?.data?.firstName?.trim() ?? '';
  const last = props.session?.data?.lastName?.trim() ?? '';
  return `${first} ${last}`.trim() || 'GoSource user';
});

function formatStaffRole(role: string | null | undefined) {
  if (!role?.trim()) {
    return 'Member';
  }
  const r = role.trim().toLowerCase();
  if (r === 'manager') {
    return 'Manager';
  }
  if (r === 'employee') {
    return 'Employee';
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

const roleLabel = computed(() => {
  if (props.session?.user_type === 'employee') {
    return formatStaffRole(props.session?.data?.role ?? undefined);
  }
  return 'Super Admin';
});
const avatarUrl = computed(() => props.session?.data?.avatarUrl?.trim() || '');
const isMobileSidebarOverlay = useMediaQuery('(max-width: 1023px)');
const sidebarPopupSide = computed(() => (props.sidebar && isMobileSidebarOverlay.value ? 'top' : 'right'));
const sidebarPopupAlign = computed(() => (props.sidebar && isMobileSidebarOverlay.value ? 'center' : 'end'));
const sidebarPopupOffset = computed(() => (props.sidebar && isMobileSidebarOverlay.value ? -6 : 4));

function requestLogout() {
  open.value = false;
  emit('logoutRequest');
}
</script>

<template>
  <DropdownMenu v-if="props.session" v-model:open="open">
    <DropdownMenuTrigger
      :class="
        props.sidebar
          ? cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-xl bg-background-on-canvas p-2 text-left transition-colors',
              'hover:bg-primary-50/70',
              open && 'bg-primary-50/70',
            )
          : cn(
              'flex items-center gap-2 rounded-full border border-grey-50 bg-background-on-canvas p-1.5 shadow-[0_10px_24px_-18px_rgba(16,24,40,0.35)]',
              'hover:border-grey-100',
            )
      "
    >
      <Avatar
        :size="props.sidebar ? 'md' : 'sm'"
        :src="avatarUrl"
        :alt="fullName"
        :fallback="initials"
        :fallback-class="props.sidebar ? undefined : '!bg-primary-50 !text-primary-500'"
      />
      <div class="min-w-0 flex-1 text-left">
        <p :class="props.sidebar ? 'truncate text-sm font-semibold text-grey-900' : 'max-w-36 truncate text-xs font-semibold text-grey-900'">
          {{ fullName }}
        </p>
        <span
          class="mt-1 inline-flex rounded-full bg-[linear-gradient(135deg,#f59e0b_0%,#ec4899_100%)] px-2.5 py-0.5 text-[11px] font-semibold text-white"
        >
          {{ roleLabel }}
        </span>
      </div>
      <ChevronDown :class="props.sidebar ? 'size-4 text-grey-300' : 'size-4 text-grey-300'" />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      :align="props.sidebar ? sidebarPopupAlign : 'end'"
      :collision-padding="12"
      :side-offset="props.sidebar ? sidebarPopupOffset : 8"
      :side="props.sidebar ? sidebarPopupSide : 'bottom'"
      :class="
        props.sidebar
          ? 'z-[80] w-[18rem] rounded-2xl p-0'
          : 'w-56'
      "
    >
      <div class="flex items-center gap-3 px-3 py-3">
        <Avatar
          size="sm"
          :src="avatarUrl"
          :alt="fullName"
          :fallback="initials"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-grey-900">
            {{ fullName }}
          </p>
          <p class="mt-0.5 truncate text-sm text-grey-300">
            {{ props.session?.data?.email }}
          </p>
        </div>
      </div>

      <div class="my-[0.5px] h-px shrink-0 bg-grey-50" />

      <div class="space-y-1 px-1 py-1">
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-grey-900 hover:bg-primary-50/70 data-highlighted:bg-primary-50/70 data-highlighted:text-grey-900 focus:bg-primary-50/70 focus:text-grey-900"
        >
          <Info class="size-4" />
          About
        </DropdownMenuItem>
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-grey-900 hover:bg-primary-50/70 data-highlighted:bg-primary-50/70 data-highlighted:text-grey-900 focus:bg-primary-50/70 focus:text-grey-900"
        >
          <CircleHelp class="size-4" />
          FAQ
        </DropdownMenuItem>
      </div>

      <div class="my-[0.5px] h-px shrink-0 bg-grey-50" />

      <div class="px-1 py-1">
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500! focus:bg-negative-50! focus:text-negative-500!"
          @click="requestLogout"
        >
          <LogOut class="size-4" />
          Log out
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>

  <NuxtLink
    v-else
    to="/auth/sign-in"
    class="rounded-full border border-grey-50 bg-background-on-canvas px-4 py-2 text-sm font-semibold text-grey-900 shadow-[0_10px_24px_-18px_rgba(16,24,40,0.35)]"
  >
    Sign in
  </NuxtLink>
</template>
