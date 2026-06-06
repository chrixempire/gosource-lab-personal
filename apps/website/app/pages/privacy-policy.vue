<script setup lang="ts">
import {
  privacyPolicyMeta,
  privacyPolicyNav,
  privacyPolicySections,
} from '~/lib/privacy-policy';

useHead({ title: 'GoSource Privacy Policy' });
</script>

<template>
  <LegalDocumentShell
    :title="privacyPolicyMeta.title"
    :effective-date="privacyPolicyMeta.effectiveDate"
    :intro="privacyPolicyMeta.intro"
    :sections="privacyPolicySections"
    :nav-items="privacyPolicyNav"
  />
</template>
