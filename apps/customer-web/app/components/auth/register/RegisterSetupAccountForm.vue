<script setup lang="ts">
import { Button, Input, PasswordInput } from '@gosource/ui';
import PasswordRulesChecklist from '../shared/PasswordRulesChecklist.vue';
import type { PasswordRuleState } from '~/utils/auth-validation';

defineProps<{
  firstName: string;
  lastName: string;
  role?: string;
  showRoleField?: boolean;
  roleLabel?: string;
  rolePlaceholder?: string;
  phoneNumber: string;
  password: string;
  loading: boolean;
  firstNameError?: string;
  lastNameError?: string;
  roleError?: string;
  phoneNumberError?: string;
  passwordError?: string;
  passwordRules: PasswordRuleState[];
}>();

const emit = defineEmits<{
  'update:firstName': [value: string];
  'update:lastName': [value: string];
  'update:role': [value: string];
  'update:phoneNumber': [value: string];
  'update:password': [value: string];
  submit: [];
}>();
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">First name</span>
        <Input
          :model-value="firstName"
          autocomplete="given-name"
          placeholder="John"
          :disabled="loading"
          :invalid="Boolean(firstNameError)"
          @update:model-value="emit('update:firstName', $event)"
        />
        <p v-if="firstNameError" class="text-[12px] font-medium text-negative-500">
          {{ firstNameError }}
        </p>
      </label>

      <label class="block space-y-2">
        <span class="text-[13px] font-semibold text-grey-text">Last name</span>
        <Input
          :model-value="lastName"
          autocomplete="family-name"
          placeholder="Doe"
          :disabled="loading"
          :invalid="Boolean(lastNameError)"
          @update:model-value="emit('update:lastName', $event)"
        />
        <p v-if="lastNameError" class="text-[12px] font-medium text-negative-500">
          {{ lastNameError }}
        </p>
      </label>
    </div>

    <label v-if="showRoleField" class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">{{ roleLabel || 'What’s your position?' }}</span>
      <Input
        :model-value="role || ''"
        autocomplete="organization-title"
        :placeholder="rolePlaceholder || 'Manager'"
        :disabled="loading"
        :invalid="Boolean(roleError)"
        @update:model-value="emit('update:role', $event)"
      />
      <p v-if="roleError" class="text-[12px] font-medium text-negative-500">
        {{ roleError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Phone number</span>
      <Input
        :model-value="phoneNumber"
        type="tel"
        autocomplete="tel"
        placeholder="08012345678"
        :disabled="loading"
        :invalid="Boolean(phoneNumberError)"
        @update:model-value="emit('update:phoneNumber', $event)"
      />
      <p v-if="phoneNumberError" class="text-[12px] font-medium text-negative-500">
        {{ phoneNumberError }}
      </p>
    </label>

    <label class="block space-y-2">
      <span class="text-[13px] font-semibold text-grey-text">Create password</span>
      <PasswordInput
        :model-value="password"
        autocomplete="new-password"
        placeholder="Minimum 8 characters"
        :disabled="loading"
        :invalid="Boolean(passwordError)"
        @update:model-value="emit('update:password', $event)"
      />
      <p v-if="passwordError" class="text-[12px] font-medium text-negative-500">
        {{ passwordError }}
      </p>
      <PasswordRulesChecklist :rules="passwordRules" />
    </label>

    <Button size="medium" class="w-full" type="submit" :loading="loading">
      Complete setup
    </Button>
  </form>
</template>
