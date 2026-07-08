-- Migrazione: introduce la tabella "marchi" normalizzata e converte
-- macchine_installate.marchio (testo libero) in macchine_installate.marchio_id (foreign key).
--
-- Esegui questo file UNA VOLTA SOLA sul progetto Supabase che hai già usato con lo
-- schema.sql originale (quello senza tabella marchi). Se stai partendo da un progetto
-- Supabase nuovo, non serve: usa direttamente schema.sql aggiornato.

-- ============================================================
-- 1. Crea la tabella marchi
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

-- ============================================================
-- 2. Precarica i marchi ufficiali (nostri + concorrenza di partenza)
-- ============================================================
insert into marchi (nome, origine, verificato) values
  ('Biglia', 'nostro', true),
  ('DN Solutions', 'nostro', true),
  ('MCM', 'nostro', true),
  ('LVD Group', 'nostro', true),
  ('Flow', 'nostro', true),
  ('Ficep Group', 'nostro', true),
  ('Pressix', 'nostro', true),
  ('Mazak', 'concorrenza', true),
  ('DMG MORI', 'concorrenza', true),
  ('Okuma', 'concorrenza', true),
  ('Haas', 'concorrenza', true),
  ('Doosan', 'concorrenza', true),
  ('Gildemeister', 'concorrenza', true),
  ('Nakamura-Tome', 'concorrenza', true),
  ('Tornos', 'concorrenza', true),
  ('Star Micronics', 'concorrenza', true),
  ('Citizen', 'concorrenza', true),
  ('Index', 'concorrenza', true),
  ('Traub', 'concorrenza', true),
  ('Emco', 'concorrenza', true),
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
-- 3. Aggiungi la colonna marchio_id (nullable per ora, la valorizziamo subito dopo)
-- ============================================================
alter table macchine_installate add column if not exists marchio_id uuid references marchi (id);

-- ============================================================
-- 4. Crea in "marchi" i marchi già usati in macchine_installate ma non ancora presenti
--    (es. marchi concorrenza scritti a testo libero prima di questa migrazione)
-- ============================================================
insert into marchi (nome, origine, verificato, creato_da)
select distinct on (lower(trim(mi.marchio)))
  trim(mi.marchio) as nome,
  case when mi.origine = 'nostra' then 'nostro' else 'concorrenza' end as origine,
  false as verificato,
  mi.inserito_da as creato_da
from macchine_installate mi
where mi.marchio is not null
  and not exists (
    select 1 from marchi m where lower(m.nome) = lower(trim(mi.marchio))
  )
on conflict (lower(nome)) do nothing;

-- ============================================================
-- 5. Collega ogni riga macchina al marchio corrispondente (match case-insensitive)
-- ============================================================
update macchine_installate mi
set marchio_id = m.id
from marchi m
where lower(m.nome) = lower(trim(mi.marchio))
  and mi.marchio_id is null;

-- ============================================================
-- 6. Rendi marchio_id obbligatorio e rimuovi la vecchia colonna testo libero
-- ============================================================
alter table macchine_installate alter column marchio_id set not null;
alter table macchine_installate drop column if exists marchio;

create index if not exists idx_macchine_marchio on macchine_installate (marchio_id);

-- ============================================================
-- 7. RLS per la nuova tabella marchi (accesso libero, coerente col resto dell'app)
-- ============================================================
alter table marchi enable row level security;

drop policy if exists "marchi_select_all" on marchi;
create policy "marchi_select_all" on marchi for select using (true);
drop policy if exists "marchi_insert_all" on marchi;
create policy "marchi_insert_all" on marchi for insert with check (true);
drop policy if exists "marchi_update_all" on marchi;
create policy "marchi_update_all" on marchi for update using (true);
drop policy if exists "marchi_delete_all" on marchi;
create policy "marchi_delete_all" on marchi for delete using (true);
