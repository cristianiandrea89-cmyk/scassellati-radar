# Scassellati Radar — Dashboard Mappatura Macchine Installate

## Obiettivo del progetto
Dashboard web interna a F. Scassellati srl, consultabile da tutta l'azienda, che mostra
le macchine installate presso i clienti — sia macchine nostre (nostri marchi) sia macchine
della concorrenza. Serve a dare visibilità commerciale su dove sono installate le nostre
macchine e dove invece ci sono macchine concorrenti (= potenziali opportunità di sostituzione).

Non è un CRM completo: è un tool verticale, semplice, focalizzato solo su "chi ha cosa,
dove". Il CRM vero e proprio è un progetto separato (Blueprint_CRM_Mago4_Scassellati).

## Utenti
- **Rete vendita**: inserisce e aggiorna i dati, anche da mobile quando è dal cliente.
- **Resto dell'azienda** (management, marketing, backoffice): sola consultazione, da desktop.

Un'unica web app responsive, non due prodotti separati. Nessuna app nativa.

## Stack tecnico
- **Frontend**: React
- **Backend/DB**: Supabase (Postgres + Auth + Storage per foto)
- **Mappa**: OpenStreetMap — Leaflet per la visualizzazione, Nominatim per il geocoding degli
  indirizzi (autocomplete e coordinate). Nessuna API key richiesta. Da rivalutare in futuro
  il passaggio a Google Maps se servisse maggiore precisione/qualità dei dati.
- **Deploy**: Vercel (stesso hosting già usato per il sito Scassellati)
- **Auth**: nessun login/password. Accesso libero all'app: mappa, tabella e schede cliente
  sono consultabili subito, senza nessuna richiesta all'apertura. Il nome viene chiesto solo
  al momento di salvare una macchina (form di inserimento/modifica): se non è già presente
  un nome in localStorage, il form mostra un campo inline "Il tuo nome" (testo libero, con
  autocomplete sui nomi già usati in precedenza, ricavati dai valori distinti del campo
  "inserito da" su Supabase) — serve solo a tracciare "chi ha inserito/aggiornato il dato",
  non a limitare l'accesso. Una volta inserito, il nome viene salvato in locale (localStorage)
  e riusato automaticamente per i salvataggi successivi su quel dispositivo, senza richiederlo
  di nuovo. Vicino al campo (quando il nome è già noto) c'è un link "Non sei [nome]? Cambia"
  per correggerlo, utile se un collega usa lo stesso dispositivo.

## Modello dati (entità principali)

### Cliente
- Ragione sociale
- Indirizzo (per geocoding → lat/lng)
- Settore / zona commerciale
- Referente (nome, ruolo, contatti — opzionale)
- Agente/venditore di riferimento

### Sede (opzionale, se il cliente ha più stabilimenti)
- Collegata a Cliente
- Indirizzo proprio

### Marchio (anagrafica normalizzata, tabella separata "marchi")
- Nome, origine (nostro / concorrenza), verificato (bool), creato da / il
- Nostri marchi precaricati e verificati: Biglia, DN Solutions, MCM, LVD Group, Flow,
  Ficep Group, Pressix
- Marchi concorrenza precaricati e verificati (elenco di partenza, ampliabile)
- Nuovi marchi concorrenza inseriti da un venditore nel form (combobox con autocomplete
  + "aggiungi nuovo") entrano come **non verificati**: subito utilizzabili da tutti, ma
  in attesa di conferma/correzione in una sezione di revisione dedicata (`/marchi`,
  raggiungibile solo da un link secondario in navbar, non in evidenza) — evita duplicati
  tipo "Biglia"/"BIGLIA SPA" nati da grafie diverse tra venditori

### Macchina installata
- Collegata a Cliente (o Sede)
- **Origine**: nostra / concorrenza
- **Marchio**: riferimento alla tabella marchi (non più testo libero)
- **Categoria macchina** (taxonomy dal sito Scassellati, sezione Soluzioni):
  - Asportazione truciolo → Fresatura / Tornitura & fantina mobile
  - Lamiera → Piegatrici / Punzonatrici / Taglio laser / Taglio ad acqua / Foratura e taglio piastre
  - Metrologia
  - Software
  - Presse meccaniche
- Modello (testo libero)
- Anno di acquisto/installazione (se noto, anche approssimativo)
- Stato: attiva / da sostituire / sconosciuto
- Note libere (es. "macchina vecchia, cliente valuta sostituzione entro 12 mesi")
- Foto (opzionale, upload da mobile)
- Fonte del dato (nome venditore che ha inserito/aggiornato)
- Data ultimo aggiornamento (automatica)

## Viste MVP

1. **Mappa clienti**
   - Pin per ogni cliente geocodificato
   - Colore pin: verde = solo macchine nostre, rosso = solo concorrenza, giallo = miste
   - Click su pin → mini scheda cliente con elenco macchine

2. **Tabella/lista filtrabile**
   - Filtri: marchio, categoria macchina, zona/agente, origine (nostra/concorrenza)
   - Ricerca per nome cliente

3. **Scheda cliente**
   - Dati anagrafici cliente
   - Elenco macchine installate (con possibilità di aggiungere/modificare)

4. **Form inserimento/modifica macchina**
   - Ottimizzato per mobile (uso sul campo)
   - Campi minimi obbligatori: cliente, origine, marchio, categoria; il resto opzionale

## Fuori scope per l'MVP (da valutare in fasi successive)
- Integrazione con Mago4/Zucchetti
- Report/analytics avanzati (es. trend sostituzioni, valore parco macchine)
- Notifiche automatiche
- Import massivo da Excel (si può aggiungere dopo, ma non è priorità 1)
- Gestione permessi granulare per zona/agente (per ora: tutti vedono tutto, solo editor autenticati modificano)

## Note di stile/coerenza
- Naming e categorie macchina devono restare coerenti con la sezione "Soluzioni" del sito
  Scassellati (scassellati-web.vercel.app), così i venditori riconoscono subito i nomi.
- Priorità: semplicità d'uso sul campo > completezza dei dati. Meglio un dato inserito
  in 30 secondi che un form con 20 campi che nessuno compila.
