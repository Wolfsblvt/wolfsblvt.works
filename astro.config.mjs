import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import site from './site.config.mjs';

// Static output. The Cloudflare Worker in worker/ adds only what static files can't do: the contact service, the
// per-browser pile seed and response headers. Indexable pages are listed in the sitemap; legal, error and the
// contact page (served from its own host) are not.
const SITEMAP_EXCLUDED = ['/impressum/', '/privacy/', '/contact/', '/404/'];

export default defineConfig({
  site: site.url,
  output: 'static',
  outDir: './artifacts/site',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDED.some((path) => new URL(page).pathname === path),
    }),
  ],
  devToolbar: { enabled: false },
});