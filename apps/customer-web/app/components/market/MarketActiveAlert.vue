<script setup lang="ts">
import { CircleAlert } from "lucide-vue-next";

const props = defineProps<{
  message: string;
  theme?: string | null;
}>();

const selectedColor = computed(() =>
  /^#[0-9A-F]{6}$/i.test(props.theme ?? "") ? props.theme! : "#374151",
);

const alertStyle = computed(() => {
  const color = selectedColor.value;
  return {
    color,
    borderBottomColor: color,
    backgroundColor: `${color}14`,
  };
});
</script>

<template>
  <div
    class="-mx-4 flex w-[calc(100%+2rem)] items-start gap-2 border-b px-3 py-2.5 text-sm font-medium leading-5 sm:-mx-5 sm:w-[calc(100%+2.5rem)] sm:items-center sm:px-4 lg:-mx-6 lg:w-[calc(100%+3rem)]"
    :style="alertStyle"
    role="status"
  >
    <CircleAlert class="mt-0.5 size-4 shrink-0 sm:mt-0" />
    <p>{{ message }}</p>
  </div>
</template>
