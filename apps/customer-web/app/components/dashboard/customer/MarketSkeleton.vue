<template>
  <div class="space-y-6">
    <div class="h-56 animate-pulse rounded-[32px] bg-grey-55" />
    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-40 animate-pulse rounded-[24px] bg-grey-55" />
    </div>
    <div class="grid gap-4 lg:grid-cols-3">
      <div v-for="index in 3" :key="index" class="h-56 animate-pulse rounded-[26px] bg-grey-55" />
    </div>
  </div>
</template>
