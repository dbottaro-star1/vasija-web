import type { APIRoute } from 'astro';
import { IS_PREVIEW } from '../lib/site';

/** Previews ask not to be crawled; production points to the sitemap. */
export const GET: APIRoute = ({ site }) =>
  new Response(
    IS_PREVIEW
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
