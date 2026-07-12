import { supabase } from './supabaseClient'
import { normalizza } from './normalizza'

export async function fetchClienti() {
  const { data, error } = await supabase
    .from('clienti')
    .select('id, ragione_sociale, verificato')
    .order('ragione_sociale')
  if (error) throw error
  return data
}

export async function creaClienteVerificato(ragioneSociale, { forza = false } = {}) {
  const nomeTrim = ragioneSociale.trim()
  const nomeNormalizzato = normalizza(nomeTrim)

  const { data: tutti, error: findErr } = await supabase.from('clienti').select('id, ragione_sociale, verificato')
  if (findErr) throw findErr

  const esistente = tutti.find((c) => normalizza(c.ragione_sociale) === nomeNormalizzato)
  if (esistente) return { ...esistente, giaEsistente: true }

  if (!forza) {
    // Nessuna corrispondenza esatta, ma potrebbe essere un'abbreviazione di un cliente
    // già presente (es. "tmp" per "T.M.P. DI LIONETTI..."): segnaliamo senza bloccare,
    // sarà l'utente a decidere se è davvero un cliente diverso.
    const candidati = tutti.filter((c) => {
      const nomeEsistente = normalizza(c.ragione_sociale)
      return nomeEsistente && (nomeEsistente.includes(nomeNormalizzato) || nomeNormalizzato.includes(nomeEsistente))
    })
    if (candidati.length > 0) return { possibileDuplicato: true, candidati }
  }

  const { data, error } = await supabase
    .from('clienti')
    .insert({ ragione_sociale: nomeTrim, verificato: true })
    .select('id, ragione_sociale, verificato')
    .single()
  if (error) throw error

  return { ...data, giaEsistente: false }
}

export async function fetchClientiDaVerificare() {
  const { data, error } = await supabase
    .from('clienti')
    .select('id, ragione_sociale, creato_da, created_at')
    .eq('verificato', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchConteggioMacchinePerCliente() {
  const { data, error } = await supabase.from('macchine_installate').select('cliente_id')
  if (error) throw error
  const conteggi = {}
  data.forEach((r) => {
    conteggi[r.cliente_id] = (conteggi[r.cliente_id] || 0) + 1
  })
  return conteggi
}

export async function confermaCliente(id) {
  const { error } = await supabase.from('clienti').update({ verificato: true }).eq('id', id)
  if (error) throw error
}

export async function rinominaEConfermaCliente(id, nome) {
  const nomeTrim = nome.trim()
  const nomeNormalizzato = normalizza(nomeTrim)

  const { data: verificati, error: findErr } = await supabase
    .from('clienti')
    .select('id, ragione_sociale')
    .neq('id', id)
    .eq('verificato', true)
  if (findErr) throw findErr

  const duplicato = verificati.find((c) => normalizza(c.ragione_sociale) === nomeNormalizzato) || null

  if (duplicato) {
    // Nome uniformato a un cliente già verificato: le macchine del duplicato confluiscono
    // lì, ed eliminiamo la voce duplicata (evita due schede per lo stesso cliente).
    const { error: updateErr } = await supabase
      .from('macchine_installate')
      .update({ cliente_id: duplicato.id })
      .eq('cliente_id', id)
    if (updateErr) throw updateErr

    const { error: deleteErr } = await supabase.from('clienti').delete().eq('id', id)
    if (deleteErr) throw deleteErr

    return { merged: true, into: duplicato }
  }

  const { error: renameErr } = await supabase
    .from('clienti')
    .update({ ragione_sociale: nomeTrim, verificato: true })
    .eq('id', id)
  if (renameErr) throw renameErr

  return { merged: false }
}

export async function eliminaCliente(id) {
  const { error } = await supabase.from('clienti').delete().eq('id', id)
  if (error) throw error
}
