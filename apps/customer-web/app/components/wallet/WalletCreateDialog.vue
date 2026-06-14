<script setup lang="ts">
import type { CreateWalletPayload, CustomerMeResponse } from '@gosource/api-client';
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
  Input,
  OtpInput,
  toast,
} from '@gosource/ui';
import { Wallet } from 'lucide-vue-next';
import {
  maskPhoneNumber,
  validateWalletBvn,
} from '~/lib/wallet-display';
import { useCustomerWalletService } from '~/services/wallet.service';
import { validateOtpCode } from '~/utils/auth-validation';
import { extractApiResponseMessage } from '~/utils/api-error';

const props = defineProps<{
  open: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  create: [payload: CreateWalletPayload];
  dismiss: [];
  'update:open': [value: boolean];
}>();

const session = useState<CustomerMeResponse | null>('customer-session', () => null);
const { verifyBvn } = useCustomerWalletService();
const otpLength = useCustomerOtpLength();
const router = useRouter();

const step = ref<'intro' | 'bvn' | 'otp'>('intro');
const bvn = ref('');
const otp = ref('');
const verifiedBvn = ref('');
const phoneHint = ref('');
const bvnError = ref('');
const otpError = ref('');
const verifying = ref(false);

const hasPhoneOnProfile = computed(() => {
  const data = session.value?.data;
  if (!data || typeof data !== 'object' || !('phoneNumber' in data)) {
    return false;
  }
  return String(data.phoneNumber ?? '').trim().length > 0;
});

const maskedPhoneLabel = computed(() => maskPhoneNumber(phoneHint.value));

function resetForm() {
  step.value = 'intro';
  bvn.value = '';
  otp.value = '';
  verifiedBvn.value = '';
  phoneHint.value = '';
  bvnError.value = '';
  otpError.value = '';
  verifying.value = false;
}

function goBack() {
  emit('dismiss');
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }
  void navigateTo('/market');
}

function onOpenChange(value: boolean) {
  if (!value) {
    resetForm();
    goBack();
    return;
  }
  emit('update:open', value);
}

function startBvnStep() {
  if (!hasPhoneOnProfile.value) {
    return;
  }
  step.value = 'bvn';
}

function backStep() {
  if (step.value === 'otp') {
    step.value = 'bvn';
    otp.value = '';
    otpError.value = '';
    return;
  }
  if (step.value === 'bvn') {
    step.value = 'intro';
    bvnError.value = '';
  }
}

async function submitBvn() {
  bvnError.value = validateWalletBvn(bvn.value);
  if (bvnError.value || verifying.value) {
    return;
  }

  verifying.value = true;
  try {
    const normalizedBvn = bvn.value.replace(/\D/g, '');
    const response = await verifyBvn({ bvn: normalizedBvn });
    verifiedBvn.value = normalizedBvn;
    phoneHint.value = response.data?.phoneNumber?.trim() ?? '';
    otp.value = '';
    otpError.value = '';
    step.value = 'otp';
    toast.success(extractApiResponseMessage(response, 'BVN verified. Enter the OTP sent to your phone.'));
  } catch {
    // Service surfaces toast.
  } finally {
    verifying.value = false;
  }
}

async function resendOtp() {
  if (!verifiedBvn.value || verifying.value) {
    return;
  }

  verifying.value = true;
  try {
    const response = await verifyBvn({ bvn: verifiedBvn.value });
    phoneHint.value = response.data?.phoneNumber?.trim() ?? phoneHint.value;
    toast.success(extractApiResponseMessage(response, 'A new OTP has been sent.'));
  } catch {
    // Service surfaces toast.
  } finally {
    verifying.value = false;
  }
}

