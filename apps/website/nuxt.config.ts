/// <reference path="./.nuxt/nuxt.node.d.ts" />

import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';

const SITE_URL = 'https://gosource.app';
const SITE_NAME = 'GoSource';
const SITE_TITLE = 'GoSource — All your food supplies in one platform';
const SITE_DESCRIPTION =
  'GoSource is the modern way to source food in Nigeria. Bulk procurement, buy now pay later, wallet management and live delivery — all in one platform.';
const OG_IMAGE = `${SITE_URL}/images/woman-smiling.jpeg`;
const GTM_ID = 'GTM-TMKBCG7P';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@nuxt/icon', '@nuxt/image', '@nuxt/fonts', '@nuxtjs/sitemap'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  site: {
    url: SITE_URL,
    name: SITE_NAME,
  },

  runtimeConfig: {
    // Server-only: normalized live catalog feed used by the "Customer favorites" section.
    // Points at the customer app's public proxy, which already normalizes prices/images.
    catalogApiUrl:
      process.env.NUXT_CATALOG_API_URL ?? 'https://dashboard.gosource.app/api/proxy/category',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'https://gosource-api-v2-g7clw.ondigitalocean.app/v2',
      siteUrl: SITE_URL,
      gtmId: GTM_ID,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: SITE_TITLE,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: SITE_DESCRIPTION },
        { name: 'theme-color', content: '#09420C' },

        // Open Graph
        { property: 'og:title', content: SITE_TITLE },
        { property: 'og:description', content: SITE_DESCRIPTION },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: SITE_URL },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:image', content: OG_IMAGE },
        { property: 'og:image:alt', content: 'Cooking at home with a fresh GoSource grocery haul' },

        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_TITLE },
        { name: 'twitter:description', content: SITE_DESCRIPTION },
        { name: 'twitter:image', content: OG_IMAGE },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'canonical', href: SITE_URL },
      ],
      script: [
        // Mailchimp Connected Sites (same script as live gosource.app)
        {
          key: 'mcjs',
          src: 'https://chimpstatic.com/mcjs-connected/js/users/865b5acaf292c8fcb9f34b704/c8b2ad6ce17e3e7091f13ffe1.js',
          async: true,
        },
      ],
      noscript: [
        // GTM fallback when JS is disabled
        {
          key: 'gtm-noscript',
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe>`,
          tagPosition: 'bodyOpen',
        },
      ],
    },
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Playfair Display', provider: 'google', weights: [400, 500], styles: ['italic'] },
    ],
  },

  experimental: {
    defaults: {
      nuxtLink: {
        prefetchOn: { interaction: true, visibility: true },
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
    server: {
      hmr: {
        port: 24680,
      },
    },
  },
});
