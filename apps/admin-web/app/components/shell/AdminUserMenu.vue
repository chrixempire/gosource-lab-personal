<script setup lang="ts">
import {
  Avatar,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@gosource/ui';
import { ChevronDown, LogOut, Settings } from 'lucide-vue-next';
import type { AdminSessionState } from '~/types/admin-session';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

const props = defineProps<{
  session: AdminSessionState | null;
  compact?: boolean;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const open = ref(false);

const initials = computed(() => {
  const data = props.session?.data;
  const first = data?.firstName?.[0] ?? '';
  const last = data?.lastName?.[0] ?? '';
  const email = data?.email?.[0] ?? '';
  return (first + last || email).toUpperCase() || 'GA';
});

const fullName = computed(() => {
  const data = props.session?.data;
  const name = [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim();
  return name || data?.email || 'GoSource Admin';
});

const roleLabel = computed(() => {
  const role = props.session?.data?.role;
  if (!role) {
    return 'Admin';
  }
  return role
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
});
</script>

<template>
  <DropdownMenu v-if="session" v-model:open="open">
    <DropdownMenuTrigger
      :class="
        cn(
          'flex w-full cursor-pointer items-center gap-3 rounded-xl text-left transition-colors',
          compact ? 'justify-center px-0 py-2' : 'p-2',
          'hover:bg-white/10',
          open && 'bg-white/10',
        )
      "
    >
      <Avatar
        size="md"
        :alt="fullName"
        :fallback="initials"
      />
      <template v-if="!compact">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-white">{{ fullName }}</p>
          <p class="truncate text-xs text-white/70">{{ roleLabel }}</p>
        </div>
        <ChevronDown class="size-4 shrink-0 text-white/70" />
      </template>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      :side="compact ? 'right' : 'top'"
      :side-offset="8"
      :collision-padding="12"
      class="z-[110] w-[18rem] rounded-2xl border border-grey-50 bg-white p-0 shadow-lg"
    >
      <div class="flex items-center gap-3 px-4 py-4">
        <Avatar size="md" :alt="fullName" :fallback="initials" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-grey-900">{{ fullName }}</p>
          <p class="mt-0.5 truncate text-sm text-grey-300">{{ roleLabel }}</p>
        </div>
      </div>

      <div class="h-px bg-grey-50" />

      <div class="space-y-0.5 p-2">
        <DropdownMenuItem
          as-child
          class="gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-grey-900"
        >
          <NuxtLink :to="ADMIN_PAGE_ROUTES.SETTINGS" class="flex w-full items-center gap-2.5">
            <Settings class="size-4" />
            Settings
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuItem
          class="gap-2.5 rounded-lg px-3 py-3 text-sm font-medium text-negative-500 hover:bg-negative-50! hover:text-negative-500! data-highlighted:bg-negative-50! data-highlighted:text-negative-500!"
          @click="emit('logout')"
        >
          <LogOut class="size-4" />
          Log out
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