function submitCreate() {
  otpError.value = validateOtpCode(otp.value, 'OTP', otpLength.value);
  if (otpError.value || props.loading || !verifiedBvn.value) {
    return;
  }

  emit('create', {
    bvn: verifiedBvn.value,
    otp: otp.value.trim(),
  });
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <div class="flex min-w-0 flex-1 flex-col gap-1 pr-2 text-left">
          <DialogTitle>
            Wallets
          </DialogTitle>
          <DialogDescription class="text-sm leading-6 text-grey-text">
            <template v-if="step === 'intro'">
              Add money and pay for orders faster with a business wallet.
            </template>
            <template v-else-if="step === 'bvn'">
              Enter your 11-digit BVN to verify your identity.
            </template>
            <template v-else>
              Enter the OTP sent to the phone linked to your BVN.
            </template>
          </DialogDescription>
        </div>
        <DialogClose
          class="shrink-0"
          aria-label="Go back"
          @click.prevent="goBack"
        />
      </DialogHeader>

      <DialogBody class="space-y-5">
        <div
          v-if="step === 'intro'"
          class="flex size-16 items-center justify-center rounded-[20px] bg-primary-50 text-primary-600"
        >
          <Wallet class="size-8" />
        </div>

        <template v-if="step === 'intro'">
          <div class="space-y-2">
            <h3 class="text-xl font-semibold text-grey-900">Make payments easily</h3>
            <p class="text-sm leading-6 text-grey-300">
              Create a wallet to fund orders quickly and pay at checkout from your balance.
            </p>
            <p v-if="hasPhoneOnProfile" class="text-sm leading-6 text-grey-300">
              We will verify your BVN and send a one-time code to your registered phone.
            </p>
            <p v-else class="text-sm leading-6 text-grey-300">
              Add your phone number under
              <NuxtLink
                to="/settings/my-profile"
                class="font-semibold text-primary-500 no-underline hover:underline"
              >
                Settings → My Profile
              </NuxtLink>
              before creating a wallet.
            </p>
          </div>
        </template>

        <template v-else-if="step === 'bvn'">
          <label class="block space-y-2">
            <span class="text-[13px] font-semibold text-grey-text">Bank verification number (BVN)</span>
            <Input
              v-model="bvn"
              inputmode="numeric"
              maxlength="11"
              placeholder="12345678901"
              :disabled="verifying || loading"
              :invalid="Boolean(bvnError)"
              @update:model-value="bvnError = ''"
            />
            <p v-if="bvnError" class="text-[12px] font-medium text-negative-500">
              {{ bvnError }}
            </p>
          </label>
        </template>

        <template v-else>
          <p class="text-sm leading-6 text-grey-300">
            Enter the {{ otpLength }}-digit code sent to the number {{ maskedPhoneLabel }}.
          </p>
          <OtpInput
            v-model="otp"
            :maxlength="otpLength"
            :disabled="loading || verifying"
            @update:model-value="otpError = ''"
          />
          <p v-if="otpError" class="text-[12px] font-medium text-negative-500">
            {{ otpError }}
          </p>
          <button
            type="button"
            class="text-sm font-semibold text-primary-500 hover:underline disabled:opacity-50"
            :disabled="verifying || loading"
            @click="resendOtp"
          >
            Resend OTP
          </button>
        </template>
      </DialogBody>

      <DialogFooter class="gap-2 sm:justify-end">
        <Button
          v-if="step !== 'intro'"
          variant="neutral"
          size="medium"
          class="!w-auto"
          :disabled="loading || verifying"
          @click="backStep"
        >
          Back
        </Button>
        <Button
          v-else
          variant="neutral"
          size="medium"
          class="!w-auto"
          :disabled="loading"
          @click="goBack"
        >
          Cancel
        </Button>

        <Button
          v-if="step === 'intro'"
          size="medium"
          class="!w-auto"
          :disabled="!hasPhoneOnProfile"
          @click="startBvnStep"
        >
          Continue
        </Button>
        <Button
          v-else-if="step === 'bvn'"
          size="medium"
          class="!w-auto"
          :loading="verifying"
          :disabled="loading"
          @click="submitBvn"
        >
          Verify BVN
        </Button>
        <Button
          v-else
          size="medium"
          class="!w-auto"
          :loading="loading"
          :disabled="verifying || otp.length !== otpLength"
          @click="submitCreate"
        >
          Create wallet
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
