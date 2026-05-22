<script setup lang="ts">
defineProps<{
  firstName?: string | null;
  businessName?: string | null;
}>();
</script>

<template>
  <section class="overflow-hidden rounded-[32px] border border-grey-50 bg-[linear-gradient(135deg,#f7fff7_0%,#ffffff_50%,#f4fbf6_100%)] p-6 shadow-[0_24px_60px_-32px_rgba(16,24,40,0.18)] sm:p-8">
    <div class="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
      <div class="space-y-4">
        <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-primary-500">
          GoSource Market
        </p>
        <div class="space-y-3">
          <h1 class="max-w-2xl font-display text-[2rem] leading-tight tracking-[-0.03em] text-grey-900 sm:text-[2.6rem]">
            {{ firstName ? `Welcome back, ${firstName}` : 'Welcome to your customer workspace' }}
          </h1>
          <p class="max-w-2xl text-sm leading-7 text-grey-300 sm:text-[15px]">
            Manage your branches, organise your team, and run
            <span class="font-semibold text-grey-900">{{ businessName ?? 'your business' }}</span>
            from one clean operating workspace.
          </p>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div class="rounded-[24px] border border-primary-100 bg-white/90 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">
            Focus
          </p>
          <p class="mt-2 text-lg font-semibold text-grey-900">
            Keep your branches and team details in one place.
          </p>
        </div>
        <div class="rounded-[24px] border border-grey-50 bg-white/90 p-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">
            Workflow
          </p>
          <p class="mt-2 text-sm leading-6 text-grey-text">
            Create your first branch, then continue into branch management and team operations as your workspace grows.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
