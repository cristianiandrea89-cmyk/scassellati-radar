-- Schema Supabase — Dashboard Mappatura Macchine Installate (Scassellati)
-- Esegui questo file nell'SQL Editor di Supabase (Project > SQL Editor > New query).
-- Nessun sistema di auth/login: RLS aperta in lettura/scrittura per tutti (accesso libero all'app).
--
-- NOTA: se hai già eseguito una versione precedente di questo schema (senza la tabella
-- marchi) su un progetto esistente, NON rieseguire questo file da capo: usa invece
-- migration_marchi.sql, pensato apposta per aggiornare un database già popolato.

-- ============================================================
-- CLIENTI
-- ============================================================
create table if not exists clienti (
  id uuid primary key default gen_random_uuid(),
  ragione_sociale text not null,
  indirizzo text,
  lat double precision,
  lng double precision,
  settore text,
  zona_commerciale text,
  referente_nome text,
  referente_ruolo text,
  referente_contatti text,
  agente text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table clienti is 'Anagrafica clienti presso cui sono installate macchine (nostre o concorrenza)';
comment on column clienti.lat is 'Latitudine, ottenuta via geocoding dell''indirizzo (Nominatim/OpenStreetMap)';
comment on column clienti.lng is 'Longitudine, ottenuta via geocoding dell''indirizzo (Nominatim/OpenStreetMap)';
comment on column clienti.agente is 'Nome dell''agente/venditore di riferimento per questo cliente — uno dei 5 nomi fissi (vedi VENDITORI in constants.js), scelto da un menu a tendina, non testo libero';

create index if not exists idx_clienti_ragione_sociale on clienti using gin (to_tsvector('simple', ragione_sociale));
create index if not exists idx_clienti_agente on clienti (agente);
create index if not exists idx_clienti_zona on clienti (zona_commerciale);

-- ============================================================
-- SEDI (opzionale — un cliente può avere più stabilimenti)
-- ============================================================
create table if not exists sedi (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clienti (id) on delete cascade,
  nome text,
  indirizzo text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table sedi is 'Stabilimenti/sedi secondarie di un cliente, ciascuna con proprio indirizzo geocodificato';

create index if not exists idx_sedi_cliente on sedi (cliente_id);

-- ============================================================
-- MARCHI (anagrafica normalizzata, nostri e concorrenza)
-- ============================================================
create table if not exists marchi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  origine text not null check (origine in ('nostro', 'concorrenza')),
  verificato boolean not null default false,
  creato_da text,
  creato_il timestamptz not null default now()
);

comment on table marchi is 'Anagrafica marchi normalizzata: evita duplicati tipo "Biglia"/"BIGLIA SPA" inseriti liberamente dai venditori';
comment on column marchi.verificato is 'true = marchio ufficiale o già confermato da revisione; false = inserito da un venditore, in attesa di conferma su /marchi';
comment on column marchi.creato_da is 'Nome del venditore che ha inserito il marchio (null per i marchi precaricati)';

create unique index if not exists idx_marchi_nome_unique on marchi (lower(nome));
create index if not exists idx_marchi_origine on marchi (origine);
create index if not exists idx_marchi_verificato on marchi (verificato);

insert into marchi (nome, origine, verificato) values
  ('Biglia', 'nostro', true),
  ('MCM', 'nostro', true),
  ('LVD', 'nostro', true),
  ('Flow', 'nostro', true),
  ('Ficep', 'nostro', true),
  ('Pressix', 'nostro', true),
  ('United Machining', 'nostro', true),
  ('Emco', 'nostro', true),
  ('Belotti', 'nostro', true),
  ('Pama', 'nostro', true),
  ('Tornos', 'nostro', true),
  ('Top Automazioni', 'nostro', true),
  ('Fenix', 'nostro', true),
  ('Mar', 'nostro', true),
  ('Bianco', 'nostro', true),
  ('Riboni', 'nostro', true),
  ('Hexagon', 'nostro', true),
  ('Vero Project Group', 'nostro', true),
  ('Mazak', 'concorrenza', true),
  ('DMG MORI', 'concorrenza', true),
  ('Okuma', 'concorrenza', true),
  ('Haas', 'concorrenza', true),
  ('DN Solutions', 'concorrenza', true),
  ('Gildemeister', 'concorrenza', true),
  ('Nakamura-Tome', 'concorrenza', true),
  ('Star Micronics', 'concorrenza', true),
  ('Citizen', 'concorrenza', true),
  ('Index', 'concorrenza', true),
  ('Traub', 'concorrenza', true),
  ('Hurco', 'concorrenza', true),
  ('Fidia', 'concorrenza', true),
  ('Breton', 'concorrenza', true),
  ('FPT Industrie', 'concorrenza', true),
  ('Jobs', 'concorrenza', true),
  ('Sachman', 'concorrenza', true),
  ('Mikron', 'concorrenza', true),
  ('Hermle', 'concorrenza', true),
  ('Grob', 'concorrenza', true),
  ('Makino', 'concorrenza', true),
  ('Trumpf', 'concorrenza', true),
  ('Bystronic', 'concorrenza', true),
  ('Amada', 'concorrenza', true),
  ('Salvagnini', 'concorrenza', true),
  ('Prima Power', 'concorrenza', true),
  ('Cidan', 'concorrenza', true),
  ('Gasparini', 'concorrenza', true),
  ('Baykal', 'concorrenza', true),
  ('Ermaksan', 'concorrenza', true),
  ('Euromac', 'concorrenza', true),
  ('Finn-Power', 'concorrenza', true),
  ('Flow Waterjet', 'concorrenza', true),
  ('Techni Waterjet', 'concorrenza', true),
  ('Omax', 'concorrenza', true),
  ('KMT Waterjet', 'concorrenza', true),
  ('CMS', 'concorrenza', true),
  ('Kaltenbach', 'concorrenza', true),
  ('Voortman', 'concorrenza', true),
  ('Peddinghaus', 'concorrenza', true),
  ('Zeiss', 'concorrenza', true),
  ('Mitutoyo', 'concorrenza', true),
  ('Renishaw', 'concorrenza', true),
  ('Wenzel', 'concorrenza', true),
  ('Marposs', 'concorrenza', true),
  ('Faro', 'concorrenza', true)
on conflict (lower(nome)) do nothing;

-- ============================================================
-- MACCHINE INSTALLATE
-- ============================================================
create table if not exists macchine_installate (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clienti (id) on delete cascade,
  sede_id uuid references sedi (id) on delete set null,

  origine text not null check (origine in ('nostra', 'concorrenza')),
  marchio_id uuid not null references marchi (id),
  categoria text not null,
  modello text,
  anno_installazione integer,
  stato text not null default 'sconosciuto' check (stato in ('attiva', 'da_sostituire', 'sconosciuto')),
  note text,
  foto_url text,

  inserito_da text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table macchine_installate is 'Macchine installate presso i clienti, nostre o della concorrenza';
comment on column macchine_installate.origine is 'Derivata automaticamente da marchi.origine tramite trigger (trg_macchine_sync_origine): nostra = uno dei marchi Scassellati, concorrenza = marchio terzo. Non impostare a mano: qualsiasi valore inviato viene sovrascritto in base al marchio_id collegato.';
comment on column macchine_installate.marchio_id is 'Riferimento alla tabella marchi (anagrafica normalizzata, niente più testo libero)';
comment on column macchine_installate.categoria is 'Taxonomy dal sito Scassellati: Fresatura, Tornitura, Fantina mobile, Piegatrici, Punzonatrici, Taglio laser, Taglio ad acqua, Foratura e taglio piastre, Metrologia, Software, Presse meccaniche';
comment on column macchine_installate.inserito_da is 'Nome del venditore/agente che ha inserito o aggiornato per ultimo il dato (no auth, solo tracciamento)';
comment on column macchine_installate.foto_url is 'URL pubblico del file su Supabase Storage (bucket macchine-foto)';

create index if not exists idx_macchine_cliente on macchine_installate (cliente_id);
create index if not exists idx_macchine_origine on macchine_installate (origine);
create index if not exists idx_macchine_marchio on macchine_installate (marchio_id);
create index if not exists idx_macchine_categoria on macchine_installate (categoria);

-- ============================================================
-- Trigger: aggiorna updated_at automaticamente
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clienti_updated_at on clienti;
create trigger trg_clienti_updated_at
  before update on clienti
  for each row execute function set_updated_at();

drop trigger if exists trg_sedi_updated_at on sedi;
create trigger trg_sedi_updated_at
  before update on sedi
  for each row execute function set_updated_at();

drop trigger if exists trg_macchine_updated_at on macchine_installate;
create trigger trg_macchine_updated_at
  before update on macchine_installate
  for each row execute function set_updated_at();

-- ============================================================
-- Trigger: origine macchina derivata dal marchio collegato (mai un valore fisso)
-- ============================================================

-- Ad ogni insert/update di marchio_id, ricalcola origine dal marchio collegato:
-- così l'app non può mai salvare un'origine incoerente con il marchio scelto.
create or replace function sync_origine_da_marchio()
returns trigger as $$
begin
  select case when m.origine = 'nostro' then 'nostra' else 'concorrenza' end
  into new.origine
  from marchi m
  where m.id = new.marchio_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_macchine_sync_origine on macchine_installate;
create trigger trg_macchine_sync_origine
  before insert or update of marchio_id on macchine_installate
  for each row execute function sync_origine_da_marchio();

-- Quando un marchio cambia origine (es. un accordo di distribuzione cambia da
-- concorrenza a nostro), propaga il cambiamento a tutte le macchine già collegate.
create or replace function cascata_origine_marchio()
returns trigger as $$
begin
  if new.origine is distinct from old.origine then
    update macchine_installate
    set origine = case when new.origine = 'nostro' then 'nostra' else 'concorrenza' end
    where marchio_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_marchi_cascata_origine on marchi;
create trigger trg_marchi_cascata_origine
  after update of origine on marchi
  for each row execute function cascata_origine_marchio();

-- ============================================================
-- Row Level Security — accesso libero (nessun login), come da CLAUDE.md
-- ============================================================
alter table clienti enable row level security;
alter table sedi enable row level security;
alter table marchi enable row level security;
alter table macchine_installate enable row level security;

drop policy if exists "clienti_select_all" on clienti;
create policy "clienti_select_all" on clienti for select using (true);
drop policy if exists "clienti_insert_all" on clienti;
create policy "clienti_insert_all" on clienti for insert with check (true);
drop policy if exists "clienti_update_all" on clienti;
create policy "clienti_update_all" on clienti for update using (true);
drop policy if exists "clienti_delete_all" on clienti;
create policy "clienti_delete_all" on clienti for delete using (true);

drop policy if exists "sedi_select_all" on sedi;
create policy "sedi_select_all" on sedi for select using (true);
drop policy if exists "sedi_insert_all" on sedi;
create policy "sedi_insert_all" on sedi for insert with check (true);
drop policy if exists "sedi_update_all" on sedi;
create policy "sedi_update_all" on sedi for update using (true);

drop policy if exists "marchi_select_all" on marchi;
create policy "marchi_select_all" on marchi for select using (true);
drop policy if exists "marchi_insert_all" on marchi;
create policy "marchi_insert_all" on marchi for insert with check (true);
drop policy if exists "marchi_update_all" on marchi;
create policy "marchi_update_all" on marchi for update using (true);
drop policy if exists "marchi_delete_all" on marchi;
create policy "marchi_delete_all" on marchi for delete using (true);

drop policy if exists "macchine_select_all" on macchine_installate;
create policy "macchine_select_all" on macchine_installate for select using (true);
drop policy if exists "macchine_insert_all" on macchine_installate;
create policy "macchine_insert_all" on macchine_installate for insert with check (true);
drop policy if exists "macchine_update_all" on macchine_installate;
create policy "macchine_update_all" on macchine_installate for update using (true);
drop policy if exists "macchine_delete_all" on macchine_installate;
create policy "macchine_delete_all" on macchine_installate for delete using (true);

-- ============================================================
-- Storage bucket per le foto delle macchine
-- ============================================================
insert into storage.buckets (id, name, public)
values ('macchine-foto', 'macchine-foto', true)
on conflict (id) do nothing;

drop policy if exists "macchine_foto_public_read" on storage.objects;
create policy "macchine_foto_public_read" on storage.objects
  for select using (bucket_id = 'macchine-foto');

drop policy if exists "macchine_foto_public_upload" on storage.objects;
create policy "macchine_foto_public_upload" on storage.objects
  for insert with check (bucket_id = 'macchine-foto');
