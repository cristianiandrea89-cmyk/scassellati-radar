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

export function distribuzionePerCitta(macchine) {
  const conteggi = {}
  const clientiVisti = new Set()
  macchine.forEach((m) => {
    if (clientiVisti.has(m.cliente_id)) return
    clientiVisti.add(m.cliente_id)
    const citta = estraiCitta(m.clienti?.indirizzo)
    if (!citta) return
    conteggi[citta] = (conteggi[citta] || 0) + 1
  })
  return Object.entries(conteggi)
    .map(([citta, count]) => ({ citta, count }))
    .sort((a, b) => b.count - a.count)
}
