// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * vasija.app: the website of the Vasija app. Two environment variables:
 *   SITE_URL   origin the build is served from (default https://vasija.app)
 *   PREVIEW    "true" marks the build as a non-indexable preview (noindex, no sitemap, robots Disallow)
 */
const SITE_URL = (process.env.SITE_URL || 'https://vasija.app').replace(/\/+$/, '');
const IS_PREVIEW = process.env.PREVIEW === 'true';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Every stylesheet is a file, so the CSP can say style-src 'self' (see security/csp.json).
    inlineStylesheets: 'never',
  },
  integrations: IS_PREVIEW ? [] : [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: {
    define: {
      __PREVIEW__: JSON.stringify(IS_PREVIEW),
    },
    build: {
      // Astro inlines a page script that bundles under 4 KB, and an inline script would need its own hash in the CSP.
      // Scripts always ship as files instead (script-src 'self'); other assets keep Vite's default.
      assetsInlineLimit: (/** @type {string} */ file) => (file.endsWith('.js') ? false : undefined),
    },
  },
});
