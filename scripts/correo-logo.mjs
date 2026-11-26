/**
 * Writes public/correo/logo.png: the Tikún mark (src/components/LogoVasija.astro, light tone) as a PNG for the
 * waitlist email, because Gmail and Outlook do not show SVG. 3x: shown at 48 by 42 px.
 * Run it again only if the mark changes: node scripts/correo-logo.mjs
 */
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 21" width="144" height="126" fill="none" stroke-linecap="round">
  <path d="M6 13 A10 10 0 0 0 10.1 21.1" stroke="#2F4560" stroke-width="1.6"/>
  <path d="M12.2 22.2 A10 10 0 0 0 26 13" stroke="#2F4560" stroke-width="1.6"/>
  <path d="M10.1 21.1 L12.2 22.2" stroke="#C9A75E" stroke-width="2.3"/>
  <circle cx="16" cy="8" r="2.4" fill="#2B4FB3"/>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 144 } }).render().asPng();
writeFileSync('public/correo/logo.png', png);
console.log(`correo-logo ok: public/correo/logo.png (${png.length} bytes)`);
