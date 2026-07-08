// Coda di salvataggio offline per il form "Nuova macchina": se l'agente è sul campo
// senza connessione (tipico nei capannoni industriali), i dati vengono messi in coda
// in localStorage invece di andare persi, e inviati automaticamente appena torna la rete.
import { supabase } from './supabaseClient'

const STORAGE_KEY = 'radar_offline_queue'

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function setQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function enqueue(item) {
  const queue = getQueue()
  queue.push(item)
  setQueue(queue)
}

export function isNetworkError(err) {
  if (!navigator.onLine) return true
  if (err instanceof TypeError) return true
  return /failed to fetch|network/i.test(err?.message || '')
}

// Prova a inviare le voci in coda, in ordine. Si ferma al primo errore di rete
// (lasciando il resto in coda per il prossimo tentativo); scarta invece le voci
// con un errore non di rete (es. dato non valido), per non bloccare la coda.
export async function flushQueue() {
  const remaining = getQueue()
  let sent = 0

  while (remaining.length) {
    const item = remaining[0]
    try {
      let clienteId = item.clienteEsistenteId

      if (!clienteId && item.clienteNuovo) {
        const { error } = await supabase.from('clienti').insert(item.clienteNuovo)
        if (error) throw error
        clienteId = item.clienteNuovo.id
      }

      const righe = item.macchine.map((m) => ({ ...m, cliente_id: clienteId }))
      const { error: macchineErr } = await supabase.from('macchine_installate').insert(righe)
      if (macchineErr) throw macchineErr

      remaining.shift()
      sent++
    } catch (err) {
      if (isNetworkError(err)) break
      remaining.shift()
    }
  }

  setQueue(remaining)
  return { sent, remaining: remaining.length }
}
