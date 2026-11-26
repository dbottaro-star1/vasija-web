import type { APIRoute } from 'astro';
import { renderOg } from '../og';

/** Social card shared by every Kabbalah app page (src/layouts/Layout.astro). */
export const GET: APIRoute = async () => new Response(await renderOg(), { headers: { 'Content-Type': 'image/png' } });
