import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, CloudOff, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { geocodeAddress } from '../lib/geocoding'
import { getQueue, enqueue, flushQueue, isNetworkError } from '../lib/offlineQueue'
import { fetchMarchi, creaMarchio, ORIGINE_MACCHINA_TO_MARCHIO } from '../lib/marchi'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { CATEGORIE_MACCHINA, VENDITORI } from '../lib/constants'
import Button from '../components/Button'
import AddressAutocompleteInput from '../components/AddressAutocompleteInput'
import UseMyLocationButton from '../components/UseMyLocationButton'
import MacchinaRowFields from '../components/MacchinaRowFields'

const emptyCliente = { ragioneSociale: '', indirizzo: '' }

function emptyMacchinaRow() {
  return {
    id: crypto.randomUUID(),
    origine: '',
    marchioId: null,
    categoria: CATEGORIE_MACCHINA[0],
    modello: '',
    anno: '',
    stato: 'sconosciuto',
    note: '',
  }
}

const fieldClass =
  'w-full border border-gray/40 rounded-sm px-3 py-2 focus:border-bronze outline-none'
const labelClass = 'block text-sm font-medium mb-1'

export default function NuovaMacchinaPage() {
  const { utente, setUtente } = useCurrentUser()
  const [clienti, setClienti] = useState([])
  const [marchi, setMarchi] = useState([])
  const [cliente, setCliente] = useState(emptyCliente)
  const [indirizzoCoords, setIndirizzoCoords] = useState(null)
  const [macchine, setMacchine] = useState([emptyMacchinaRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nomeInput, setNomeInput] = useState('')
  const [editingNome, setEditingNome] = useState(false)
  const [pendingCount, setPendingCount] = useState(() => getQueue().length)
  const [syncing, setSyncing] = useState(false)
  const prevClienteIdRef = useRef(null)

  const nomeEffettivo = utente && !editingNome ? utente : nomeInput.trim()

  useEffect(() => {
    supabase
      .from('clienti')
      .select('id, ragione_sociale, indirizzo')
      .then(({ data }) => {
        if (data) setClienti(data)
      })

    fetchMarchi()
      .then(setMarchi)
      .catch(() => {})
  }, [])

  const sincronizzaCoda = useCallback(async () => {
    if (!getQueue().length) return
    setSyncing(true)
    try {
      await flushQueue()
    } finally {
      setPendingCount(getQueue().length)
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    sincronizzaCoda()
    window.addEventListener('online', sincronizzaCoda)
    return () => window.removeEventListener('online', sincronizzaCoda)
  }, [sincronizzaCoda])

  const clienteEsistente = useMemo(
    () =>
      clienti.find(
        (c) => c.ragione_sociale.trim().toLowerCase() === cliente.ragioneSociale.trim().toLowerCase()
      ),
    [clienti, cliente.ragioneSociale]
  )

  useEffect(() => {
    if (clienteEsistente && clienteEsistente.id !== prevClienteIdRef.current) {
      setCliente((c) => ({ ...c, indirizzo: clienteEsistente.indirizzo || '' }))
      setIndirizzoCoords(null)
      prevClienteIdRef.current = clienteEsistente.id
    }
    if (!clienteEsistente) {
      prevClienteIdRef.current = null
    }
  }, [clienteEsistente])

  function updateMacchina(id, field, value) {
    setMacchine((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function addMacchina() {
    setMacchine((rows) => [...rows, emptyMacchinaRow()])
  }

  function removeMacchina(id) {
    setMacchine((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows))
  }

  function duplicateMacchina(id) {
    setMacchine((rows) => {
      const idx = rows.findIndex((r) => r.id === id)
      if (idx === -1) return rows
      // Solo origine/marchio/categoria si ripetono spesso tra macchine simili: modello,
      // anno, stato e note sono specifici della singola macchina e vanno ricompilati.
      const originale = rows[idx]
      const copia = {
        ...emptyMacchinaRow(),
        origine: originale.origine,
        marchioId: originale.marchioId,
        categoria: originale.categoria,
      }
      const next = [...rows]
      next.splice(idx + 1, 0, copia)
      return next
    })
  }

  async function handleMarchioCreato(nome, origineRiga) {
    const nuovo = await creaMarchio({
      nome,
      origine: ORIGINE_MACCHINA_TO_MARCHIO[origineRiga],
      creatoDa: nomeEffettivo || null,
    })
    setMarchi((prev) => (prev.some((m) => m.id === nuovo.id) ? prev : [...prev, nuovo]))
    return nuovo
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!cliente.ragioneSociale.trim()) {
      setError('Il cliente è obbligatorio.')
      return
    }
    if (!clienteEsistente && !cliente.indirizzo.trim()) {
      setError("Inserisci l'indirizzo per un nuovo cliente (serve per la mappa).")
      return
    }
    const rigaInvalidaIndex = macchine.findIndex(
      (m) => !m.origine.trim() || !m.marchioId || !m.categoria.trim()
    )
    if (rigaInvalidaIndex !== -1) {
      setError(`Compila origine, marchio e categoria per la macchina ${rigaInvalidaIndex + 1}.`)
      return
    }
    if (!nomeEffettivo) {
      setError('Inserisci il tuo nome per salvare.')
      return
    }

    setSaving(true)
    try {
      let clienteId = clienteEsistente?.id
      let clienteNuovo = null

      if (!clienteId) {
        let lat = indirizzoCoords?.lat ?? null
        let lng = indirizzoCoords?.lng ?? null

        if (lat == null || lng == null) {
          try {
            const geo = await geocodeAddress(cliente.indirizzo)
            lat = geo.lat
            lng = geo.lng
          } catch {
            // geocoding può fallire per indirizzo impreciso (o assenza di rete): il cliente
            // si salva comunque, si corregge dopo
          }
        }

        clienteNuovo = {
          id: crypto.randomUUID(),
          ragione_sociale: cliente.ragioneSociale.trim(),
          indirizzo: cliente.indirizzo.trim(),
          lat,
          lng,
        }
      }

      const righeMacchine = macchine.map((m) => ({
        origine: m.origine,
        marchio_id: m.marchioId,
        categoria: m.categoria,
        modello: m.modello.trim() || null,
        anno_installazione: m.anno ? Number(m.anno) : null,
        stato: m.stato,
        note: m.note.trim() || null,
        foto_url: null,
        inserito_da: nomeEffettivo,
      }))

      try {
        if (clienteNuovo) {
          const { error: clienteErr } = await supabase.from('clienti').insert(clienteNuovo)
          if (clienteErr) throw clienteErr
          clienteId = clienteNuovo.id
          setClienti((prev) => [...prev, { id: clienteId, ragione_sociale: clienteNuovo.ragione_sociale, indirizzo: clienteNuovo.indirizzo }])
        }

        const { error: macchineErr } = await supabase
          .from('macchine_installate')
          .insert(righeMacchine.map((r) => ({ ...r, cliente_id: clienteId })))
        if (macchineErr) throw macchineErr

        const n = macchine.length
        setSuccess(`${n} macchin${n === 1 ? 'a' : 'e'} salvat${n === 1 ? 'a' : 'e'} per ${cliente.ragioneSociale.trim()}.`)
      } catch (err) {
        if (!isNetworkError(err)) throw err

        enqueue({
          clienteEsistenteId: clienteEsistente?.id ?? null,
          clienteNuovo,
          macchine: righeMacchine,
        })
        setPendingCount(getQueue().length)

        const n = macchine.length
        setSuccess(
          `Nessuna connessione: ${n} macchin${n === 1 ? 'a' : 'e'} salvat${n === 1 ? 'a' : 'e'} in locale per ${cliente.ragioneSociale.trim()}. Verrà inviata automaticamente appena torna la rete.`
        )
      }

      setUtente(nomeEffettivo)
      setEditingNome(false)
      setCliente(emptyCliente)
      setIndirizzoCoords(null)
      setMacchine([emptyMacchinaRow()])
    } catch (err) {
      setError(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-6">
        Nuova macchina
      </h1>

      {pendingCount > 0 && (
        <div className="max-w-3xl bg-bronze/10 border border-bronze/30 rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-dgray">
            <CloudOff className="w-4 h-4 text-bronze shrink-0" />
            {pendingCount} macchin{pendingCount === 1 ? 'a' : 'e'} in attesa di sincronizzazione (salvat
            {pendingCount === 1 ? 'a' : 'e'} in locale, offline).
          </span>
          <button
            type="button"
            onClick={sincronizzaCoda}
            disabled={syncing}
            className="flex items-center gap-1.5 font-medium text-bronze hover:underline disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizzo…' : 'Riprova ora'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white border border-gray/60 rounded-lg p-6 space-y-5">
          <h2 className="font-heading font-extrabold uppercase text-lg">Cliente</h2>

          <div>
            <label className={labelClass}>Cliente *</label>
            <input
              list="clienti-list"
              type="text"
              required
              value={cliente.ragioneSociale}
              onChange={(e) => setCliente((c) => ({ ...c, ragioneSociale: e.target.value }))}
              className={fieldClass}
              placeholder="Ragione sociale cliente"
            />
            <datalist id="clienti-list">
              {clienti.map((c) => (
                <option key={c.id} value={c.ragione_sociale} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelClass}>Indirizzo *</label>
            <AddressAutocompleteInput
              required
              value={cliente.indirizzo}
              onChange={(e) => {
                setCliente((c) => ({ ...c, indirizzo: e.target.value }))
                setIndirizzoCoords(null)
              }}
              onPlaceSelected={({ address, lat, lng }) => {
                setCliente((c) => ({ ...c, indirizzo: address }))
                setIndirizzoCoords({ lat, lng })
              }}
              className={fieldClass}
              placeholder="Via, città, provincia"
            />
            <p className="text-xs text-dgray/50 mt-1">
              {clienteEsistente
                ? 'Cliente esistente — indirizzo precompilato, modificabile.'
                : 'Nuovo cliente: scegli un indirizzo dai suggerimenti per una posizione precisa sulla mappa.'}
            </p>
            <UseMyLocationButton
              className="mt-2"
              onLocate={({ address, lat, lng }) => {
                setCliente((c) => ({ ...c, indirizzo: address }))
                setIndirizzoCoords({ lat, lng })
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-heading font-extrabold uppercase text-lg">Macchine</h2>

          {macchine.map((m, index) => (
            <MacchinaRowFields
              key={m.id}
              index={index}
              value={m}
              onChange={(field, value) => updateMacchina(m.id, field, value)}
              onRemove={() => removeMacchina(m.id)}
              canRemove={macchine.length > 1}
              onDuplicate={() => duplicateMacchina(m.id)}
              marchi={marchi}
              onMarchioCreato={handleMarchioCreato}
            />
          ))}

          <button
            type="button"
            onClick={addMacchina}
            className="flex items-center gap-1.5 text-sm font-medium text-bronze hover:underline"
          >
            <Plus size={16} strokeWidth={1.5} />
            Aggiungi un'altra macchina
          </button>
        </div>

        <div className="bg-white border border-gray/60 rounded-lg p-6 space-y-4">
          {utente && !editingNome ? (
            <p className="text-xs text-dgray/50">
              Verrà salvato come <span className="font-medium text-dgray">{utente}</span>.{' '}
              <button
                type="button"
                onClick={() => {
                  setNomeInput('')
                  setEditingNome(true)
                }}
                className="text-bronze hover:underline"
              >
                Non sei {utente}? Cambia
              </button>
            </p>
          ) : (
            <div>
              <label className={labelClass}>Il tuo nome *</label>
              <select
                required
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>Seleziona il tuo nome…</option>
                {VENDITORI.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <p className="text-xs text-dgray/50 mt-1">Serve solo per tracciare chi inserisce il dato.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <Button type="submit" disabled={saving} className="w-full disabled:opacity-50">
            {saving ? 'Salvataggio…' : 'Salva tutto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
