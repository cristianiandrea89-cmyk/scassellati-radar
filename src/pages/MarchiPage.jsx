import { useState, useEffect, useMemo } from 'react'
import { Plus } from 'lucide-react'
import {
  fetchMarchi,
  fetchMarchiDaVerificare,
  fetchConteggioMacchinePerMarchio,
  confermaMarchio,
  rinominaEConfermaMarchio,
  eliminaMarchio,
  creaMarchioVerificato,
} from '../lib/marchi'
import MarchioOrigineToggle from '../components/MarchioOrigineToggle'

const inputClass =
  'border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none flex-1 min-w-[160px]'

export default function MarchiPage() {
  const [tab, setTab] = useState('daVerificare')

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-2">Marchi</h1>

      <div className="flex gap-1 mb-6 border-b border-gray/40">
        {[
          { value: 'daVerificare', label: 'Da verificare' },
          { value: 'tutti', label: 'Tutti i marchi' },
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

      {tab === 'daVerificare' ? <DaVerificareTab /> : <TuttiMarchiTab />}
    </div>
  )
}

function DaVerificareTab() {
  const [marchi, setMarchi] = useState([])
  const [conteggi, setConteggi] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function ricarica() {
    setLoading(true)
    try {
      const [lista, conteggiMap] = await Promise.all([
        fetchMarchiDaVerificare(),
        fetchConteggioMacchinePerMarchio(),
      ])
      setMarchi(lista)
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
        Marchi inseriti liberamente dai venditori nel form di inserimento macchina, in attesa di conferma o correzione.
      </p>

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        marchi.length === 0 ? (
          <div className="bg-white border border-gray/60 rounded-lg p-6">
            <p className="text-dgray/70">Nessun marchio in attesa di verifica.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {marchi.map((m) => (
              <MarchioRevisioneRow
                key={m.id}
                marchio={m}
                numeroMacchine={conteggi[m.id] || 0}
                onAggiornato={ricarica}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function MarchioRevisioneRow({ marchio, numeroMacchine, onAggiornato }) {
  const [mode, setMode] = useState('view')
  const [nuovoNome, setNuovoNome] = useState(marchio.nome)
  const [nuovaOrigine, setNuovaOrigine] = useState(marchio.origine)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConferma() {
    setSaving(true)
    try {
      await confermaMarchio(marchio.id)
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
      await rinominaEConfermaMarchio(marchio.id, { nome: nuovoNome, origine: nuovaOrigine })
      onAggiornato()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleElimina() {
    setSaving(true)
    try {
      await eliminaMarchio(marchio.id)
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
            {marchio.nome}{' '}
            <span className="text-xs font-normal text-dgray/50">
              ({marchio.origine === 'nostro' ? 'nostro' : 'concorrenza'})
            </span>
          </p>
          <p className="text-xs text-dgray/50">
            Inserito da {marchio.creato_da || 'sconosciuto'} il{' '}
            {new Date(marchio.creato_il).toLocaleDateString('it-IT')} — usato da {numeroMacchine} macchin
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nuovoNome}
              onChange={(e) => setNuovoNome(e.target.value)}
              className={inputClass}
              autoFocus
            />
            <MarchioOrigineToggle value={nuovaOrigine} onChange={setNuovaOrigine} />
          </div>
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
                setNuovoNome(marchio.nome)
                setNuovaOrigine(marchio.origine)
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
              ? `Attenzione: ${numeroMacchine} macchin${numeroMacchine === 1 ? 'a usa' : 'e usano'} questo marchio. Eliminarlo comunque?`
              : 'Eliminare questo marchio?'}
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

function NuovoMarchioForm({ onCreato }) {
  const [nome, setNome] = useState('')
  const [origine, setOrigine] = useState('nostro')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [messaggio, setMessaggio] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSaving(true)
    setError('')
    setMessaggio('')
    try {
      const risultato = await creaMarchioVerificato({ nome, origine })
      setMessaggio(
        risultato.giaEsistente ? `"${risultato.nome}" era già in elenco.` : `"${risultato.nome}" aggiunto.`
      )
      setNome('')
      setOrigine('nostro')
      onCreato()
    } catch (err) {
      setError(err.message || "Errore durante l'aggiunta.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray/60 rounded-lg p-4 mb-4 space-y-2">
      <p className="text-sm font-medium">Aggiungi un marchio</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome marchio"
          className={inputClass}
        />
        <MarchioOrigineToggle value={origine} onChange={setOrigine} />
        <button
          type="submit"
          disabled={saving || !nome.trim()}
          className="flex items-center gap-1.5 text-sm font-medium text-bronze hover:underline disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={1.5} />
          {saving ? 'Aggiungo…' : 'Aggiungi'}
        </button>
      </div>
      {messaggio && <p className="text-xs text-green-700">{messaggio}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}

function TuttiMarchiTab() {
  const [marchi, setMarchi] = useState([])
  const [conteggi, setConteggi] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function ricarica() {
    setLoading(true)
    try {
      const [lista, conteggiMap] = await Promise.all([fetchMarchi(), fetchConteggioMacchinePerMarchio()])
      setMarchi(lista)
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

  const filtrati = useMemo(() => {
    const testo = search.trim().toLowerCase()
    return marchi.filter((m) => !testo || m.nome.toLowerCase().includes(testo))
  }, [marchi, search])

  return (
    <div>
      <p className="text-sm text-dgray/60 mb-4">
        Elenco completo dei marchi. Puoi correggere nome e origine in qualsiasi momento — utile
        se un marchio concorrenza diventa nostro (o viceversa) per un accordo di distribuzione.
      </p>

      <NuovoMarchioForm onCreato={ricarica} />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca marchio…"
        className={`${inputClass} max-w-xs mb-4`}
      />

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        filtrati.length === 0 ? (
          <div className="bg-white border border-gray/60 rounded-lg p-6">
            <p className="text-dgray/70">Nessun marchio corrisponde alla ricerca.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {filtrati.map((m) => (
              <MarchioRigaCompleta
                key={m.id}
                marchio={m}
                numeroMacchine={conteggi[m.id] || 0}
                onAggiornato={ricarica}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function MarchioRigaCompleta({ marchio, numeroMacchine, onAggiornato }) {
  const [editing, setEditing] = useState(false)
  const [nome, setNome] = useState(marchio.nome)
  const [origine, setOrigine] = useState(marchio.origine)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSalva() {
    if (!nome.trim()) return
    setSaving(true)
    try {
      await rinominaEConfermaMarchio(marchio.id, { nome, origine })
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
            {marchio.nome}{' '}
            <span className="text-xs font-normal text-dgray/50">
              ({marchio.origine === 'nostro' ? 'nostro' : 'concorrenza'})
            </span>
            {!marchio.verificato && <span className="ml-2 text-[10px] text-bronze">da verificare</span>}
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
              autoFocus
            />
            <MarchioOrigineToggle value={origine} onChange={setOrigine} />
          </div>
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
                setNome(marchio.nome)
                setOrigine(marchio.origine)
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
