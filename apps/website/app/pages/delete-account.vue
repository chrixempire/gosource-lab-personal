<script setup lang="ts">
import emailjs from '@emailjs/browser';
import { Button, Input, RadioGroup, RadioGroupItem } from '@gosource/ui';
import { ChevronRight } from 'lucide-vue-next';

useHead({ title: 'Delete your GoSource account' });

const EMAILJS_SERVICE_ID = 'service_s9jaqze';
const EMAILJS_TEMPLATE_ID = 'template_rp1lkn2';
const EMAILJS_PUBLIC_KEY = 'pkiUTlw0kZvmcebV-';

const reasons = [
  'I no longer use the app',
  'I created this account by mistake',
  'Privacy concerns or data security issues',
  "I am moving to a new location where this app isn't available",
  'Poor customer service experience',
  'Others Please specify',
] as const;

const formData = reactive({
  firstName: '',
  lastName: '',
  businessName: '',
  phone: '',
  email: '',
  reason: '',
  message: '',
});

const isLoading = ref(false);
const feedbackMessage = ref('');
const feedbackIsError = ref(false);

const isFormValid = computed(() =>
  Object.values(formData).every((value) => value.trim() !== ''),
);

const textareaClass =
  'min-h-[120px] w-full resize-y rounded-[10px] border border-border-input-default bg-grey-55 px-4 py-3 text-body-sm text-grey-900 outline-none transition placeholder:text-grey-400 focus:border-border-input-active focus:ring-4 focus:ring-primary-500/12';

function resetForm() {
  formData.firstName = '';
  formData.lastName = '';
  formData.businessName = '';
  formData.phone = '';
  formData.email = '';
  formData.reason = '';
  formData.message = '';
}

async function submit() {
  if (!isFormValid.value || isLoading.value) {
    return;
  }

  isLoading.value = true;
  feedbackMessage.value = '';

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: 'anyikamaduchris@gmail.com',
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        message: `
Email: ${formData.email}
Phone: ${formData.phone}
First name: ${formData.firstName}
Last name: ${formData.lastName}
Business name: ${formData.businessName}
Reason: ${formData.reason}
Message: ${formData.message}
`.trim(),
      },
      EMAILJS_PUBLIC_KEY,
    );

    feedbackIsError.value = false;
    feedbackMessage.value = 'Email sent successfully';
    resetForm();
  } catch {
    feedbackIsError.value = true;
    feedbackMessage.value = 'Unable to submit request right now';
  } finally {
    isLoading.value = false;

    if (feedbackMessage.value) {
      window.setTimeout(() => {
        feedbackMessage.value = '';
        feedbackIsError.value = false;
      }, 4000);
    }
  }
}
</script>

<template>
  <div class="site-container py-[107px] pb-[70px]">
    <div class="mx-auto flex w-full max-w-[1000px] flex-col gap-12">
      <header class="flex flex-col gap-6">
        <h1 class="text-h2 text-grey-900">Delete Your Account?</h1>
        <p class="max-w-3xl text-base leading-6 text-grey-700">
          Delete your account and all associated content from GoSource permanently. This
          action cannot be undone, so please proceed carefully.
        </p>
      </header>

      <form class="flex flex-col gap-16" @submit.prevent="submit">
        <section class="flex flex-col gap-12">
          <h2 class="text-h3 text-grey-900">Your account information</h2>

          <div class="flex flex-col gap-6">
            <div class="grid gap-6 md:grid-cols-2">
              <label class="flex flex-col gap-2">
                <span class="text-sm text-grey-700">First Name</span>
                <Input
                  v-model="formData.firstName"
                  autocomplete="given-name"
                  placeholder="John"
                  :disabled="isLoading"
                />
              </label>
              <label class="flex flex-col gap-2">
                <span class="text-sm text-grey-700">Last Name</span>
                <Input
                  v-model="formData.lastName"
                  autocomplete="family-name"
                  placeholder="Doe"
                  :disabled="isLoading"
                />
              </label>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
              <label class="flex flex-col gap-2">
                <span class="text-sm text-grey-700">Business Name</span>
                <Input
                  v-model="formData.businessName"
                  autocomplete="organization"
                  placeholder="Example Foods Ltd"
                  :disabled="isLoading"
                />
              </label>
              <label class="flex flex-col gap-2">
                <span class="text-sm text-grey-700">Phone number</span>
                <div
                  class="flex h-10 items-center overflow-hidden rounded-[10px] border border-border-input-default bg-grey-55 focus-within:border-border-input-active"
                >
                  <div class="flex shrink-0 items-center gap-2 pl-4">
                    <img
                      src="/images/nigeria.png"
                      alt="Nigeria flag"
                      class="size-6 rounded-full object-cover"
                    />
                  </div>
                  <Input
                    v-model="formData.phone"
                    type="tel"
                    autocomplete="tel"
                    placeholder="+234 812 345 6789"
                    class="border-0 bg-transparent px-3 focus:border-0 focus:ring-0"
                    :disabled="isLoading"
                  />
                </div>
              </label>
            </div>

            <label class="flex flex-col gap-2">
              <span class="text-sm text-grey-700">Email address</span>
              <Input
                v-model="formData.email"
                type="email"
                autocomplete="email"
                placeholder="example@gmail.com"
                :disabled="isLoading"
              />
            </label>
          </div>
        </section>

        <section class="flex flex-col gap-12">
          <h2 class="text-h3 text-grey-900">Tell us why you're leaving</h2>

          <div class="flex flex-col gap-6">
            <RadioGroup
              v-model="formData.reason"
              name="delete-account-reason"
              class="flex flex-col gap-4"
            >
              <label
                v-for="reason in reasons"
                :key="reason"
                class="flex cursor-pointer items-center gap-3 text-sm font-medium text-grey-700"
              >
                <RadioGroupItem :value="reason" :disabled="isLoading" />
                <span>{{ reason }}</span>
              </label>
            </RadioGroup>

            <label class="flex flex-col gap-2">
              <span class="text-sm text-grey-700">Message</span>
              <textarea
                id="delete-account-message"
                v-model="formData.message"
                placeholder="Drop a message"
                :class="textareaClass"
                :disabled="isLoading"
              />
            </label>
          </div>
        </section>

        <div class="flex flex-col gap-2">
          <Button
            type="submit"
            size="large"
            class="w-fit"
            :loading="isLoading"
            :disabled="!isFormValid"
            :right-icon="ChevronRight"
          >
            Submit
          </Button>
          <p
            v-if="feedbackMessage"
            class="text-sm font-medium"
            :class="feedbackIsError ? 'text-negative-500' : 'text-success-700'"
          >
            {{ feedbackMessage }}
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
