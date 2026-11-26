# vasija.app

Sitio de **Vasija - Crecimiento personal inspirado en la Kabbalah**, la app de delbueno SAS con el método y los textos
de Kevin Jakter. Astro estático en Cloudflare Pages, en español rioplatense.

| Ruta              | Qué es                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| `/`               | Landing con la lista de espera                                                       |
| `/privacidad/`    | Política de privacidad (la piden App Store y Google Play)                            |
| `/soporte/`       | Soporte (URL de soporte de las tiendas)                                              |
| `/borrar-cuenta/` | Cómo borrar la cuenta (la pide Google Play)                                          |
| `/og.png`         | Tarjeta para redes, generada en el build (`src/og.ts`)                               |
| `/api/lista`      | Función que guarda a quien se anota en la lista de espera (`functions/api/lista.ts`) |

## Comandos

```bash
npm install
npm run dev        # http://localhost:4321 (sin la función de la lista)
npm run verify     # formato, tipos, build, copy, CSP y SEO: lo mismo que tiene que pasar antes de publicar
```

Para probar la lista de espera en local, con una base de prueba:

```bash
npm run build
npx wrangler d1 migrations apply vasija-lista --local
npx wrangler pages dev dist
```

## Publicación

Cloudflare Pages, proyecto `vasija-web`, conectado a este repo: cada push a `main` se publica en https://vasija.app.
Build: `npm run build`, salida `dist`, Node 24 (`.nvmrc`). Las ramas generan vistas previas en `*.vasija-web.pages.dev`.

- `npm run build` también escribe `dist/_headers` con la Content-Security-Policy de `security/csp.json` y los
  encabezados de seguridad (`scripts/build-headers.mjs`).
- `wrangler.toml` define el binding `DB` a la base D1 `vasija-lista`.

## Lista de espera

Cada persona que se anota queda en la tabla `lista_espera` de la base D1 `vasija-lista` (cuenta de Cloudflare):
email (único), nombre, si ya hizo algo con Kevin, origen (utm o referrer) y fecha.

- **Verla:** Cloudflare → Storage & Databases → D1 → `vasija-lista` → Explore Data → `lista_espera`.
- **Exportarla:** desde la consola de D1, `SELECT * FROM lista_espera ORDER BY creado;` y descargar el resultado, o
  `npx wrangler d1 export vasija-lista --remote --table lista_espera --output lista.sql`.
- **Sacar a alguien que lo pide:** `DELETE FROM lista_espera WHERE email = 'persona@correo.com';`
- Cambios en la tabla: un archivo nuevo en `migrations/` y `npx wrangler d1 migrations apply vasija-lista --remote`.

La primera vez que alguien se anota, la función le manda un mail de confirmación con Resend (dominio `send.vasija.app`,
remitente `hola@send.vasija.app`, respuestas a `hola@vasija.app`). Necesita el secreto `RESEND_API_KEY` en Cloudflare
Pages (Settings → Variables and secrets, tipo Secret, en Production y Preview). Sin el secreto, se guarda igual y no se
manda nada. Si alguien se anota dos veces, no recibe otro mail.

La función nunca escribe el email ni el nombre en los logs.

## Reglas del contenido

- Vasija es **crecimiento personal inspirado en la Kabbalah**: la Kabbalah aparece como inspiración, no como lo que
  la app es. Nada de "Dios", "Creador", "mística" ni "judaísmo".
- En las tiendas: "Vasija: crecimiento personal", subtítulo "Inspirado en la Kabbalah".
- **El link al pack de Kevin en Gumroad va solo en la web, nunca en la app** (App Store y Google Play no permiten
  mandar a compras afuera desde la app).
- Sin rayas (— –) ni puntos medios en el copy (`npm run lint:copy`), y nunca la palabra "ensure".
- Testimonios: solo reales (`TESTIMONIOS` en `src/vasija.ts`); la sección no aparece mientras esté vacía.
- Las fotos son de Unsplash (licencia libre); las pantallas de `public/pantallas/` son capturas reales de la app.
