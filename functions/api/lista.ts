/**
 * POST /api/lista: adds a person to the waitlist (Cloudflare Pages Function, D1 binding DB, table in
 * migrations/0001_lista_espera.sql) and sends them a confirmation email through Resend.
 *
 * - With scripts, src/scripts/lista.ts posts JSON and gets JSON back ({ success }).
 * - Without scripts, the browser posts the form and gets a 303 back to /?enviado=1#lista (or ?error=1).
 * - The email is the key: signing up twice keeps one row, fills in what was missing and sends nothing new.
 * - `botcheck` is a honeypot hidden from people: if it comes checked, we answer success and store nothing.
 * - The confirmation (src/correo/confirmacion.ts) goes out only on the first signup, from hola@send.vasija.app (Resend domain send.vasija.app)
 *   with replies to hola@vasija.app. It needs the secret RESEND_API_KEY (Cloudflare Pages, Settings, Variables and
 *   secrets); without it the signup is stored and no email is sent.
 * Nothing here logs the email or the name.
 */

import { confirmacion } from '../../src/correo/confirmacion';

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
const REMITENTE = '"Vasija - Crecimiento personal" <hola@send.vasija.app>';
const RESPONDER_A = 'hola@vasija.app';

const texto = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, max);
  return clean || null;
};

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

async function enviarConfirmacion(env: Env, email: string, nombre: string | null): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const { asunto, texto: text, html: cuerpo } = confirmacion(nombre);
  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        reply_to: RESPONDER_A,
        subject: asunto,
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
