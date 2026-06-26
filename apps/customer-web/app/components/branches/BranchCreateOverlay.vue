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
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  toast,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import BranchCreateForm from '~/components/onboarding/branch/BranchCreateForm.vue';
import {
  CUSTOMER_FLOATING_CONTENT_Z,
  CUSTOMER_FLOATING_OVERLAY_Z,
} from '~/lib/customer-overlay-z';
import { useCustomerBranchService } from '~/services/branch.service';
import { validateBranchName, validateLga, validateRequiredText } from '~/utils/auth-validation';
import { extractApiErrorMessage, extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  created: [branch: BranchResponse['data']];
  'update:open': [value: boolean];
}>();

const { createBranch } = useCustomerBranchService();
const isMobile = useMediaQuery('(max-width: 600px)');

const form = reactive({
  branchName: '',
  streetName: '',
  lga: '',
});

const errors = reactive({
  branchName: '',
  streetName: '',
  lga: '',
});

const loading = ref(false);
const errorMessage = ref('');

function close() {
  emit('update:open', false);
}

function updateField(field: 'branchName' | 'streetName' | 'lga', value: string) {
  form[field] = value;
  errorMessage.value = '';
}

async function submit() {
  errors.branchName = validateBranchName(form.branchName);
  errors.streetName = validateRequiredText(form.streetName, 'Street name');
  errors.lga = validateLga(form.lga);

  if (errors.branchName || errors.streetName || errors.lga) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await createBranch({
      branchName: form.branchName,
      streetName: form.streetName,
      lga: form.lga,
    });

    form.branchName = '';
    form.streetName = '';
    form.lga = '';

    toast.success(extractApiResponseMessage(result, 'Branch created successfully'));

    if (result.data) {
      emit('created', result.data);
    }

    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to create branch right now');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent
      :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z"
      :class="`max-h-[92vh] ${CUSTOMER_FLOATING_CONTENT_Z}`"
    >
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <div class="flex flex-col gap-1">
            <DrawerTitle>
              Create branch
            </DrawerTitle>
            <DrawerDescription class="text-[12px] leading-5 text-grey-text">
              Add a new branch to your company workspace.
            </DrawerDescription>
          </div>
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
      </DrawerBody>

      <DrawerFooter>
        <Button size="medium" class="w-full" :loading="loading" @click="submit">
          Create branch
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Create branch
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Add a new branch to your company workspace.
          </DialogDescription>
        </div>

        <DialogClose class="shrink-0" />
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

      <DialogFooter>
        <Button size="medium" class="w-full" :loading="loading" @click="submit">
          Create branch
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
