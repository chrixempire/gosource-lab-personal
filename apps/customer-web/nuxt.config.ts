/// <reference path="./.nuxt/nuxt.node.d.ts" />

import process from 'node:process';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';
import { gosourceIconCollections } from '@gosource/icons';
import { CUSTOMER_THEME_BOOTSTRAP_SCRIPT } from './app/lib/customer-theme';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@nuxt/icon', '@nuxt/image'],

  experimental: {
    defaults: {
      nuxtLink: {
        prefetchOn: {
          interaction: true,
          visibility: true,
        },
      },
    },
  },

  image: {
    domains: [
      'res.cloudinary.com',
      'gosource.sfo3.digitaloceanspaces.com',
      'gosource.sfo3.cdn.digitaloceanspaces.com',
    ],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      script: [
        {
          key: 'customer-theme-bootstrap',
          innerHTML: CUSTOMER_THEME_BOOTSTRAP_SCRIPT,
          type: 'text/javascript',
          tagPriority: 'critical' as const,
        },
      ],
    },
  },

  runtimeConfig: {
    customerApiMode: 'legacy',
    legacyApiBaseUrl: 'http://127.0.0.1:8000',
    public: {
      customerApiMode: 'legacy',
      apiBaseUrl: 'http://127.0.0.1:8000',
      googleMapsApiKey: '',
      paystackPublicKey: '',
    },
  },

  alias: {
    '@gosource/api-client': fileURLToPath(
      new URL('../../packages/api-client/src/index.ts', import.meta.url),
    ),
  },

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true,
      sizeLimitKb: 128,
    },
    customCollections: [...gosourceIconCollections],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'vue-sonner',
        'class-variance-authority',
        'reka-ui',
        'tailwind-merge',
        'lucide-vue-next',
        'vue-input-otp',
      ],
    },

    server: {
      hmr: {
        port: 24678,
      },
    },
  },

  build: {
    transpile: ['@gosource/ui', '@gosource/api-client'],
  },
});
