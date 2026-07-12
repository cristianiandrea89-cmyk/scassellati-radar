import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import {
  fetchClienti,
  fetchClientiDaVerificare,
  fetchConteggioMacchinePerCliente,
  confermaCliente,
  rinominaEConfermaCliente,
  eliminaCliente,
  creaClienteVerificato,
} from '../lib/clienti'

const inputClass =
  'border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none flex-1 min-w-[160px]'

export default function ClientiVerificaPage() {
  const [tab, setTab] = useState('daVerificare')

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-2">Clienti</h1>

      <div className="flex gap-1 mb-6 border-b border-gray/40">
        {[
          { value: 'daVerificare', label: 'Da verificare' },
          { value: 'tutti', label: 'Tutti i clienti' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value ? 'border-bronze text-bronze' : 'border-transparent text-dgray/60 hover:text-bronze'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daVerificare' ? <DaVerificareTab /> : <TuttiClientiTab />}
    </div>
  )
}

function DaVerificareTab() {
  const [clienti, setClienti] = useState([])
  const [conteggi, setConteggi] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function ricarica() {
    setLoading(true)
    try {
      const [lista, conteggiMap] = await Promise.all([
        fetchClientiDaVerificare(),
        fetchConteggioMacchinePerCliente(),
      ])
      setClienti(lista)
      setConteggi(conteggiMap)
      setError('')
    } catch (err) {
      setError(err.message || 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ricarica()
  }, [])

  return (
    <div>
      <p className="text-sm text-dgray/60 mb-6">
        Clienti creati al volo da un venditore nel form macchina (nome digitato non presente in elenco),
        in attesa di conferma o correzione — utile per uniformare grafie diverse dello stesso cliente.
      </p>

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        clienti.length === 0 ? (
          <div className="bg-white border border-gray/60 rounded-lg p-6">
            <p className="text-dgray/70">Nessun cliente in attesa di verifica.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {clienti.map((c) => (
              <ClienteRevisioneRow
                key={c.id}
                cliente={c}
                numeroMacchine={conteggi[c.id] || 0}
                onAggiornato={ricarica}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function ClienteRevisioneRow({ cliente, numeroMacchine, onAggiornato }) {
  const [mode, setMode] = useState('view')
  const [nuovoNome, setNuovoNome] = useState(cliente.ragione_sociale)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConferma() {
    setSaving(true)
    try {
      await confermaCliente(cliente.id)
      onAggiornato()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleRinominaConferma() {
    if (!nuovoNome.trim()) return
    setSaving(true)
    try {
      await rinominaEConfermaCliente(cliente.id, nuovoNome)
      onAggiornato()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleElimina() {
    setSaving(true)
    try {
      await eliminaCliente(cliente.id)
      onAggiornato()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray/60 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{cliente.ragione_sociale}</p>
          <p className="text-xs text-dgray/50">
            Inserito da {cliente.creato_da || 'sconosciuto'} il{' '}
            {new Date(cliente.created_at).toLocaleDateString('it-IT')} — usato da {numeroMacchine} macchin
            {numeroMacchine === 1 ? 'a' : 'e'}
          </p>
        </div>

        {mode === 'view' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConferma}
              disabled={saving}
              className="text-sm text-bronze hover:underline disabled:opacity-50"
            >
              Conferma
            </button>
            <button
              type="button"
              onClick={() => setMode('rinomina')}
              disabled={saving}
              className="text-sm text-dgray/70 hover:text-bronze transition-colors"
            >
              Rinomina e conferma
            </button>
            <button
              type="button"
              onClick={() => setMode('elimina')}
              disabled={saving}
              className="text-sm text-dgray/70 hover:text-red-600 transition-colors"
            >
              Elimina
            </button>
          </div>
        )}
      </div>

      {mode === 'rinomina' && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            className={`${inputClass} w-full`}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRinominaConferma}
              disabled={saving}
              className="text-sm text-bronze hover:underline disabled:opacity-50"
            >
              {saving ? 'Salvo…' : 'Conferma'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('view')
                setNuovoNome(cliente.ragione_sociale)
              }}
              className="text-sm text-dgray/50 hover:underline"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {mode === 'elimina' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-600">
            {numeroMacchine > 0
              ? `Attenzione: ${numeroMacchine} macchin${numeroMacchine === 1 ? 'a usa' : 'e usano'} questo cliente. Eliminarlo comunque?`
              : 'Eliminare questo cliente?'}
          </p>
          <button
            type="button"
            onClick={handleElimina}
            disabled={saving}
            className="text-sm text-red-600 font-medium hover:underline disabled:opacity-50"
          >
            {saving ? 'Elimino…' : 'Conferma eliminazione'}
          </button>
          <button type="button" onClick={() => setMode('view')} className="text-sm text-dgray/50 hover:underline">
            Annulla
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}

function NuovoClienteForm({ onCreato }) {
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [messaggio, setMessaggio] = useState('')
  const [candidatiSimili, setCandidatiSimili] = useState(null)

  async function tentaCreazione(forza) {
    setSaving(true)
    setError('')
    setMessaggio('')
    try {
      const risultato = await creaClienteVerificato(nome, { forza })
      if (risultato.possibileDuplicato) {
        setCandidatiSimili(risultato.candidati)
        return
      }
      setCandidatiSimili(null)
      setMessaggio(
        risultato.giaEsistente
          ? `"${risultato.ragione_sociale}" era già in elenco.`
          : `"${risultato.ragione_sociale}" aggiunto.`
      )
      setNome('')
      onCreato()
    } catch (err) {
      setError(err.message || "Errore durante l'aggiunta.")
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    tentaCreazione(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray/60 rounded-lg p-4 mb-4 space-y-2">
      <p className="text-sm font-medium">Aggiungi un cliente</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setCandidatiSimili(null)
          }}
          placeholder="Ragione sociale"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={saving || !nome.trim()}
          className="flex items-center gap-1.5 text-sm font-medium text-bronze hover:underline disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={1.5} />
          {saving ? 'Aggiungo…' : 'Aggiungi'}
        </button>
      </div>

      {candidatiSimili && (
        <div className="bg-offwhite/60 border border-gray/40 rounded-sm p-3 space-y-2">
          <p className="text-xs text-dgray/70">
            Forse esiste già un cliente simile:{' '}
            {candidatiSimili.map((c) => `"${c.ragione_sociale}"`).join(', ')}. Aggiungere comunque "{nome.trim()}"
            come cliente distinto?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => tentaCreazione(true)}
              disabled={saving}
              className="text-xs text-bronze font-medium hover:underline disabled:opacity-50"
            >
              {saving ? 'Aggiungo…' : 'Aggiungi comunque'}
            </button>
            <button
              type="button"
              onClick={() => setCandidatiSimili(null)}
              className="text-xs text-dgray/50 hover:underline"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {messaggio && <p className="text-xs text-green-700">{messaggio}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}

function TuttiClientiTab() {
  const [clienti, setClienti] = useState([])
  const [conteggi, setConteggi] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function ricarica() {
    setLoading(true)
    try {
      const [lista, conteggiMap] = await Promise.all([fetchClienti(), fetchConteggioMacchinePerCliente()])
      setClienti(lista)
      setConteggi(conteggiMap)
      setError('')
    } catch (err) {
      setError(err.message || 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ricarica()
  }, [])

  const LIMITE_RISULTATI = 30

  const risultatiCompleti = useMemo(() => {
    const testo = search.trim().toLowerCase()
    if (!testo) return []
    return clienti.filter((c) => c.ragione_sociale.toLowerCase().includes(testo))
  }, [clienti, search])

  const filtrati = risultatiCompleti.slice(0, LIMITE_RISULTATI)
  const altriRisultati = risultatiCompleti.length - filtrati.length

  return (
    <div>
      <p className="text-sm text-dgray/60 mb-4">
        Elenco completo dei clienti. Puoi correggere il nome in qualsiasi momento — utile per
        uniformare grafie diverse dello stesso cliente.
      </p>

      <NuovoClienteForm onCreato={ricarica} />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Scrivi il nome di un cliente per cercarlo…"
        className={`${inputClass} max-w-xs mb-4`}
      />

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        !search.trim() ? (
          <p className="text-dgray/50 text-sm">Scrivi almeno una lettera per cercare tra i {clienti.length} clienti.</p>
        ) : filtrati.length === 0 ? (
          <div className="bg-white border border-gray/60 rounded-lg p-6">
            <p className="text-dgray/70">Nessun cliente corrisponde alla ricerca.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {filtrati.map((c) => (
              <ClienteRigaCompleta
                key={c.id}
                cliente={c}
                numeroMacchine={conteggi[c.id] || 0}
                onAggiornato={ricarica}
              />
            ))}
            {altriRisultati > 0 && (
              <p className="text-xs text-dgray/50 px-1">
                Altri {altriRisultati} risultati non mostrati — affina la ricerca.
              </p>
            )}
          </div>
        )
      )}
    </div>
  )
}

function ClienteRigaCompleta({ cliente, numeroMacchine, onAggiornato }) {
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(cliente.ragione_sociale)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSalva() {
    if (!nome.trim()) return
    setSaving(true)
    try {
      await rinominaEConfermaCliente(cliente.id, nome)
      setEditing(false)
      onAggiornato()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-gray/60 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {cliente.ragione_sociale}
            {!cliente.verificato && <span className="ml-2 text-[10px] text-bronze">da verificare</span>}
          </p>
          <p className="text-xs text-dgray/50">
            usato da {numeroMacchine} macchin{numeroMacchine === 1 ? 'a' : 'e'}
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-bronze hover:underline"
          >
            Modifica
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={`${inputClass} w-full`}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSalva}
              disabled={saving}
              className="text-sm text-bronze hover:underline disabled:opacity-50"
            >
              {saving ? 'Salvo…' : 'Salva'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setNome(cliente.ragione_sociale)
              }}
              className="text-sm text-dgray/50 hover:underline"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  )
}
