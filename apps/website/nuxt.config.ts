/// <reference path="./.nuxt/nuxt.node.d.ts" />

import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: process.env.NODE_ENV === 'development',
  },

  modules: ['@nuxt/icon', '@nuxt/image', '@nuxt/fonts'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'GoSource — All your food supplies in one platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'GoSource is the modern way to source food in Nigeria. Bulk procurement, buy now pay later, wallet management and live delivery — all in one platform.',
        },
        { name: 'theme-color', content: '#09420C' },
        { property: 'og:title', content: 'GoSource — All your food supplies in one platform' },
        { property: 'og:type', content: 'website' },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }],
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
