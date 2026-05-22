<script setup lang="ts">
defineProps<{
  branchCount: number;
  hasBranch: boolean;
  isReadyForTeamInvite: boolean;
}>();
</script>

<template>
  <section class="grid gap-4 md:grid-cols-3">
    <article class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Branches</p>
      <p class="mt-3 text-[1.9rem] font-semibold tracking-[-0.03em] text-grey-900">
        {{ branchCount }}
      </p>
      <p class="mt-2 text-[13px] leading-6 text-grey-text">
        {{ hasBranch ? 'You already have at least one branch in your workspace.' : 'Your first branch will unlock the rest of the workspace.' }}
      </p>
    </article>

    <article class="rounded-[24px] border border-grey-50 bg-background-on-canvas p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Team</p>
      <p class="mt-3 text-[1.9rem] font-semibold tracking-[-0.03em] text-grey-900">
        {{ isReadyForTeamInvite ? 'Ready' : 'Pending' }}
      </p>
      <p class="mt-2 text-[13px] leading-6 text-grey-text">
        {{ isReadyForTeamInvite ? 'You can now invite people into the business workspace.' : 'Team invitations become available once the first branch is ready.' }}
      </p>
    </article>

    <article class="rounded-[24px] border border-primary-100 bg-[linear-gradient(180deg,rgba(25,184,32,0.08)_0%,rgba(25,184,32,0.02)_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(16,24,40,0.2)]">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-500">Workspace</p>
      <p class="mt-3 text-[1.9rem] font-semibold tracking-[-0.03em] text-grey-900">
        Active
      </p>
      <p class="mt-2 text-[13px] leading-6 text-grey-text">
        Your market, branches, and member management now live in one shared workspace.
      </p>
    </article>
  </section>
</template>
