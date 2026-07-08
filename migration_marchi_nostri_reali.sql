-- Allinea la tabella marchi ai marchi reali rappresentati da Scassellati.
-- Esegui questo file UNA VOLTA SOLA, dopo aver già eseguito migration_marchi.sql.

-- Emco e Tornos erano stati precaricati per errore come marchi "concorrenza"
-- (facevano parte di un elenco generico di partenza): sono in realtà marchi
-- rappresentati da Scassellati (Tornitura).
update marchi set origine = 'nostro', verificato = true
where lower(nome) in (lower('Emco'), lower('Tornos'));

-- Rinomina marchi nostri già presenti, solo correzione del nome
update marchi set nome = 'LVD' where lower(nome) = lower('LVD Group');
update marchi set nome = 'Ficep' where lower(nome) = lower('Ficep Group');

-- DN Solutions è concorrenza (non un nostro marchio come inserito per errore iniziale)
update marchi set origine = 'concorrenza', verificato = true where lower(nome) = lower('DN Solutions');

-- DN Solutions è il nuovo nome (rebranding) di Doosan Machine Tools: stesso marchio,
-- non due concorrenti distinti. Spostiamo eventuali macchine già collegate a "Doosan"
-- sul marchio "DN Solutions" ed eliminiamo il duplicato.
update macchine_installate
set marchio_id = (select id from marchi where lower(nome) = lower('DN Solutions'))
where marchio_id = (select id from marchi where lower(nome) = lower('Doosan'));

delete from marchi where lower(nome) = lower('Doosan');

-- Aggiunge i marchi nostri mancanti
insert into marchi (nome, origine, verificato) values
  ('United Machining', 'nostro', true),
  ('Belotti', 'nostro', true),
  ('Pama', 'nostro', true),
  ('Top Automazioni', 'nostro', true),
  ('Fenix', 'nostro', true),
  ('Mar', 'nostro', true),
  ('Bianco', 'nostro', true),
  ('Riboni', 'nostro', true),
  ('Hexagon', 'nostro', true),
  ('Vero Project Group', 'nostro', true)
on conflict (lower(nome)) do nothing;

-- Rimuove il marchio di test creato durante le verifiche di questa sessione
-- (si cancella solo se non è collegato a nessuna macchina, per sicurezza)
delete from marchi
where lower(nome) = lower('MAZAK ITALIA test merge')
  and not exists (select 1 from macchine_installate where marchio_id = marchi.id);
