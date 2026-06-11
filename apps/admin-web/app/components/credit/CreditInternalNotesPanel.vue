<script setup lang="ts">
import { Button } from '@gosource/ui';
import AdminResponsiveOverlay from '~/components/shared/AdminResponsiveOverlay.vue';
import CreditPanelCard from '~/components/credit/CreditPanelCard.vue';
import { useAdminAuthenticatedFetch } from '~/composables/useAdminAuthenticatedFetch';
import { useCreditMutations } from '~/composables/useCreditMutations';
import { formatCreditDateTime, parseCreditInternalNotes } from '~/lib/credit-api';
import { CREDIT_LINK_BUTTON_CLASS } from '~/lib/credit-constants';

const props = defineProps<{
  targetId: string;
  noteType: 'APPLICATION' | 'REQUEST';
}>();

const targetId = toRef(props, 'targetId');

const { busyId, createInternalNote } = useCreditMutations();

const showAddNote = ref(false);
const allNotesOpen = ref(false);
const draftNote = ref('');

const notesQuery = computed(() => ({
  noteType: props.noteType,
  page: 1,
  limit: 50,
}));

const { data, refresh } = await useAdminAuthenticatedFetch<unknown>(
  () => `/api/credit/notes/${targetId.value}`,
  {
    query: notesQuery,
    watch: [targetId, () => props.noteType],
    key: computed(() => `admin-credit-notes:${props.noteType}:${targetId.value}`),
  },
);

const notes = computed(() => parseCreditInternalNotes(data.value));
const latestNote = computed(() => notes.value[0]);

async function submitNote(options?: { closeOverlay?: boolean }) {
  const note = draftNote.value.trim();
  if (note.length < 10) return;
  try {
    await createInternalNote(props.targetId, { note, noteType: props.noteType });
    draftNote.value = '';
    showAddNote.value = false;
    if (options?.closeOverlay) {
      allNotesOpen.value = false;
    }
    await refresh();
  } catch {
    // toast in composable
  }
}
</script>

<template>
  <CreditPanelCard title="Internal note">
    <p class="text-sm text-grey-500">
      Only visible to admins. Use this space for context, observations, or follow-up instructions.
    </p>

    <div v-if="latestNote && !showAddNote" class="mt-4 space-y-1 rounded-lg bg-grey-25 p-3">
      <p class="text-sm text-grey-800">{{ latestNote.note }}</p>
      <p class="text-xs text-grey-500">
        {{ formatCreditDateTime(latestNote.createdAt) }} · {{ latestNote.authorName }}
      </p>
    </div>

    <textarea
      v-if="showAddNote"
      v-model="draftNote"
      class="mt-4 min-h-[100px] w-full rounded-lg border border-grey-50 p-3 text-sm"
      placeholder="Need more documents for this business if they would need to apply for credit increase."
    />

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <Button
        v-if="!showAddNote"
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        @click="showAddNote = true"
      >
        Add note
      </Button>
      <Button
        v-else
        type="button"
        variant="secondary"
        size="small"
        class="!w-fit shrink-0"
        :loading="busyId === targetId"
        @click="submitNote"
      >
        Submit
      </Button>
      <Button
        type="button"
        variant="link"
        size="small"
        :class="CREDIT_LINK_BUTTON_CLASS"
        @click="allNotesOpen = true"
      >
        View all notes
      </Button>
    </div>
  </CreditPanelCard>

  <AdminResponsiveOverlay v-model:open="allNotesOpen" title="Internal notes">
    <div v-if="notes.length" class="space-y-4">
      <div v-for="entry in notes" :key="entry.id" class="border-b border-grey-50 pb-3">
        <p class="text-sm font-medium text-grey-900">{{ entry.note }}</p>
        <p class="mt-1 text-xs text-grey-500">
          {{ formatCreditDateTime(entry.createdAt) }} · {{ entry.authorName }}
        </p>
      </div>
    </div>
    <p v-else class="py-6 text-center text-sm text-grey-500">No notes yet</p>

    <textarea
      v-model="draftNote"
      class="mt-4 min-h-[100px] w-full rounded-lg border border-grey-50 p-3 text-sm"
      placeholder="Add a note (min. 10 characters)"
    />

    <template #footer>
      <Button
        type="button"
        variant="secondary"
        size="small"
        class="w-full sm:w-auto"
        :loading="busyId === targetId"
        @click="submitNote({ closeOverlay: true })"
      >
        Add note
      </Button>
    </template>
  </AdminResponsiveOverlay>
</template>
