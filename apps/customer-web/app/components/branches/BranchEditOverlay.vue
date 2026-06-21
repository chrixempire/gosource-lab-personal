<script setup lang="ts">
import type { BranchRecord } from '@gosource/api-client';
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
  branch: BranchRecord | null;
}>();

const emit = defineEmits<{
  updated: [branch: BranchRecord];
  'update:open': [value: boolean];
}>();

const { updateBranch } = useCustomerBranchService();
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

watch(
  () => [props.open, props.branch] as const,
  ([open, branch]) => {
    if (!open || !branch) {
      return;
    }

    form.branchName = branch.branchName;
    form.streetName = branch.streetName;
    form.lga = branch.lga;
    errorMessage.value = '';
    errors.branchName = '';
    errors.streetName = '';
    errors.lga = '';
  },
  { immediate: true },
);

function close() {
  emit('update:open', false);
}

function updateField(field: 'branchName' | 'streetName' | 'lga', value: string) {
  form[field] = value;
  errorMessage.value = '';
}

async function submit() {
  if (!props.branch) {
    return;
  }

  const branchId = String(props.branch.id ?? '').trim();

  errors.branchName = validateBranchName(form.branchName);
  errors.streetName = validateRequiredText(form.streetName, 'Street name');
  errors.lga = validateLga(form.lga);

  if (errors.branchName || errors.streetName || errors.lga) {
    return;
  }

  if (!branchId) {
    errorMessage.value = 'This branch is missing its identifier. Refresh and try again.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await updateBranch(branchId, {
      branchName: form.branchName,
      streetName: form.streetName,
      lga: form.lga,
    });

    if (result.data) {
      emit('updated', result.data);
    }

    toast.success(extractApiResponseMessage(result, 'Branch updated successfully'));

    close();
  } catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Unable to update branch right now');
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
          <DrawerTitle>
            Edit branch
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Update this branch’s information.
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
      </DrawerBody>

      <DrawerFooter>
        <Button size="medium" class="w-full" :loading="loading" @click="submit">
          Update branch
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :overlay-class="CUSTOMER_FLOATING_OVERLAY_Z" :class="CUSTOMER_FLOATING_CONTENT_Z">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Edit branch
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Update this branch’s information.
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
          Update branch
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
