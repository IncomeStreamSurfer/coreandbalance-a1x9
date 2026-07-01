import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL || 'https://coreandbalance-a1x9.vercel.app',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
