# Scassellati Radar

Dashboard interna per visualizzare le macchine installate presso i clienti (nostre e
della concorrenza). Vedi [CLAUDE.md](./CLAUDE.md) per obiettivo, modello dati e viste.

## Setup

1. Installa le dipendenze:
   ```
   npm install
   ```
2. Copia `.env.example` in `.env` e inserisci le chiavi reali:
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (da Supabase > Project Settings > API)
   - Mappa e geocoding usano OpenStreetMap (Nominatim): nessuna chiave richiesta
3. Esegui [schema.sql](./schema.sql) nell'SQL Editor di Supabase per creare le tabelle
   `clienti`, `sedi`, `macchine_installate` e il bucket di storage per le foto.
4. Avvia il server di sviluppo:
   ```
   npm run dev
   ```

## Struttura

- `src/pages` — viste principali (Mappa, Lista, Nuova macchina, Scheda cliente)
- `src/components` — componenti condivisi (navbar, bottoni, ecc.)
- `src/lib` — client Supabase e costanti di dominio (marchi, categorie, ecc.)
- `schema.sql` — schema del database da eseguire su Supabase
