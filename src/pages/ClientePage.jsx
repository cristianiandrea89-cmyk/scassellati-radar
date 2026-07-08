import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { geocodeAddress } from '../lib/geocoding'
import { fetchMarchi, creaMarchio, ORIGINE_MACCHINA_TO_MARCHIO } from '../lib/marchi'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { CATEGORIE_MACCHINA, VENDITORI, ZONE_COMMERCIALI } from '../lib/constants'
import Button from '../components/Button'
import AddressAutocompleteInput from '../components/AddressAutocompleteInput'
import UseMyLocationButton from '../components/UseMyLocationButton'
import MacchinaRowFields from '../components/MacchinaRowFields'

const fieldClass =
  'w-full border border-gray/40 rounded-sm px-3 py-2 focus:border-bronze outline-none'
const labelClass = 'block text-sm font-medium mb-1'

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

function mapMacchinaFromDb(m) {
  return {
    id: m.id,
    origine: m.origine,
    marchioId: m.marchio_id,
    categoria: m.categoria,
    modello: m.modello || '',
    anno: m.anno_installazione ? String(m.anno_installazione) : '',
    stato: m.stato,
    note: m.note || '',
    dirty: false,
  }
}

export default function ClientePage() {
  const { id } = useParams()
  const { utente, setUtente } = useCurrentUser()

  const [loading, setLoading] = useState(true)
  const [errorCaricamento, setErrorCaricamento] = useState('')

  const [cliente, setCliente] = useState(null)
  const [clienteForm, setClienteForm] = useState(null)
  const [indirizzoCoords, setIndirizzoCoords] = useState(null)
  const [savingCliente, setSavingCliente] = useState(false)
  const [errorCliente, setErrorCliente] = useState('')
  const [successCliente, setSuccessCliente] = useState('')

  const [marchi, setMarchi] = useState([])
  const [macchine, setMacchine] = useState([])
  const [savingRowId, setSavingRowId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [errorMacchine, setErrorMacchine] = useState('')

  const [nuovaMacchina, setNuovaMacchina] = useState(emptyMacchinaRow())
  const [nomeInput, setNomeInput] = useState('')
  const [editingNome, setEditingNome] = useState(false)
  const [aggiungendo, setAggiungendo] = useState(false)
  const [errorNuova, setErrorNuova] = useState('')
  const nuovaMacchinaRef = useRef(null)

  const nomeEffettivo = utente && !editingNome ? utente : nomeInput.trim()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [clienteRes, macchineRes, marchiData] = await Promise.all([
        supabase.from('clienti').select('*').eq('id', id).single(),
        supabase
          .from('macchine_installate')
          .select('id, origine, marchio_id, categoria, modello, anno_installazione, stato, note, inserito_da, updated_at')
          .eq('cliente_id', id)
          .order('created_at', { ascending: true }),
        fetchMarchi().catch(() => []),
      ])

      if (clienteRes.error) {
        setErrorCaricamento(clienteRes.error.message)
        setLoading(false)
        return
      }

      setCliente(clienteRes.data)
      setClienteForm({
        ragioneSociale: clienteRes.data.ragione_sociale || '',
        indirizzo: clienteRes.data.indirizzo || '',
        settore: clienteRes.data.settore || '',
        zonaCommerciale: clienteRes.data.zona_commerciale || '',
        referenteNome: clienteRes.data.referente_nome || '',
        referenteRuolo: clienteRes.data.referente_ruolo || '',
        referenteContatti: clienteRes.data.referente_contatti || '',
        agente: clienteRes.data.agente || '',
      })

      if (!macchineRes.error) setMacchine((macchineRes.data || []).map(mapMacchinaFromDb))
      setMarchi(marchiData)

      setLoading(false)
    }
    load()
  }, [id])

  async function handleMarchioCreato(nome, origineRiga) {
    const nuovo = await creaMarchio({
      nome,
      origine: ORIGINE_MACCHINA_TO_MARCHIO[origineRiga],
      creatoDa: nomeEffettivo || null,
    })
    setMarchi((prev) => (prev.some((m) => m.id === nuovo.id) ? prev : [...prev, nuovo]))
    return nuovo
  }

  async function handleSalvaCliente(e) {
    e.preventDefault()
    setErrorCliente('')
    setSuccessCliente('')

    if (!clienteForm.ragioneSociale.trim()) {
      setErrorCliente('La ragione sociale è obbligatoria.')
      return
    }

    setSavingCliente(true)
    try {
      let lat = cliente.lat
      let lng = cliente.lng

      if (indirizzoCoords) {
        lat = indirizzoCoords.lat
        lng = indirizzoCoords.lng
      } else if (clienteForm.indirizzo.trim() !== (cliente.indirizzo || '').trim()) {
        try {
          const geo = await geocodeAddress(clienteForm.indirizzo)
          lat = geo.lat
          lng = geo.lng
        } catch {
          // geocoding può fallire per indirizzo impreciso: si salva comunque, si corregge dopo
        }
      }

      const { error } = await supabase
        .from('clienti')
        .update({
          ragione_sociale: clienteForm.ragioneSociale.trim(),
          indirizzo: clienteForm.indirizzo.trim() || null,
          lat,
          lng,
          settore: clienteForm.settore.trim() || null,
          zona_commerciale: clienteForm.zonaCommerciale.trim() || null,
          referente_nome: clienteForm.referenteNome.trim() || null,
          referente_ruolo: clienteForm.referenteRuolo.trim() || null,
          referente_contatti: clienteForm.referenteContatti.trim() || null,
          agente: clienteForm.agente.trim() || null,
        })
        .eq('id', id)

      if (error) throw error

      setCliente((c) => ({ ...c, ...clienteForm, lat, lng }))
      setIndirizzoCoords(null)
      setSuccessCliente('Dati cliente aggiornati.')
    } catch (err) {
      setErrorCliente(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSavingCliente(false)
    }
  }

  function updateMacchinaRow(rowId, field, value) {
    setMacchine((rows) => rows.map((r) => (r.id === rowId ? { ...r, [field]: value, dirty: true } : r)))
  }

  async function salvaMacchinaRow(rowId) {
    const row = macchine.find((r) => r.id === rowId)
    if (!row) return
    setSavingRowId(rowId)
    setErrorMacchine('')
    try {
      const { error } = await supabase
        .from('macchine_installate')
        .update({
          origine: row.origine,
          marchio_id: row.marchioId,
          categoria: row.categoria,
          modello: row.modello.trim() || null,
          anno_installazione: row.anno ? Number(row.anno) : null,
          stato: row.stato,
          note: row.note.trim() || null,
        })
        .eq('id', rowId)

      if (error) throw error
      setMacchine((rows) => rows.map((r) => (r.id === rowId ? { ...r, dirty: false } : r)))
    } catch (err) {
      setErrorMacchine(err.message || 'Errore durante il salvataggio.')
    } finally {
      setSavingRowId(null)
    }
  }

  async function eliminaMacchinaRow(rowId) {
    setSavingRowId(rowId)
    setErrorMacchine('')
    try {
      const { error } = await supabase.from('macchine_installate').delete().eq('id', rowId)
      if (error) throw error
      setMacchine((rows) => rows.filter((r) => r.id !== rowId))
      setPendingDeleteId(null)
    } catch (err) {
      setErrorMacchine(err.message || 'Errore durante l\'eliminazione.')
    } finally {
      setSavingRowId(null)
    }
  }

  function duplicaInNuova(row) {
    // Solo origine/marchio/categoria si ripetono spesso tra macchine simili: modello,
    // anno, stato e note sono specifici della singola macchina e vanno ricompilati.
    setNuovaMacchina({
      ...emptyMacchinaRow(),
      origine: row.origine,
      marchioId: row.marchioId,
      categoria: row.categoria,
    })
    nuovaMacchinaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleAggiungiMacchina() {
    setErrorNuova('')

    if (!nuovaMacchina.origine || !nuovaMacchina.marchioId || !nuovaMacchina.categoria) {
      setErrorNuova('Compila origine, marchio e categoria.')
      return
    }
    if (!nomeEffettivo) {
      setErrorNuova('Inserisci il tuo nome per salvare.')
      return
    }

    setAggiungendo(true)
    try {
      const { data, error } = await supabase
        .from('macchine_installate')
        .insert({
          cliente_id: id,
          origine: nuovaMacchina.origine,
          marchio_id: nuovaMacchina.marchioId,
          categoria: nuovaMacchina.categoria,
          modello: nuovaMacchina.modello.trim() || null,
          anno_installazione: nuovaMacchina.anno ? Number(nuovaMacchina.anno) : null,
          stato: nuovaMacchina.stato,
          note: nuovaMacchina.note.trim() || null,
          foto_url: null,
          inserito_da: nomeEffettivo,
        })
        .select('id, origine, marchio_id, categoria, modello, anno_installazione, stato, note, inserito_da, updated_at')
        .single()

      if (error) throw error

      setUtente(nomeEffettivo)
      setEditingNome(false)
      setMacchine((rows) => [...rows, mapMacchinaFromDb(data)])
      setNuovaMacchina(emptyMacchinaRow())
    } catch (err) {
      setErrorNuova(err.message || 'Errore durante il salvataggio.')
    } finally {
      setAggiungendo(false)
    }
  }

  if (loading) return <p className="text-dgray/50 text-sm">Caricamento…</p>
  if (errorCaricamento) return <p className="text-sm text-red-600">{errorCaricamento}</p>
  if (!cliente) return <p className="text-dgray/70">Cliente non trovato.</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/lista" className="text-xs text-dgray/50 hover:text-bronze transition-colors">
          ← Torna alla lista
        </Link>
        <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mt-1">
          {cliente.ragione_sociale}
        </h1>
      </div>

      <form onSubmit={handleSalvaCliente} className="bg-white border border-gray/60 rounded-lg p-6 space-y-5 max-w-2xl">
        <h2 className="font-heading font-extrabold uppercase text-lg">Dati cliente</h2>

        <div>
          <label className={labelClass}>Ragione sociale *</label>
          <input
            type="text"
            required
            value={clienteForm.ragioneSociale}
            onChange={(e) => setClienteForm((c) => ({ ...c, ragioneSociale: e.target.value }))}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Indirizzo</label>
          <AddressAutocompleteInput
            value={clienteForm.indirizzo}
            onChange={(e) => {
              setClienteForm((c) => ({ ...c, indirizzo: e.target.value }))
              setIndirizzoCoords(null)
            }}
            onPlaceSelected={({ address, lat, lng }) => {
              setClienteForm((c) => ({ ...c, indirizzo: address }))
              setIndirizzoCoords({ lat, lng })
            }}
            className={fieldClass}
            placeholder="Via, città, provincia"
          />
          <UseMyLocationButton
            className="mt-2"
            onLocate={({ address, lat, lng }) => {
              setClienteForm((c) => ({ ...c, indirizzo: address }))
              setIndirizzoCoords({ lat, lng })
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Settore</label>
            <input
              type="text"
              value={clienteForm.settore}
              onChange={(e) => setClienteForm((c) => ({ ...c, settore: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Zona commerciale</label>
            <select
              value={clienteForm.zonaCommerciale}
              onChange={(e) => setClienteForm((c) => ({ ...c, zonaCommerciale: e.target.value }))}
              className={fieldClass}
            >
              <option value="">Non specificata</option>
              {ZONE_COMMERCIALI.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Agente di riferimento</label>
            <select
              value={clienteForm.agente}
              onChange={(e) => setClienteForm((c) => ({ ...c, agente: e.target.value }))}
              className={fieldClass}
            >
              <option value="">Non specificato</option>
              {VENDITORI.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Referente — nome</label>
            <input
              type="text"
              value={clienteForm.referenteNome}
              onChange={(e) => setClienteForm((c) => ({ ...c, referenteNome: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Referente — ruolo</label>
            <input
              type="text"
              value={clienteForm.referenteRuolo}
              onChange={(e) => setClienteForm((c) => ({ ...c, referenteRuolo: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Referente — contatti</label>
            <input
              type="text"
              value={clienteForm.referenteContatti}
              onChange={(e) => setClienteForm((c) => ({ ...c, referenteContatti: e.target.value }))}
              className={fieldClass}
              placeholder="Telefono / email"
            />
          </div>
        </div>

        {errorCliente && <p className="text-sm text-red-600">{errorCliente}</p>}
        {successCliente && <p className="text-sm text-green-700">{successCliente}</p>}

        <Button type="submit" disabled={savingCliente} className="disabled:opacity-50">
          {savingCliente ? 'Salvataggio…' : 'Salva modifiche cliente'}
        </Button>
      </form>

      <div className="space-y-4 max-w-3xl">
        <h2 className="font-heading font-extrabold uppercase text-lg">Macchine installate</h2>

        {macchine.length === 0 && (
          <div className="bg-white border border-gray/60 rounded-lg p-6">
            <p className="text-dgray/70">Nessuna macchina censita per questo cliente.</p>
          </div>
        )}

        {macchine.map((m, index) => (
          <div key={m.id} className="space-y-2">
            <MacchinaRowFields
              index={index}
              value={m}
              onChange={(field, value) => updateMacchinaRow(m.id, field, value)}
              onRemove={() => setPendingDeleteId(m.id)}
              canRemove
              onDuplicate={() => duplicaInNuova(m)}
              marchi={marchi}
              onMarchioCreato={handleMarchioCreato}
            />
            <div className="flex items-center gap-3 px-1">
              {m.dirty && (
                <button
                  type="button"
                  onClick={() => salvaMacchinaRow(m.id)}
                  disabled={savingRowId === m.id}
                  className="text-sm text-bronze hover:underline disabled:opacity-50"
                >
                  {savingRowId === m.id ? 'Salvo…' : 'Salva modifiche'}
                </button>
              )}
              {pendingDeleteId === m.id && (
                <>
                  <span className="text-sm text-red-600">Eliminare questa macchina?</span>
                  <button
                    type="button"
                    onClick={() => eliminaMacchinaRow(m.id)}
                    disabled={savingRowId === m.id}
                    className="text-sm text-red-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {savingRowId === m.id ? 'Elimino…' : 'Conferma eliminazione'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(null)}
                    className="text-sm text-dgray/50 hover:underline"
                  >
                    Annulla
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {errorMacchine && <p className="text-sm text-red-600">{errorMacchine}</p>}
      </div>

      <div ref={nuovaMacchinaRef} className="space-y-3 max-w-3xl">
        <h2 className="font-heading font-extrabold uppercase text-lg">Aggiungi macchina</h2>

        <MacchinaRowFields
          index={macchine.length}
          value={nuovaMacchina}
          onChange={(field, value) => setNuovaMacchina((r) => ({ ...r, [field]: value }))}
          canRemove={false}
          marchi={marchi}
          onMarchioCreato={handleMarchioCreato}
        />

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
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>Seleziona il tuo nome…</option>
                {VENDITORI.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {errorNuova && <p className="text-sm text-red-600">{errorNuova}</p>}

          <Button type="button" onClick={handleAggiungiMacchina} disabled={aggiungendo} className="disabled:opacity-50">
            {aggiungendo ? 'Salvataggio…' : 'Aggiungi macchina'}
          </Button>
        </div>
      </div>
    </div>
  )
}
