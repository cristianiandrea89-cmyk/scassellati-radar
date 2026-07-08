-- Separa la categoria unica "Tornitura & fantina mobile" in due voci distinte:
-- "Tornitura" e "Fantina mobile" (vedi src/lib/constants.js).
--
-- Le macchine già inserite con la vecchia categoria combinata vengono spostate su
-- "Tornitura" di default: se qualcuna era in realtà una fantina mobile, va corretta
-- a mano dalla Scheda cliente dopo la migrazione.

update macchine_installate
set categoria = 'Tornitura'
where categoria = 'Tornitura & fantina mobile';
