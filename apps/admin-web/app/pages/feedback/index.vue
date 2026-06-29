<script setup lang="ts">
import { SegmentedControl } from "@gosource/ui";
import { useAdminHeader } from "~/composables/useAdminHeader";
import FeedbackPanel from "~/components/feedback/FeedbackPanel.vue";
import ReviewsPanel from "~/components/feedback/ReviewsPanel.vue";

type FeedbackTab = "feedback" | "reviews";

const TABS: { value: FeedbackTab; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "reviews", label: "Reviews" },
];

const route = useRoute();
const router = useRouter();

const tab = computed<FeedbackTab>(() =>
  route.query.tab === "reviews" ? "reviews" : "feedback",
);
const activePanel = computed(() =>
  tab.value === "reviews" ? ReviewsPanel : FeedbackPanel,
);

function setTab(value: FeedbackTab) {
  if (value === tab.value) return;
  void router.replace({ query: { ...route.query, tab: value } });
}

const { updateHeader } = useAdminHeader();
updateHeader({ title: "Feedbacks & reviews" });
</script>

<template>
  <ClientOnly>
    <div class="flex min-w-0 flex-col gap-4">
      <SegmentedControl
        :model-value="tab"
        :options="TABS"
        class="w-fit"
        @update:model-value="setTab($event as FeedbackTab)"
      />

      <Suspense>
        <component :is="activePanel" :key="tab" />
        <template #fallback>
          <div class="py-12 text-center text-sm text-grey-400">Loading…</div>
        </template>
      </Suspense>
    </div>
  </ClientOnly>
</template>
