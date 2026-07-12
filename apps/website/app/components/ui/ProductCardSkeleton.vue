<template>
  <!-- Mirrors ui/ProductCard.vue layout: image, name lines, price, action. -->
  <article
    class="flex h-full min-w-0 animate-pulse flex-col overflow-hidden rounded-2xl border border-grey-100 bg-white"
    aria-hidden="true"
  >
    <div class="aspect-[1.12/1] w-full shrink-0 bg-grey-100" />

    <div class="flex flex-1 flex-col gap-1.5 px-3 pb-2.5 pt-2.5">
      <div class="h-3 w-11/12 rounded bg-grey-100" />
      <div class="h-3 w-2/3 rounded bg-grey-100" />
      <div class="mt-auto pt-1">
        <div class="h-4 w-1/2 rounded bg-grey-100" />
      </div>
    </div>

    <div class="w-full shrink-0 border-t border-grey-100" />

    <div class="px-3 pb-2.5 pt-2.5">
      <div class="h-9 w-full rounded-full bg-grey-100" />
    </div>
  </article>
</template>
