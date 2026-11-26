/** Canonical production origin. Canonical URLs and structured data always use this, even on previews. */
export const PROD_ORIGIN = 'https://vasija.app';

/** True when the build is a preview (env PREVIEW=true): noindex and Disallow all. */
export const IS_PREVIEW: boolean = __PREVIEW__;

/** Page titles stay within this many characters (scripts/check-seo.mjs checks it). */
export const TITLE_MAX = 60;

/** The studio that publishes the app. */
export const PUBLISHER = {
  name: 'delbueno SAS',
  brand: 'delbueno™ Studio',
  url: 'https://delbuenostudio.com/es/',
} as const;
