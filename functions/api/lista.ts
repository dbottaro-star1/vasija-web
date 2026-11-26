/**
 * POST /api/lista: adds a person to the waitlist (Cloudflare Pages Function, D1 binding DB, table in
 * migrations/0001_lista_espera.sql) and sends them a confirmation email through Resend.
 *
 * - With scripts, src/scripts/lista.ts posts JSON and gets JSON back ({ success }).
 * - Without scripts, the browser posts the form and gets a 303 back to /?enviado=1#lista (or ?error=1).
 * - The email is the key: signing up twice keeps one row, fills in what was missing and sends nothing new.
 * - `botcheck` is a honeypot hidden from people: if it comes checked, we answer success and store nothing.
 * - The confirmation goes out only on the first signup, from hola@send.vasija.app (Resend domain send.vasija.app)
 *   with replies to hola@vasija.app. It needs the secret RESEND_API_KEY (Cloudflare Pages, Settings, Variables and
 *   secrets); without it the signup is stored and no email is sent.
 * Nothing here logs the email or the name.
 */

interface D1Result {
  meta?: { changes?: number };
}
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<D1Result>;
}
interface Env {
  DB: { prepare(query: string): D1Statement };
  RESEND_API_KEY?: string;
}
type Ctx = { request: Request; env: Env; waitUntil(promise: Promise<unknown>): void };

const EXPERIENCIAS = new Set(['Cuaderno de trabajo', 'Curso', 'Lo sigo en redes', 'Todavía no']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REMITENTE = 'Vasija <hola@send.vasija.app>';
const RESPONDER_A = 'hola@vasija.app';
const COMUNIDAD = 'https://chat.whatsapp.com/KS7CNwaLXyuHm5c99BJYGV';

const texto = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, max);
  return clean || null;
};

const html = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function leer(request: Request): Promise<{ datos: Record<string, unknown>; json: boolean }> {
  const tipo = request.headers.get('Content-Type') ?? '';
  if (tipo.includes('application/json'))
    return { datos: (await request.json()) as Record<string, unknown>, json: true };
  return { datos: Object.fromEntries(await request.formData()), json: false };
}

function responder(request: Request, json: boolean, ok: boolean, status: number): Response {
  if (json) {
    return new Response(JSON.stringify({ success: ok }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const destino = new URL(ok ? '/?enviado=1#lista' : '/?error=1#lista', request.url);
  return Response.redirect(destino.toString(), 303);
}

/** The confirmation email, in plain text and HTML. */
function confirmacion(nombre: string | null) {
  const saludo = nombre ? `Hola, ${nombre}:` : 'Hola:';
  const texto = [
    saludo,
    '',
    'Ya estás en la lista de espera de Vasija, la app de crecimiento personal inspirada en la Kabbalah, con el método de Kevin Jakter.',
    '',
    'El día que la app esté en App Store y Google Play, te escribimos. Nada más que eso: sin spam.',
    '',
    `Mientras tanto, si querés, sumate a la comunidad de Vasija en WhatsApp: ${COMUNIDAD}`,
    '',
    'Si no fuiste vos o preferís que te saquemos de la lista, respondé este correo y listo.',
    '',
    'Vasija',
    'https://vasija.app',
  ].join('\n');

  const p = 'margin:0 0 16px;font:17px/1.55 Georgia,"Times New Roman",serif;color:#2E3540;';
  const cuerpo = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F0F0EE;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <p style="margin:0 0 28px;font:600 24px/1 Georgia,'Times New Roman',serif;color:#1E2530;">Vasija</p>
      <p style="${p}">${html(saludo)}</p>
      <p style="${p}">Ya estás en la lista de espera de <strong>Vasija</strong>, la app de crecimiento personal inspirada en la Kabbalah, con el método de Kevin Jakter.</p>
      <p style="${p}">El día que la app esté en App Store y Google Play, te escribimos. Nada más que eso: sin spam.</p>
      <p style="${p}">Mientras tanto, si querés, sumate a la comunidad de Vasija en WhatsApp.</p>
      <p style="margin:0 0 28px;">
        <a href="${COMUNIDAD}" style="display:inline-block;padding:14px 22px;background:#F4DC63;color:#1E2530;text-decoration:none;font:600 13px/1 'Courier New',monospace;letter-spacing:.12em;text-transform:uppercase;">Sumate a la comunidad</a>
      </p>
      <p style="margin:0 0 28px;font:15px/1.5 Georgia,'Times New Roman',serif;color:#5C626C;">Si no fuiste vos o preferís que te saquemos de la lista, respondé este correo y listo.</p>
      <p style="margin:0;font:13px/1.5 Georgia,'Times New Roman',serif;color:#5C626C;"><a href="https://vasija.app" style="color:#5C626C;">vasija.app</a></p>
    </div>
  </body>
</html>`;
  return { texto, html: cuerpo };
}

async function enviarConfirmacion(env: Env, email: string, nombre: string | null): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const { texto: text, html: cuerpo } = confirmacion(nombre);
  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        reply_to: RESPONDER_A,
        subject: 'Ya estás en la lista de Vasija',
        text,
        html: cuerpo,
      }),
    });
    if (!respuesta.ok) console.error(`lista: Resend answered ${respuesta.status}`);
  } catch {
    console.error('lista: the confirmation email could not be sent');
  }
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context;
  let json = true;
  try {
    const leido = await leer(request);
    json = leido.json;
    const { datos } = leido;

    if (datos.botcheck) return responder(request, json, true, 200);

    const email = texto(datos.email, 254)?.toLowerCase() ?? '';
    if (!EMAIL.test(email)) return responder(request, json, false, 400);

    const nombre = texto(datos.name, 80);
    const experienciaLeida = texto(datos.experiencia, 40);
    const experiencia = experienciaLeida && EXPERIENCIAS.has(experienciaLeida) ? experienciaLeida : null;
    const origen = texto(datos.origen, 200);

    const alta = await env.DB.prepare(
      `INSERT INTO lista_espera (email, nombre, experiencia, origen) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(email) DO NOTHING`,
    )
      .bind(email, nombre, experiencia, origen)
      .run();

    if ((alta.meta?.changes ?? 0) > 0) {
      // waitUntil keeps its context: called unbound it throws.
      context.waitUntil(enviarConfirmacion(env, email, nombre));
    } else {
      await env.DB.prepare(
        `UPDATE lista_espera SET
           nombre = COALESCE(nombre, ?2),
           experiencia = COALESCE(?3, experiencia)
         WHERE email = ?1`,
      )
        .bind(email, nombre, experiencia)
        .run();
    }

    return responder(request, json, true, 200);
  } catch {
    // No details in the log: they could include the person's data.
    console.error('lista: the signup could not be saved');
    return responder(request, json, false, 500);
  }
}
