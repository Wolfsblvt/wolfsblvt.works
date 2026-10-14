/** robots.txt for wolfsblvt.works: everything public is crawlable; the legal pages carry their own noindex. */
import type { APIRoute } from 'astro';
import site from '../../site.config.mjs';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
