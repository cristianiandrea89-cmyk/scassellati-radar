// I marchi (nostri e concorrenza) vivono ora nella tabella Supabase "marchi",
// vedi src/lib/marchi.js — niente più elenco statico qui.

// Venditori/agenti: elenco chiuso per il menu "Il tuo nome", niente testo libero
// per evitare refusi (es. "Andrea Cristiani" scritto in modi diversi).
export const VENDITORI = [
  'Giampiero Scassellati',
  'Patrizio Tirelli',
  'Americo Tramentozzi',
  'Claudio Cristiani',
  'Andrea Cristiani',
]

// Taxonomy categorie macchina, coerente con la sezione "Soluzioni" del sito Scassellati
export const CATEGORIE_MACCHINA = [
  'Fresatura',
  'Tornitura',
  'Fantina mobile',
  'Piegatrici',
  'Punzonatrici',
  'Taglio laser',
  'Taglio ad acqua',
  'Foratura e taglio piastre',
  'Metrologia',
  'Software',
  'Presse meccaniche',
]

export const ORIGINI_MACCHINA = [
  { value: 'nostra', label: 'Nostra' },
  { value: 'concorrenza', label: 'Concorrenza' },
]

export const STATI_MACCHINA = [
  { value: 'attiva', label: 'Attiva' },
  { value: 'da_sostituire', label: 'Da sostituire' },
  { value: 'sconosciuto', label: 'Sconosciuto' },
]

// Zona commerciale: operatività principale su Lazio e Umbria, granularità a livello
// di provincia (lo standard per definire zone/territori commerciali). Elenco chiuso
// per evitare incoerenze ("Roma"/"roma"/"RM") tra venditori diversi.
export const ZONE_COMMERCIALI = [
  'Roma',
  'Viterbo',
  'Rieti',
  'Latina',
  'Frosinone',
  'Perugia',
  'Terni',
]

// Anni disponibili per "Anno di installazione", dal più recente al 2000 (in ordine
// decrescente perché le macchine inserite sono più spesso recenti).
const ANNO_CORRENTE = new Date().getFullYear()
export const ANNI_MACCHINA = Array.from(
  { length: ANNO_CORRENTE - 2000 + 1 },
  (_, i) => ANNO_CORRENTE - i
)
