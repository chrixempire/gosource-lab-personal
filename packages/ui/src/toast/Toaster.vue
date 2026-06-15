<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster as SonnerToaster } from 'vue-sonner';
</script>

<template>
  <!-- Above Paystack inline modal (~1e6) so app toasts stay visible after checkout -->
  <SonnerToaster rich-colors position="top-right" :style="{ zIndex: 10000000 }" />
</template>
