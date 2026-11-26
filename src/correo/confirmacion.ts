/**
 * The waitlist confirmation email ("Ya estás en la lista de Vasija"), sent by functions/api/lista.ts through Resend.
 *
 * Same look as vasija.app: paper #F0F0EE, ink, the Tikún mark (public/correo/logo.png, because Gmail does not show
 * SVG), the name with its tagline, EB Garamond for the text and IBM Plex Mono for the yellow button. The fonts load
 * from vasija.app/correo/fuentes/ where the client allows it (Apple Mail, iOS); elsewhere (Gmail, Outlook) they fall
 * back to Georgia and Courier. Layout in tables with inline styles, the way email clients need it.
 *
 * Inside style attributes, font names go in single quotes: a double quote would close the attribute.
 */

export const ASUNTO = 'Ya estás en la lista de Vasija';

const COMUNIDAD = 'https://chat.whatsapp.com/KS7CNwaLXyuHm5c99BJYGV';
const NOMBRE = 'Vasija';
const BAJADA = 'Crecimiento personal inspirado en la Kabbalah';

const C = {
  papel: '#F0F0EE',
  tinta: '#1E2530',
  cuerpo: '#2E3540',
  suave: '#4A5260',
  secundaria: '#5C626C',
  borde: '#D9D9D5',
  sol: '#F4DC63',
};
const SERIF = "'EB Garamond', 'Iowan Old Style', Georgia, 'Times New Roman', serif";
const MONO = "'IBM Plex Mono', 'SFMono-Regular', Menlo, 'Courier New', monospace";

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * @param nombre the person's name, if they wrote one
 * @param origen where the logo and fonts are served from (https://vasija.app, or a local server for a preview)
 */
export function confirmacion(nombre: string | null, origen = 'https://vasija.app') {
  const saludo = nombre ? `Hola, ${nombre}:` : 'Hola:';
  const parrafos = [
    'Ya estás en la lista de espera de Vasija, la app de crecimiento personal inspirada en la Kabbalah, con el método de Kevin Jakter.',
    'El día que la app esté en App Store y Google Play, te escribimos. Nada más que eso: sin spam.',
    'Mientras tanto, si querés, sumate a la comunidad de Vasija en WhatsApp.',
  ];

  const texto = [
    `${NOMBRE} - ${BAJADA}`,
    '',
    saludo,
    '',
    parrafos[0],
    '',
    parrafos[1],
    '',
    `${parrafos[2]} ${COMUNIDAD}`,
    '',
    'Si no fuiste vos o preferís que te saquemos de la lista, respondé este correo y listo.',
    '',
    'https://vasija.app',
  ].join('\n');

  const p = `margin:0 0 18px;font-family:${SERIF};font-size:19px;line-height:1.5;color:${C.cuerpo};`;
  const fuente = (archivo: string, familia: string, peso: number) =>
    `@font-face{font-family:'${familia}';font-style:normal;font-weight:${peso};font-display:swap;src:url('${origen}/correo/fuentes/${archivo}') format('woff2');}`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapar(ASUNTO)}</title>
<style>
${fuente('eb-garamond-400.woff2', 'EB Garamond', 400)}
${fuente('eb-garamond-500.woff2', 'EB Garamond', 500)}
${fuente('ibm-plex-mono-500.woff2', 'IBM Plex Mono', 500)}
body{margin:0;padding:0;background:${C.papel};}
a{color:${C.tinta};}
</style>
</head>
<body style="margin:0;padding:0;background:${C.papel};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Te escribimos el día que la app esté en las tiendas. Mientras tanto, sumate a la comunidad.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.papel};">
  <tr>
    <td align="center" style="padding:40px 24px 48px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td align="center" style="padding:0 0 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td valign="middle" style="padding:0 12px 0 0;">
                  <img src="${origen}/correo/logo.png" width="44" height="39" alt="" style="display:block;border:0;width:44px;height:39px;">
                </td>
                <td valign="middle" style="font-family:${SERIF};font-size:32px;line-height:1;font-weight:500;letter-spacing:-0.01em;color:${C.tinta};">${NOMBRE}</td>
              </tr>
            </table>
            <div style="padding-top:10px;font-family:${SERIF};font-size:16px;line-height:1.3;color:${C.suave};text-align:center;">${BAJADA}</div>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid ${C.borde};padding:32px 0 0;">
            <p style="${p}">${escapar(saludo)}</p>
            <p style="${p}">Ya estás en la lista de espera de <strong style="font-weight:500;color:${C.tinta};">Vasija</strong>, la app de crecimiento personal inspirada en la Kabbalah, con el método de Kevin Jakter.</p>
            <p style="${p}">${parrafos[1]}</p>
            <p style="${p}">${parrafos[2]}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0 34px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:${C.sol};border-radius:4px;">
                  <a href="${COMUNIDAD}" style="display:inline-block;padding:19px 26px;font-family:${MONO};font-size:13px;line-height:1;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${C.tinta};text-decoration:none;">Sumate a la comunidad &#8599;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 28px;">
            <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.5;color:${C.secundaria};">Si no fuiste vos o preferís que te saquemos de la lista, respondé este correo y listo.</p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid ${C.borde};padding:20px 0 0;">
            <a href="https://vasija.app" style="font-family:${MONO};font-size:11px;line-height:1;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${C.secundaria};text-decoration:none;">vasija.app</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { asunto: ASUNTO, texto, html };
}
