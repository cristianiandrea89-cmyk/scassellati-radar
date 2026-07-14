import { supabase } from './supabaseClient'

export async function fetchMacchineDashboard() {
  const { data, error } = await supabase
    .from('macchine_installate')
    .select(
      'id, origine, categoria, stato, cliente_id, marchio_id, marchi(nome), clienti(ragione_sociale, indirizzo, zona_commerciale, agente)'
    )
  if (error) throw error
  return data || []
}

export function filtraMacchine(macchine, filtri) {
  return macchine.filter((m) => {
    if (filtri.origine !== 'tutte' && m.origine !== filtri.origine) return false
    if (filtri.marchioIds.length && !filtri.marchioIds.includes(m.marchio_id)) return false
    if (filtri.categorie.length && !filtri.categorie.includes(m.categoria)) return false
    if (filtri.stati.length && !filtri.stati.includes(m.stato)) return false
    if (filtri.zona && m.clienti?.zona_commerciale !== filtri.zona) return false
    if (filtri.agente && m.clienti?.agente !== filtri.agente) return false
    return true
  })
}

export function calcolaKpi(macchine) {
  const totaleMacchine = macchine.length
  const totaleClienti = new Set(macchine.map((m) => m.cliente_id)).size
  const nostre = macchine.filter((m) => m.origine === 'nostra').length
  const percentualeNostre = totaleMacchine ? Math.round((nostre / totaleMacchine) * 100) : 0
  const daSostituire = macchine.filter((m) => m.stato === 'da_sostituire').length
  return { totaleMacchine, totaleClienti, percentualeNostre, daSostituire }
}

export function distribuzioneOrigine(macchine) {
  const nostra = macchine.filter((m) => m.origine === 'nostra').length
  const concorrenza = macchine.filter((m) => m.origine === 'concorrenza').length
  return [
    { name: 'Nostra', value: nostra },
    { name: 'Concorrenza', value: concorrenza },
  ]
}

export function distribuzionePerCategoria(macchine) {
  const conteggi = {}
  macchine.forEach((m) => {
    conteggi[m.categoria] = (conteggi[m.categoria] || 0) + 1
  })
  return Object.entries(conteggi)
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count)
}

export function distribuzionePerMarchio(macchine) {
  const conteggi = {}
  macchine.forEach((m) => {
    const nome = m.marchi?.nome || 'Sconosciuto'
    conteggi[nome] = (conteggi[nome] || 0) + 1
  })
  return Object.entries(conteggi)
    .map(([marchio, count]) => ({ marchio, count }))
    .sort((a, b) => b.count - a.count)
}

export function origineByCategoria(macchine) {
  const map = {}
  macchine.forEach((m) => {
    if (!map[m.categoria]) map[m.categoria] = { categoria: m.categoria, nostra: 0, concorrenza: 0 }
    map[m.categoria][m.origine === 'nostra' ? 'nostra' : 'concorrenza'] += 1
  })
  return Object.values(map).sort((a, b) => b.nostra + b.concorrenza - (a.nostra + a.concorrenza))
}

// Estrazione best-effort della città dall'indirizzo (testo libero, digitato a mano o
// geocodificato via Nominatim): non è un dato strutturato, quindi è una stima, non una
// provincia certa.
export function estraiCitta(indirizzo) {
  if (!indirizzo) return null
  let parti = indirizzo.split(',').map((s) => s.trim()).filter(Boolean)

  const ultimo = parti[parti.length - 1]
  if (ultimo && /^(italia|italy)$/i.test(ultimo)) parti = parti.slice(0, -1)

  // Alcuni indirizzi hanno CAP e città nello stesso segmento (es. "00013 Mentana RM"):
  // meglio estrarre la città direttamente da lì che indovinare la posizione del segmento,
  // altrimenti un civico scritto come segmento a sé (es. "Via X, 19/21, 00013 Mentana RM")
  // viene scambiato per la città.
  const segmentoConCap = parti.find((p) => /^\d{4,6}\s+\S/.test(p))
  if (segmentoConCap) {
    const citta = segmentoConCap
      .replace(/^\d{4,6}\s+/, '')
      .replace(/\s+[A-Z]{2}$/, '')
      .trim()
    if (citta) return citta
  }

  const nuovoUltimo = parti[parti.length - 1]
  if (nuovoUltimo && /^\d{4,6}$/.test(nuovoUltimo)) parti = parti.slice(0, -1)

  if (parti.length === 0) return null
  if (parti.length === 1) return parti[0]
  if (parti.length === 2) return parti[1]
  return parti[parti.length - 2]
}

