-- Rende macchine_installate.origine sempre coerente con il marchio collegato,
-- invece di un valore fisso scelto una volta sola al momento dell'inserimento.
-- Serve per gestire correttamente futuri cambi di origine di un marchio
-- (es. un accordo di distribuzione che rende "nostro" un marchio prima concorrenza).

-- 1. Ad ogni insert/update di marchio_id, ricalcola origine dal marchio collegato
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

-- 2. Quando un marchio cambia origine, propaga il cambiamento a tutte le macchine
--    già collegate a quel marchio
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

-- 3. Corregge subito eventuali righe già disallineate nel database esistente
update macchine_installate mi
set origine = case when m.origine = 'nostro' then 'nostra' else 'concorrenza' end
from marchi m
where m.id = mi.marchio_id
  and mi.origine is distinct from (case when m.origine = 'nostro' then 'nostra' else 'concorrenza' end);
