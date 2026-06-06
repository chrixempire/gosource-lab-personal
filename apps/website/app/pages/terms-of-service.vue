<script setup lang="ts">
import {
  termsOfServiceMeta,
  termsOfServiceNav,
  termsOfServiceSections,
} from '~/lib/terms-of-service';

useHead({ title: 'GoSource Terms of Service' });
</script>

<template>
  <LegalDocumentShell
    :title="termsOfServiceMeta.title"
    :intro="termsOfServiceMeta.intro"
    :sections="termsOfServiceSections"
    :nav-items="termsOfServiceNav"
  />
</template>
