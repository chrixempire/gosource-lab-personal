import process from 'node:process';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';
import { gosourceIconCollections } from '@gosource/icons';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@nuxt/icon'],

  devServer: {
    port: 3003,
    strictPort: true,
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    /** Public API host for PO supplier emails (defaults to host from legacyApiBaseUrl). */
    purchaseOrderReceiptHost: '',
    devAdminBootstrapEnabled: false,
    devAdminBootstrapSecret: '',
    devMongoUri: 'mongodb://127.0.0.1:27017/gosource',
    public: {
      /** legacy-api root URL (no /v2 suffix — admin BFF adds /v2). */
      legacyApiBaseUrl: 'http://127.0.0.1:8000',
      /** Optional CDN root for credit uploads stored as bare object keys. */
      creditDocumentCdnBaseUrl: process.env.NUXT_PUBLIC_CREDIT_DOCUMENT_CDN_BASE_URL || '',
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

    server: {
      hmr: {
        port: 24679,
      },
    },
  },

  build: {
    transpile: ['@gosource/ui', '@gosource/api-client'],
  },
});
