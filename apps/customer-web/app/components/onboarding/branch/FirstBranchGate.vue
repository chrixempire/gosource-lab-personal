<script setup lang="ts">
import type { BranchResponse } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  toast,
} from '@gosource/ui';
import BranchCreateForm from '~/components/onboarding/branch/BranchCreateForm.vue';
import { useCustomerBranchService } from '~/services/branch.service';
import {
  validateBranchName,
  validateLga,
  validateRequiredText,
} from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

import { useMarketBranchSetupDismissal } from '~/composables/useMarketBranchSetupDismissal';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  created: [branch: BranchResponse['data']];
}>();

const { dismiss: dismissBranchSetupReminder } = useMarketBranchSetupDismissal();

const { createBranch } = useCustomerBranchService();

const form = useState('customer-branch-draft', () => ({
  branchName: '',
  streetName: '',
  lga: '',
}));

const loading = ref(false);
const errorMessage = ref('');
const isMobile = ref(false);

const errors = reactive({
  branchName: '',
  streetName: '',
  lga: '',
});

const overlayOpen = computed(() => props.open);

function syncViewportMode() {
  if (typeof window === 'undefined') {
    return;
  }

  isMobile.value = window.innerWidth <= 600;
}

onMounted(() => {
  syncViewportMode();
  window.addEventListener('resize', syncViewportMode);
});

onBeforeUnmount(() => {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('resize', syncViewportMode);
});

async function submit() {
  errors.branchName = validateBranchName(form.value.branchName);
  errors.streetName = validateRequiredText(form.value.streetName, 'Street name');
  errors.lga = validateLga(form.value.lga);

  if (errors.branchName || errors.streetName || errors.lga) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await createBranch({
      branchName: form.value.branchName,
      streetName: form.value.streetName,
      lga: form.value.lga,
    });

    form.value = {
      branchName: '',
      streetName: '',
      lga: '',
    };
    toast.success(extractApiResponseMessage(result, 'Branch created successfully'));

    if (result.data) {
      emit('created', result.data);
    }
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to create branch right now');
  } finally {
    loading.value = false;
  }
}

function updateField(field: 'branchName' | 'streetName' | 'lga', value: string) {
  form.value[field] = value;
  errorMessage.value = '';

  if (field === 'branchName' && errors.branchName) {
    errors.branchName = validateBranchName(value);
  }

  if (field === 'streetName' && errors.streetName) {
    errors.streetName = validateRequiredText(value, 'Street name');
  }

  if (field === 'lga' && errors.lga) {
    errors.lga = validateLga(value);
  }
}

function closeGate() {
  emit('update:open', false);
  dismissBranchSetupReminder();
}

function onOpenChange(value: boolean) {
  if (!value) {
    closeGate();
    return;
  }

  emit('update:open', true);
}
</script>

<template>
  <Drawer v-if="isMobile" :open="overlayOpen" @update:open="onOpenChange">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader class="relative pr-10">
        <DrawerClose class="absolute right-3 top-3" />
        <div class="flex flex-col gap-1">
          <DrawerTitle class="font-display text-[24px] font-semibold leading-7 tracking-[-0.02em] text-grey-900">
            Create your first branch
          </DrawerTitle>
          <DrawerDescription class="text-[13px] leading-5 text-grey-text">
            Add the first branch for your business so orders, members, and branch operations can begin from one place.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <BranchCreateForm
          :branch-name="form.branchName"
          :street-name="form.streetName"
          :lga="form.lga"
          :loading="loading"
          :show-submit-button="false"
          :branch-name-error="errors.branchName"
          :street-name-error="errors.streetName"
          :lga-error="errors.lga"
          @update:branch-name="updateField('branchName', $event)"
          @update:street-name="updateField('streetName', $event)"
          @update:lga="updateField('lga', $event)"
          @submit="submit"
        />

        <p
          v-if="errorMessage"
          class="mt-4 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DrawerBody>

      <DrawerFooter class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button size="medium" class="w-full" :loading="loading" @click="submit">
          Create branch
        </Button>
        <Button variant="ghost" size="medium" class="w-full" type="button" @click="closeGate">
          Maybe later
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="overlayOpen" @update:open="onOpenChange">
    <DialogContent>
      <DialogHeader>
        <DialogClose class="absolute right-3 top-3 sm:right-4 sm:top-4" />
        <div class="flex flex-col gap-1 pr-8">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-grey-300">Branch Setup</p>
          <DialogTitle class="font-display text-[24px] font-semibold leading-7 tracking-[-0.02em] text-grey-900">
            Create your first branch
          </DialogTitle>
          <DialogDescription class="text-[13px] leading-5 text-grey-text">
            Set up your first business branch to manage orders, team members, and operations from one place.
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogBody>
        <BranchCreateForm
          :branch-name="form.branchName"
          :street-name="form.streetName"
          :lga="form.lga"
          :loading="loading"
          :show-submit-button="false"
          :branch-name-error="errors.branchName"
          :street-name-error="errors.streetName"
          :lga-error="errors.lga"
          @update:branch-name="updateField('branchName', $event)"
          @update:street-name="updateField('streetName', $event)"
          @update:lga="updateField('lga', $event)"
          @submit="submit"
        />

        <p
          v-if="errorMessage"
          class="mt-4 rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
      </DialogBody>

      <DialogFooter class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button size="medium" class="w-full" :loading="loading" @click="submit">
          Create branch
        </Button>
        <Button variant="secondary" size="medium" class="w-full" type="button" @click="closeGate">
          Maybe later
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
