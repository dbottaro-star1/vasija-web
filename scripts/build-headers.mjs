/**
 * Writes dist/_headers for Cloudflare Pages after the build: the full Content-Security-Policy from security/csp.json
 * (with frame-ancestors and upgrade-insecure-requests, which a <meta> tag cannot carry), security headers for every
 * page, long caching for Astro's hashed files, and CORS for the email logo and fonts (public/correo/), which mail clients
 * load from other origins.
 */
import { writeFileSync } from 'node:fs';
import { cspString } from '../security/csp.mjs';

const headers = `/*
  Content-Security-Policy: ${cspString()}
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/correo/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400
`;

writeFileSync('dist/_headers', headers);
console.log('build-headers ok: dist/_headers written.');
