<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import AdminSidebar from '~/components/shell/AdminSidebar.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  logout: [];
}>();

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) {
      return;
    }

    document.documentElement.style.overflow = open ? 'hidden' : '';
  },
  { immediate: true },
);

onUnmounted(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="admin-mobile-nav">
      <div
        v-if="open"
        class="admin-mobile-nav-shell fixed inset-0 z-[100] lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button
          type="button"
          class="admin-mobile-nav-backdrop absolute inset-0 border-0 bg-[rgba(16,24,40,0.65)]"
          aria-label="Close navigation"
          @click="emit('close')"
        />

        <aside
          class="admin-mobile-nav-panel absolute inset-y-0 left-0 z-10 flex w-[70vw] max-w-[20rem] flex-col bg-admin-nav-bg shadow-[24px_0_64px_-24px_rgba(16,24,40,0.32)]"
        >
          <AdminSidebar
            expanded
            @logout="emit('logout')"
            @mobile-nav-close="emit('close')"
          />
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.admin-mobile-nav-enter-active .admin-mobile-nav-panel,
.admin-mobile-nav-leave-active .admin-mobile-nav-panel {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.admin-mobile-nav-enter-from .admin-mobile-nav-panel,
.admin-mobile-nav-leave-to .admin-mobile-nav-panel {
  transform: translateX(-100%);
}

.admin-mobile-nav-enter-active .admin-mobile-nav-backdrop,
.admin-mobile-nav-leave-active .admin-mobile-nav-backdrop {
  transition: opacity 280ms ease-out;
}

.admin-mobile-nav-enter-from .admin-mobile-nav-backdrop,
.admin-mobile-nav-leave-to .admin-mobile-nav-backdrop {
  opacity: 0;
}
</style>
