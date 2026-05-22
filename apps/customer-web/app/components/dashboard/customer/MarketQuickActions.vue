<script setup lang="ts">
import { Button } from '@gosource/ui';
import { ArrowRight, Building2, ShoppingBag, Users } from 'lucide-vue-next';

defineProps<{
  hasBranch: boolean;
}>();
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
    <article class="rounded-[26px] border border-grey-50 bg-background-on-canvas p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Browse market</p>
          <h2 class="text-lg font-semibold tracking-[-0.02em] text-grey-900">Start from your buying workspace</h2>
        </div>
        <div class="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <ShoppingBag class="size-5" />
        </div>
      </div>
      <p class="mt-4 text-[13px] leading-6 text-grey-text">
        Return to your main workspace and continue into the areas that matter most for your business.
      </p>
      <NuxtLink to="/market" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
        Stay in market
        <ArrowRight class="size-4" />
      </NuxtLink>
    </article>

    <article class="rounded-[26px] border border-grey-50 bg-background-on-canvas p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Branches</p>
          <h2 class="text-lg font-semibold tracking-[-0.02em] text-grey-900">View and expand your locations</h2>
        </div>
        <div class="flex size-11 items-center justify-center rounded-full bg-grey-55 text-grey-900">
          <Building2 class="size-5" />
        </div>
      </div>
      <p class="mt-4 text-[13px] leading-6 text-grey-text">
        View the branches connected to your business and add more locations as operations expand.
      </p>
      <NuxtLink to="/branches" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
        Go to branches
        <ArrowRight class="size-4" />
      </NuxtLink>
    </article>

    <article class="rounded-[26px] border border-grey-50 bg-background-on-canvas p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Members</p>
          <h2 class="text-lg font-semibold tracking-[-0.02em] text-grey-900">Invite and manage your team</h2>
        </div>
        <div class="flex size-11 items-center justify-center rounded-full bg-grey-55 text-grey-900">
          <Users class="size-5" />
        </div>
      </div>
      <p class="mt-4 text-[13px] leading-6 text-grey-text">
        {{ hasBranch
          ? 'Invite and manage the people attached to your business account.'
          : 'Once your first branch exists, this is where you will invite managers and employees.' }}
      </p>
      <NuxtLink to="/members" class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
        Open members
        <ArrowRight class="size-4" />
      </NuxtLink>
    </article>
  </section>
</template>
