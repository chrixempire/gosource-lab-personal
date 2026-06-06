<script setup lang="ts">
import type { LegalSection } from '~/lib/legal-document';

const props = defineProps<{
  title: string;
  effectiveDate?: string;
  intro: string | string[];
  sections: LegalSection[];
  navItems: { id: string; label: string }[];
}>();

const introParagraphs = computed(() => (Array.isArray(props.intro) ? props.intro : [props.intro]));

const sectionIds = props.sections.map((section) => section.id);

const {
  activeId,
  indicatorTop,
  thumbHeight,
  scrollTo,
  setNavRef,
  pipeRef,
  updateIndicator,
} = useLegalScrollSpy(sectionIds);

const mobileNavRef = ref<HTMLElement | null>(null);

watch(activeId, async () => {
  await nextTick();
  updateIndicator();

  if (!import.meta.client || !mobileNavRef.value) return;
  const activeButton = mobileNavRef.value.querySelector<HTMLElement>(
    `[data-section-id="${activeId.value}"]`,
  );
  activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
});

onMounted(() => {
  nextTick(updateIndicator);
});
</script>

<template>
  <section class="bg-white py-12 lg:py-20">
    <div class="site-container">
      <header v-reveal class="lg:text-left">
        <h1 class="font-display text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-grey-900 sm:text-[2.5rem] lg:text-[3rem] lg:leading-[1.15]">
          {{ title }}
        </h1>
        <p v-if="effectiveDate" class="mt-4 text-sm font-medium tracking-[0.02em] text-grey-500">
          Effective Date: {{ effectiveDate }}
        </p>
        <div class="mt-6 space-y-4">
          <p
            v-for="(paragraph, index) in introParagraphs"
            :key="index"
            class="w-full text-base leading-7 tracking-[0.00625em] text-grey-700"
          >
            {{ paragraph }}
          </p>
        </div>
      </header>

      <div class="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
        <!-- Mobile nav -->
        <div
          ref="mobileNavRef"
          class="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden"
        >
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            :data-section-id="item.id"
            class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300"
            :class="
              activeId === item.id
                ? 'border-primary-500 bg-primary-50 text-primary-800'
                : 'border-grey-200 bg-white text-grey-600 hover:border-grey-300'
            "
            @click="scrollTo(item.id)"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- Desktop sticky nav -->
        <aside class="relative hidden lg:block">
          <nav class="sticky top-28 z-10">
            <div class="flex items-stretch gap-4">
              <!-- Bordered pipe track -->
              <div
                ref="pipeRef"
                class="relative w-2 shrink-0 rounded-full border border-grey-200 bg-grey-50"
                aria-hidden="true"
              >
                <div
                  class="absolute left-1/2 w-1 -translate-x-1/2 rounded-full bg-primary-500"
                  :style="{
                    top: `${indicatorTop}px`,
                    height: `${thumbHeight}px`,
                    transition: 'top 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                  }"
                />
              </div>

              <ul class="min-w-0 flex-1 space-y-0.5">
                <li v-for="(item, index) in navItems" :key="item.id">
                  <button
                    :ref="(el) => setNavRef(el as HTMLElement | null, index)"
                    type="button"
                    class="flex min-h-10 w-full items-center py-2 text-left text-sm leading-snug transition-colors duration-300"
                    :class="
                      activeId === item.id
                        ? 'font-medium text-grey-900'
                        : 'text-grey-500 hover:text-grey-700'
                    "
                    @click="scrollTo(item.id)"
                  >
                    {{ item.label }}
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <!-- Content -->
        <article class="min-w-0">
          <div
            v-for="(section, sectionIndex) in sections"
            :id="section.id"
            :key="section.id"
            v-reveal="sectionIndex * 40"
            class="scroll-mt-32 border-b border-grey-100 py-10 last:border-b-0 first:pt-0 lg:scroll-mt-36 lg:py-11 lg:first:pt-0"
          >
            <h2
              class="flex min-h-10 items-center font-display text-2xl font-medium tracking-[-0.02em] text-grey-900 sm:text-[1.75rem] sm:leading-9"
            >
              <template v-if="section.number">{{ section.number }}. </template>{{ section.title }}
            </h2>

            <div class="mt-5 space-y-5">
              <template v-for="(block, blockIndex) in section.blocks" :key="`${section.id}-${blockIndex}`">
                <p
                  v-if="block.type === 'paragraph'"
                  class="text-base leading-7 tracking-[0.00625em] text-grey-700"
                >
                  {{ block.text }}
                </p>

                <div v-else-if="block.type === 'list'" class="space-y-4">
                  <p
                    v-if="block.intro"
                    class="text-base leading-7 tracking-[0.00625em] text-grey-700"
                  >
                    {{ block.intro }}
                  </p>
                  <ul class="space-y-4">
                    <li
                      v-for="item in block.items"
                      :key="item"
                      class="flex gap-3 text-base leading-7 tracking-[0.00625em] text-grey-700"
                    >
                      <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>

                <p
                  v-else-if="block.type === 'emails'"
                  class="text-base leading-7 tracking-[0.00625em] text-grey-700"
                >
                  <span v-if="block.prefix">{{ block.prefix }} </span>
                  <template v-for="(address, emailIndex) in block.addresses" :key="address">
                    <a
                      :href="`mailto:${address}`"
                      class="font-medium text-primary-600 underline-offset-2 hover:underline"
                    >
                      {{ address }}
                    </a>
                    <span v-if="emailIndex < block.addresses.length - 1"> or </span>
                  </template>
                </p>
              </template>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
