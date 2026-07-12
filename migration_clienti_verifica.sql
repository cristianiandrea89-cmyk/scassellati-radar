-- Aggiunge la gestione "da verificare" ai clienti, sul modello già usato per i marchi:
-- i clienti creati al volo da un venditore (nome digitato non presente in elenco)
-- entrano come non verificati, in attesa di conferma/uniformazione in /clienti-verifica.
-- I clienti già presenti (import iniziale + eventuali già inseriti) restano verificati
-- di default, grazie al "default true".

alter table clienti add column if not exists verificato boolean not null default true;
alter table clienti add column if not exists creato_da text;

comment on column clienti.verificato is 'false per i clienti creati al volo da un venditore nel form macchina (in attesa di conferma/uniformazione nome in /clienti-verifica); true per quelli già noti (import iniziale) o confermati';
comment on column clienti.creato_da is 'Nome del venditore che ha creato il cliente da form (null per i clienti importati inizialmente)';

create index if not exists idx_clienti_verificato on clienti (verificato);
