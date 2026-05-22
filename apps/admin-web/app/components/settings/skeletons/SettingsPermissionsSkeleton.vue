<template>
  <section
    class="rounded-xl border border-grey-50 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(16,24,40,0.14)]"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="h-5 w-28 animate-pulse rounded bg-grey-55" />
      <div class="h-4 w-20 animate-pulse rounded bg-grey-55" />
    </div>

    <div class="mt-4 h-10 w-full animate-pulse rounded-[10px] bg-grey-55" />

    <div class="mt-4 flex items-center justify-between border-b border-grey-50 pb-3">
      <div class="h-4 w-40 animate-pulse rounded bg-grey-55" />
      <div class="h-3 w-16 animate-pulse rounded bg-grey-55" />
    </div>

    <div class="mt-2 space-y-2">
      <div
        v-for="index in 6"
        :key="`permission-section-${index}`"
        class="border-b border-grey-50 py-3 last:border-none"
      >
        <div class="flex items-center gap-2">
          <div class="size-4 shrink-0 animate-pulse rounded bg-grey-55" />
          <div class="h-4 flex-1 max-w-[8rem] animate-pulse rounded bg-grey-55" />
          <div class="h-3 w-10 animate-pulse rounded bg-grey-55" />
        </div>
        <div class="mt-3 space-y-3 pl-7">
          <div
            v-for="row in 3"
            :key="`permission-row-${index}-${row}`"
            class="flex items-start gap-2"
          >
            <div class="mt-0.5 size-4 shrink-0 animate-pulse rounded bg-grey-55" />
            <div class="h-4 flex-1 animate-pulse rounded bg-grey-55" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