// Comune capoluogo (minuscolo) -> sigla provincia. Usata come ultima spiaggia quando
// l'indirizzo non riporta la sigla in modo esplicito (tipico degli indirizzi
// geocodificati via Nominatim, che spesso restituiscono solo il nome del comune).
const CAPOLUOGHI_PROVINCIA = {
  "l'aquila": 'AQ', chieti: 'CH', pescara: 'PE', teramo: 'TE',
  potenza: 'PZ', matera: 'MT',
  catanzaro: 'CZ', cosenza: 'CS', crotone: 'KR', 'reggio calabria': 'RC', 'vibo valentia': 'VV',
  napoli: 'NA', avellino: 'AV', benevento: 'BN', caserta: 'CE', salerno: 'SA',
  bologna: 'BO', ferrara: 'FE', "forlì": 'FC', modena: 'MO', parma: 'PR', piacenza: 'PC', ravenna: 'RA', 'reggio emilia': 'RE', rimini: 'RN',
  trieste: 'TS', gorizia: 'GO', pordenone: 'PN', udine: 'UD',
  roma: 'RM', frosinone: 'FR', latina: 'LT', rieti: 'RI', viterbo: 'VT',
  genova: 'GE', imperia: 'IM', 'la spezia': 'SP', savona: 'SV',
  milano: 'MI', bergamo: 'BG', brescia: 'BS', como: 'CO', cremona: 'CR', lecco: 'LC', lodi: 'LO', mantova: 'MN', monza: 'MB', pavia: 'PV', sondrio: 'SO', varese: 'VA',
  ancona: 'AN', 'ascoli piceno': 'AP', fermo: 'FM', macerata: 'MC', pesaro: 'PU',
  campobasso: 'CB', isernia: 'IS',
  torino: 'TO', alessandria: 'AL', asti: 'AT', biella: 'BI', cuneo: 'CN', novara: 'NO', verbania: 'VB', vercelli: 'VC',
  bari: 'BA', barletta: 'BT', brindisi: 'BR', foggia: 'FG', lecce: 'LE', taranto: 'TA',
  cagliari: 'CA', nuoro: 'NU', oristano: 'OR', sassari: 'SS', 'sud sardegna': 'SU',
  palermo: 'PA', agrigento: 'AG', caltanissetta: 'CL', catania: 'CT', enna: 'EN', messina: 'ME', ragusa: 'RG', siracusa: 'SR', trapani: 'TP',
  firenze: 'FI', arezzo: 'AR', grosseto: 'GR', livorno: 'LI', lucca: 'LU', massa: 'MS', pisa: 'PI', pistoia: 'PT', prato: 'PO', siena: 'SI',
  trento: 'TN', bolzano: 'BZ',
  perugia: 'PG', terni: 'TR',
  aosta: 'AO',
  venezia: 'VE', belluno: 'BL', padova: 'PD', rovigo: 'RO', treviso: 'TV', verona: 'VR', vicenza: 'VI',
}

// Estrazione best-effort della provincia dall'indirizzo (testo libero): cerca prima una
// sigla esplicita a due lettere (es. "..., FR, Italia" oppure "00013 Mentana RM"), e solo
// se non la trova prova a dedurla dal nome del comune tramite la mappa dei capoluoghi.
export function estraiProvincia(indirizzo) {
  if (!indirizzo) return null
  let parti = indirizzo.split(',').map((s) => s.trim()).filter(Boolean)

  const ultimo = parti[parti.length - 1]
  if (ultimo && /^(italia|italy)$/i.test(ultimo)) parti = parti.slice(0, -1)

  const siglaSegmento = parti.find((p) => /^[A-Z]{2}$/.test(p))
  if (siglaSegmento) return siglaSegmento

  const segmentoConCapESigla = parti.find((p) => /^\d{4,6}\s+.+\s[A-Z]{2}$/.test(p))
  if (segmentoConCapESigla) {
    const match = segmentoConCapESigla.match(/([A-Z]{2})$/)
    if (match) return match[1]
  }

  const citta = estraiCitta(indirizzo)
  if (!citta) return null
  return CAPOLUOGHI_PROVINCIA[citta.toLowerCase()] || citta
}

export function distribuzionePerProvincia(macchine) {
  const conteggi = {}
  const clientiVisti = new Set()
  macchine.forEach((m) => {
    if (clientiVisti.has(m.cliente_id)) return
    clientiVisti.add(m.cliente_id)
    const provincia = estraiProvincia(m.clienti?.indirizzo)
    if (!provincia) return
    conteggi[provincia] = (conteggi[provincia] || 0) + 1
  })
  return Object.entries(conteggi)
    .map(([provincia, count]) => ({ provincia, count }))
    .sort((a, b) => b.count - a.count)
}
