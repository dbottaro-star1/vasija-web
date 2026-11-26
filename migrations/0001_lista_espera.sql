-- Waitlist of vasija.app (D1 database "vasija-lista", binding DB). One row per email.
CREATE TABLE IF NOT EXISTS lista_espera (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  experiencia TEXT,
  origen TEXT,
  creado TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);
