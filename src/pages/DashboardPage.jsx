import { useState, useEffect, useMemo } from 'react'
import {
  fetchMacchineDashboard,
  filtraMacchine,
  calcolaKpi,
  distribuzioneOrigine,
  distribuzionePerCategoria,
  distribuzionePerMarchio,
  origineByCategoria,
  distribuzionePerCitta,
} from '../lib/dashboardData'
import { fetchMarchi } from '../lib/marchi'
import { CATEGORIE_MACCHINA, STATI_MACCHINA, ZONE_COMMERCIALI, VENDITORI } from '../lib/constants'
import KpiCard from '../components/dashboard/KpiCard'
import ChartCard from '../components/dashboard/ChartCard'
import MultiSelectDropdown from '../components/dashboard/MultiSelectDropdown'
import OrigineDonutChart from '../components/dashboard/charts/OrigineDonutChart'
import CategoriaBarChart from '../components/dashboard/charts/CategoriaBarChart'
import MarchioBarChart from '../components/dashboard/charts/MarchioBarChart'
import OrigineCategoriaBarChart from '../components/dashboard/charts/OrigineCategoriaBarChart'
import CittaBarChart from '../components/dashboard/charts/CittaBarChart'

const filtriVuoti = {
  origine: 'tutte',
  marchioIds: [],
  categorie: [],
  stati: [],
  zona: '',
  agente: '',
}

const selectClass =
  'border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none bg-white'

export default function DashboardPage() {
  const [macchine, setMacchine] = useState([])
  const [marchi, setMarchi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtri, setFiltri] = useState(filtriVuoti)

  useEffect(() => {
    Promise.all([fetchMacchineDashboard(), fetchMarchi().catch(() => [])])
      .then(([macchineData, marchiData]) => {
        setMacchine(macchineData)
        setMarchi(marchiData)
      })
      .catch((err) => setError(err.message || 'Errore nel caricamento dei dati'))
      .finally(() => setLoading(false))
  }, [])

  const macchineFiltrate = useMemo(() => filtraMacchine(macchine, filtri), [macchine, filtri])

  const kpi = useMemo(() => calcolaKpi(macchineFiltrate), [macchineFiltrate])
  const datiOrigine = useMemo(() => distribuzioneOrigine(macchineFiltrate), [macchineFiltrate])
  const datiCategoria = useMemo(() => distribuzionePerCategoria(macchineFiltrate), [macchineFiltrate])
  const datiMarchio = useMemo(() => distribuzionePerMarchio(macchineFiltrate), [macchineFiltrate])
  const datiOrigineCategoria = useMemo(() => origineByCategoria(macchineFiltrate), [macchineFiltrate])
  const datiCitta = useMemo(() => distribuzionePerCitta(macchineFiltrate), [macchineFiltrate])

  const nessunDato = !loading && !error && macchineFiltrate.length === 0

  function resetFiltri() {
    setFiltri(filtriVuoti)
  }

  const filtriAttivi =
    filtri.origine !== 'tutte' ||
    filtri.marchioIds.length > 0 ||
    filtri.categorie.length > 0 ||
    filtri.stati.length > 0 ||
    filtri.zona !== '' ||
    filtri.agente !== ''

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-6">Dashboard</h1>

      <div className="bg-white border border-gray/60 rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[
            { value: 'tutte', label: 'Tutte' },
            { value: 'nostra', label: 'Nostra' },
            { value: 'concorrenza', label: 'Concorrenza' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFiltri((f) => ({ ...f, origine: value }))}
              className={`px-3 py-2 rounded-sm border text-sm font-medium transition-colors ${
                filtri.origine === value
                  ? 'bg-bronze border-bronze text-dgray'
                  : 'border-gray/40 text-dgray hover:border-bronze hover:text-bronze'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <MultiSelectDropdown
          label="Marchio"
          allLabel="Tutti i marchi"
          options={marchi.map((m) => ({ value: m.id, label: m.nome }))}
          selected={filtri.marchioIds}
          onChange={(marchioIds) => setFiltri((f) => ({ ...f, marchioIds }))}
        />

        <MultiSelectDropdown
          label="Categoria"
          allLabel="Tutte le categorie"
          options={CATEGORIE_MACCHINA.map((c) => ({ value: c, label: c }))}
          selected={filtri.categorie}
          onChange={(categorie) => setFiltri((f) => ({ ...f, categorie }))}
        />

        <MultiSelectDropdown
          label="Stato"
          allLabel="Tutti gli stati"
          options={STATI_MACCHINA.map((s) => ({ value: s.value, label: s.label }))}
          selected={filtri.stati}
          onChange={(stati) => setFiltri((f) => ({ ...f, stati }))}
        />

        <select
          value={filtri.zona}
          onChange={(e) => setFiltri((f) => ({ ...f, zona: e.target.value }))}
          className={selectClass}
        >
          <option value="">Tutte le zone</option>
          {ZONE_COMMERCIALI.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>

        <select
          value={filtri.agente}
          onChange={(e) => setFiltri((f) => ({ ...f, agente: e.target.value }))}
          className={selectClass}
        >
          <option value="">Tutti gli agenti</option>
          {VENDITORI.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {filtriAttivi && (
          <button
            type="button"
            onClick={resetFiltri}
            className="text-sm text-dgray/60 hover:text-bronze transition-colors ml-auto"
          >
            Reset filtri
          </button>
        )}
      </div>

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Totale macchine" value={kpi.totaleMacchine} />
            <KpiCard label="Totale clienti" value={kpi.totaleClienti} />
            <KpiCard label="% nostre" value={`${kpi.percentualeNostre}%`} />
            <KpiCard label="Da sostituire" value={kpi.daSostituire} accent />
          </div>

          {nessunDato ? (
            <div className="bg-white border border-gray/60 rounded-lg p-10 text-center">
              <p className="text-dgray/70">Nessun dato per i filtri selezionati.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ChartCard title="Nostra vs Concorrenza">
                <OrigineDonutChart data={datiOrigine} />
              </ChartCard>

              <ChartCard title="Distribuzione per categoria macchina">
                <CategoriaBarChart data={datiCategoria} />
              </ChartCard>

              <ChartCard title="Top marchi per numero di macchine">
                <MarchioBarChart data={datiMarchio} />
              </ChartCard>

              <ChartCard title="Nostra vs Concorrenza per categoria">
                <OrigineCategoriaBarChart data={datiOrigineCategoria} />
              </ChartCard>

              <ChartCard title="Clienti per città (stima da indirizzo)" isEmpty={datiCitta.length === 0}>
                <CittaBarChart data={datiCitta} />
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}
