<script setup lang="ts">
const session = useState<{
  data?: {
    businessId?: string | null;
  };
} | null>('customer-session', () => null);

if (session.value?.data?.businessId) {
  await navigateTo('/market');
} else {
  await navigateTo('/auth/sign-in');
}
</script>

<template>
  <div />
</template>
