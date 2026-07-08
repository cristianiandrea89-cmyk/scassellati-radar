import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIE_MACCHINA, ZONE_COMMERCIALI, VENDITORI } from '../lib/constants'

const selectClass =
  'border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none bg-white'

const STATO_LABEL = {
  attiva: 'Attiva',
  da_sostituire: 'Da sostituire',
  sconosciuto: 'Sconosciuto',
}

const STATO_CLASS = {
  attiva: 'text-dgray/70',
  da_sostituire: 'text-bronze font-medium',
  sconosciuto: 'text-gray',
}

function OrigineBadge({ origine }) {
  const isNostra = origine === 'nostra'
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium border ${
        isNostra ? 'bg-bronze/10 text-bronze border-bronze/30' : 'bg-gray/20 text-dgray/70 border-gray/40'
      }`}
    >
      {isNostra ? 'Nostra' : 'Concorrenza'}
    </span>
  )
}

export default function ListaPage() {
  const [macchine, setMacchine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [origineFiltro, setOrigineFiltro] = useState('tutte')
  const [marchioFiltro, setMarchioFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [zonaFiltro, setZonaFiltro] = useState('')
  const [agenteFiltro, setAgenteFiltro] = useState('')

  useEffect(() => {
    supabase
      .from('macchine_installate')
      .select(
        'id, origine, categoria, modello, anno_installazione, stato, note, inserito_da, updated_at, cliente_id, clienti(ragione_sociale, zona_commerciale, agente), marchi(nome)'
      )
      .order('updated_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setMacchine(data || [])
        }
        setLoading(false)
      })
  }, [])

  const marchiDisponibili = useMemo(
    () => [...new Set(macchine.map((m) => m.marchi?.nome).filter(Boolean))].sort(),
    [macchine]
  )

  const filtrate = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return macchine.filter((m) => {
      if (searchLower && !m.clienti?.ragione_sociale?.toLowerCase().includes(searchLower)) return false
      if (origineFiltro !== 'tutte' && m.origine !== origineFiltro) return false
      if (marchioFiltro && m.marchi?.nome !== marchioFiltro) return false
      if (categoriaFiltro && m.categoria !== categoriaFiltro) return false
      if (zonaFiltro && m.clienti?.zona_commerciale !== zonaFiltro) return false
      if (agenteFiltro && m.clienti?.agente !== agenteFiltro) return false
      return true
    })
  }, [macchine, search, origineFiltro, marchioFiltro, categoriaFiltro, zonaFiltro, agenteFiltro])

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-6">
        Tabella clienti e macchine
      </h1>

      <div className="bg-white border border-gray/60 rounded-lg p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca cliente…"
          className={`${selectClass} flex-1 min-w-[180px]`}
        />

        <select value={origineFiltro} onChange={(e) => setOrigineFiltro(e.target.value)} className={selectClass}>
          <option value="tutte">Tutte le origini</option>
          <option value="nostra">Nostra</option>
          <option value="concorrenza">Concorrenza</option>
        </select>

        <select value={marchioFiltro} onChange={(e) => setMarchioFiltro(e.target.value)} className={selectClass}>
          <option value="">Tutti i marchi</option>
          {marchiDisponibili.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={selectClass}>
          <option value="">Tutte le categorie</option>
          {CATEGORIE_MACCHINA.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={zonaFiltro} onChange={(e) => setZonaFiltro(e.target.value)} className={selectClass}>
          <option value="">Tutte le zone</option>
          {ZONE_COMMERCIALI.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        <select value={agenteFiltro} onChange={(e) => setAgenteFiltro(e.target.value)} className={selectClass}>
          <option value="">Tutti gli agenti</option>
          {VENDITORI.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-xs text-dgray/50 mb-2">
            {filtrate.length} macchin{filtrate.length === 1 ? 'a' : 'e'} trovat{filtrate.length === 1 ? 'a' : 'e'}
          </p>

          {filtrate.length === 0 ? (
            <div className="bg-white border border-gray/60 rounded-lg p-6">
              <p className="text-dgray/70">Nessuna macchina corrisponde ai filtri selezionati.</p>
            </div>
          ) : (
            <>
              {/* Mobile: elenco a card */}
              <div className="space-y-3 md:hidden">
                {filtrate.map((m) => (
                  <div key={m.id} className="bg-white border border-gray/60 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={`/clienti/${m.cliente_id}`}
                        className="font-medium hover:text-bronze transition-colors"
                      >
                        {m.clienti?.ragione_sociale || '—'}
                      </Link>
                      <OrigineBadge origine={m.origine} />
                    </div>
                    <p className="text-sm text-dgray">
                      <span className="font-medium">{m.marchi?.nome || '—'}</span> — {m.categoria}
                    </p>
                    {(m.modello || m.anno_installazione) && (
                      <p className="text-sm text-dgray/70">
                        {m.modello || '—'}
                        {m.anno_installazione ? ` (${m.anno_installazione})` : ''}
                      </p>
                    )}
                    <p className={`text-sm mt-1 ${STATO_CLASS[m.stato] || ''}`}>
                      {STATO_LABEL[m.stato] || m.stato}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-dgray/50">
                        {m.inserito_da} — {m.updated_at ? new Date(m.updated_at).toLocaleDateString('it-IT') : '—'}
                      </p>
                      <Link
                        to={`/clienti/${m.cliente_id}`}
                        className="flex items-center gap-1 text-xs font-medium text-bronze hover:text-dgray transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifica
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabella */}
              <div className="hidden md:block bg-white border border-gray/60 rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray/40 text-left text-xs uppercase tracking-wide text-dgray/50">
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Origine</th>
                      <th className="px-4 py-3 font-medium">Marchio</th>
                      <th className="px-4 py-3 font-medium">Categoria</th>
                      <th className="px-4 py-3 font-medium">Modello</th>
                      <th className="px-4 py-3 font-medium">Anno</th>
                      <th className="px-4 py-3 font-medium">Stato</th>
                      <th className="px-4 py-3 font-medium">Inserito da</th>
                      <th className="px-4 py-3 font-medium">Aggiornato</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrate.map((m) => (
                      <tr key={m.id} className="border-b border-gray/20 last:border-0 hover:bg-offwhite/60">
                        <td className="px-4 py-3">
                          <Link to={`/clienti/${m.cliente_id}`} className="font-medium hover:text-bronze transition-colors">
                            {m.clienti?.ragione_sociale || '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <OrigineBadge origine={m.origine} />
                        </td>
                        <td className="px-4 py-3">{m.marchi?.nome || '—'}</td>
                        <td className="px-4 py-3">{m.categoria}</td>
                        <td className="px-4 py-3">{m.modello || '—'}</td>
                        <td className="px-4 py-3">{m.anno_installazione || '—'}</td>
                        <td className={`px-4 py-3 ${STATO_CLASS[m.stato] || ''}`}>
                          {STATO_LABEL[m.stato] || m.stato}
                        </td>
                        <td className="px-4 py-3 text-dgray/60">{m.inserito_da}</td>
                        <td className="px-4 py-3 text-dgray/60">
                          {m.updated_at ? new Date(m.updated_at).toLocaleDateString('it-IT') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/clienti/${m.cliente_id}`}
                            className="flex items-center gap-1 text-xs font-medium text-bronze hover:text-dgray transition-colors whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifica
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
