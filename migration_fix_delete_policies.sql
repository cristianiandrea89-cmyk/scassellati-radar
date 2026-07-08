-- Bug corretto: mancavano le policy RLS di DELETE su clienti e macchine_installate.
-- Effetto pratico: il pulsante "Elimina macchina" nella Scheda cliente non restituiva
-- errore, ma non cancellava davvero la riga sul database (Postgres/RLS filtra in
-- silenzio le righe senza una policy di delete che le autorizzi) — alla ricarica
-- della pagina la macchina "eliminata" ricompariva.

drop policy if exists "clienti_delete_all" on clienti;
create policy "clienti_delete_all" on clienti for delete using (true);

drop policy if exists "macchine_delete_all" on macchine_installate;
create policy "macchine_delete_all" on macchine_installate for delete using (true);
