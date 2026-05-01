// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://ramaral.tur.br',
  adapter: cloudflare(),
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'R. Amaral Turismo',
        short_name: 'R. Amaral',
        description: 'Transporte escolar e turismo em Santa Catarina',
        theme_color: '#0138AD',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: undefined,
        globDirectory: 'dist/client',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
      },
    }),
  ],
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR', 'en', 'es'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    inlineStylesheets: "never",
    assets: "_astro",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 0,
    },
  }
});
