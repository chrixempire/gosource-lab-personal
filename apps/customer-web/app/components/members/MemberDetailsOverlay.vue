<script setup lang="ts">
import type { EmployeeMemberDetail } from '@gosource/api-client';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@gosource/ui';
import { useMediaQuery } from '@vueuse/core';
import MemberDetailsFields from '~/components/members/MemberDetailsFields.vue';
import { useCustomerEmployeeService } from '~/services/employee.service';
import { extractApiErrorMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  employeeId: string | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { getEmployee } = useCustomerEmployeeService();
const isMobile = useMediaQuery('(max-width: 600px)');
const loading = ref(false);
const detail = ref<EmployeeMemberDetail | null>(null);
const errorMessage = ref('');

watch(
  () => [props.open, props.employeeId] as const,
  async ([open, employeeId]) => {
    if (!open || !employeeId) {
      detail.value = null;
      errorMessage.value = '';
      return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
      const response = await getEmployee(employeeId);
      detail.value = response.data ?? null;
    } catch (error) {
      detail.value = null;
      errorMessage.value = extractApiErrorMessage(error, 'Unable to load member details.');
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function close() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer v-if="isMobile" :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent class="max-h-[92vh]">
      <DrawerHeader>
        <div class="flex flex-col gap-1">
          <DrawerTitle>
            Member details
          </DrawerTitle>
          <DrawerDescription class="text-[12px] leading-5 text-grey-text">
            Read-only information for this team member.
          </DrawerDescription>
        </div>
      </DrawerHeader>

      <DrawerBody class="space-y-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-[12px] bg-grey-55" />
        </div>
        <p
          v-else-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
        <MemberDetailsFields v-else-if="detail" :detail="detail" />
      </DrawerBody>

      <DrawerFooter>
        <Button variant="neutral" size="medium" class="w-full" @click="close">
          Close
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>

  <Dialog v-else :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Member details
          </DialogTitle>
          <DialogDescription class="text-[12px] leading-5 text-grey-text">
            Read-only information for this team member.
          </DialogDescription>
        </div>
        <DialogClose class="shrink-0" />
      </DialogHeader>

      <DialogBody class="space-y-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-[12px] bg-grey-55" />
        </div>
        <p
          v-else-if="errorMessage"
          class="rounded-[18px] border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] font-medium text-negative-500"
        >
          {{ errorMessage }}
        </p>
        <MemberDetailsFields v-else-if="detail" :detail="detail" />
      </DialogBody>
    </DialogContent>
  </Dialog>
</template>
