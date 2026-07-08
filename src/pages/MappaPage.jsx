import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabaseClient'

const ITALY_CENTER = [42.5, 12.5]
const ITALY_ZOOM = 6

const COLORI = {
  verde: '#2e7d32',
  rosso: '#c62828',
  giallo: '#eab308',
}

function creaIcona(colore) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${colore};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  })
}

const ICONE = {
  verde: creaIcona(COLORI.verde),
  rosso: creaIcona(COLORI.rosso),
  giallo: creaIcona(COLORI.giallo),
}

export default function MappaPage() {
  const [clienti, setClienti] = useState([])
  const [macchine, setMacchine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [clientiRes, macchineRes] = await Promise.all([
        supabase.from('clienti').select('id, ragione_sociale, indirizzo, lat, lng'),
        supabase.from('macchine_installate').select('id, cliente_id, origine, categoria, stato, marchi(nome)'),
      ])

      if (clientiRes.error) {
        setError(clientiRes.error.message)
      } else if (macchineRes.error) {
        setError(macchineRes.error.message)
      } else {
        setClienti(clientiRes.data || [])
        setMacchine(macchineRes.data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const clientiConPin = useMemo(() => {
    return clienti
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => {
        const macchineCliente = macchine.filter((m) => m.cliente_id === c.id)
        const hasNostra = macchineCliente.some((m) => m.origine === 'nostra')
        const hasConcorrenza = macchineCliente.some((m) => m.origine === 'concorrenza')
        let colore = 'giallo'
        if (hasNostra && !hasConcorrenza) colore = 'verde'
        else if (hasConcorrenza && !hasNostra) colore = 'rosso'
        return { ...c, macchine: macchineCliente, colore }
      })
  }, [clienti, macchine])

  const clientiSenzaCoordinate = clienti.length - clientiConPin.length

  const bounds = useMemo(() => {
    if (clientiConPin.length < 2) return null
    return clientiConPin.map((c) => [c.lat, c.lng])
  }, [clientiConPin])

  const singlePoint = clientiConPin.length === 1 ? clientiConPin[0] : null

  return (
    <div>
      <h1 className="font-heading font-extrabold uppercase text-3xl md:text-4xl mb-6">
        Mappa clienti
      </h1>

      {loading && <p className="text-dgray/50 text-sm">Caricamento…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white border border-gray/60 rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <MapContainer
              center={singlePoint ? [singlePoint.lat, singlePoint.lng] : ITALY_CENTER}
              zoom={singlePoint ? 13 : ITALY_ZOOM}
              bounds={bounds || undefined}
              boundsOptions={{ padding: [40, 40] }}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {clientiConPin.map((c) => (
                <Marker key={c.id} position={[c.lat, c.lng]} icon={ICONE[c.colore]}>
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-semibold mb-1">{c.ragione_sociale}</p>
                      {c.macchine.length === 0 ? (
                        <p className="text-dgray/50 mb-2">Nessuna macchina censita</p>
                      ) : (
                        <ul className="space-y-0.5 mb-2">
                          {c.macchine.map((m) => (
                            <li key={m.id}>
                              {m.marchi?.nome} — {m.categoria}{' '}
                              <span className="text-dgray/50">
                                ({m.origine === 'nostra' ? 'nostra' : 'concorrenza'})
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link to={`/clienti/${c.id}`} className="text-bronze hover:underline">
                        Vedi scheda cliente
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-dgray/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORI.verde }} />
              Solo nostre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORI.rosso }} />
              Solo concorrenza
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORI.giallo }} />
              Miste
            </span>
          </div>

          {clientiSenzaCoordinate > 0 && (
            <p className="text-xs text-dgray/50 mt-2">
              {clientiSenzaCoordinate} client{clientiSenzaCoordinate === 1 ? 'e' : 'i'} senza indirizzo
              geocodificato {clientiSenzaCoordinate === 1 ? 'non compare' : 'non compaiono'} sulla mappa.
            </p>
          )}
        </>
      )}
    </div>
  )
}
