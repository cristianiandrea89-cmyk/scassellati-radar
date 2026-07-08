import { supabase } from './supabaseClient'

// macchine_installate.origine usa 'nostra'/'concorrenza' (accordo con "macchina", femminile);
// marchi.origine usa 'nostro'/'concorrenza' (accordo con "marchio", maschile).
export const ORIGINE_MACCHINA_TO_MARCHIO = { nostra: 'nostro', concorrenza: 'concorrenza' }

export async function fetchMarchi() {
  const { data, error } = await supabase.from('marchi').select('id, nome, origine, verificato').order('nome')
  if (error) throw error
  return data
}

export async function creaMarchio({ nome, origine, creatoDa }) {
  const nomeTrim = nome.trim()

  const { data, error } = await supabase
    .from('marchi')
    .insert({ nome: nomeTrim, origine, verificato: false, creato_da: creatoDa || null })
    .select('id, nome, origine, verificato')
    .single()

  if (error) {
    if (error.code === '23505') {
      // Violazione unique sul nome: qualcun altro l'ha già creato nel frattempo, lo recuperiamo
      const { data: esistente, error: fetchErr } = await supabase
        .from('marchi')
        .select('id, nome, origine, verificato')
        .ilike('nome', nomeTrim)
        .single()
      if (fetchErr) throw fetchErr
      return esistente
    }
    throw error
  }

  return data
}

export async function creaMarchioVerificato({ nome, origine }) {
  const nomeTrim = nome.trim()

  const { data, error } = await supabase
    .from('marchi')
    .insert({ nome: nomeTrim, origine, verificato: true })
    .select('id, nome, origine, verificato')
    .single()

  if (error) {
    if (error.code === '23505') {
      // Violazione unique sul nome: esiste già, lo recuperiamo così com'è
      const { data: esistente, error: fetchErr } = await supabase
        .from('marchi')
        .select('id, nome, origine, verificato')
        .ilike('nome', nomeTrim)
        .single()
      if (fetchErr) throw fetchErr
      return { ...esistente, giaEsistente: true }
    }
    throw error
  }

  return { ...data, giaEsistente: false }
}

export async function fetchMarchiDaVerificare() {
  const { data, error } = await supabase
    .from('marchi')
    .select('id, nome, origine, creato_da, creato_il')
    .eq('verificato', false)
    .order('creato_il', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchConteggioMacchinePerMarchio() {
  const { data, error } = await supabase.from('macchine_installate').select('marchio_id')
  if (error) throw error
  const conteggi = {}
  data.forEach((r) => {
    conteggi[r.marchio_id] = (conteggi[r.marchio_id] || 0) + 1
  })
  return conteggi
}

export async function confermaMarchio(id) {
  const { error } = await supabase.from('marchi').update({ verificato: true }).eq('id', id)
  if (error) throw error
}

export async function rinominaEConfermaMarchio(id, { nome, origine }) {
  const nomeTrim = nome.trim()

  const { data: duplicato, error: findErr } = await supabase
    .from('marchi')
    .select('id, nome')
    .neq('id', id)
    .eq('verificato', true)
    .ilike('nome', nomeTrim)
    .maybeSingle()
  if (findErr) throw findErr

  if (duplicato) {
    // L'utente ha scelto esplicitamente un'origine in questo salvataggio: la applichiamo
    // anche al marchio esistente su cui confluisce (potrebbe correggere anche quello).
    const { error: updateMarchioErr } = await supabase
      .from('marchi')
      .update({ origine })
      .eq('id', duplicato.id)
    if (updateMarchioErr) throw updateMarchioErr

    const { error: updateErr } = await supabase
      .from('macchine_installate')
      .update({ marchio_id: duplicato.id })
      .eq('marchio_id', id)
    if (updateErr) throw updateErr

    const { error: deleteErr } = await supabase.from('marchi').delete().eq('id', id)
    if (deleteErr) throw deleteErr

    return { merged: true, into: duplicato }
  }

  const { error: renameErr } = await supabase
    .from('marchi')
    .update({ nome: nomeTrim, origine, verificato: true })
    .eq('id', id)
  if (renameErr) throw renameErr

  return { merged: false }
}

export async function eliminaMarchio(id) {
  const { error } = await supabase.from('marchi').delete().eq('id', id)
  if (error) throw error
}
