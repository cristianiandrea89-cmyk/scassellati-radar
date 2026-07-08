import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { reverseGeocode } from '../lib/geocoding'

export default function UseMyLocationButton({ onLocate, className = '' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata su questo dispositivo.')
      return
    }
    setError('')
    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          onLocate(result)
        } catch (err) {
          setError(err.message || "Impossibile determinare l'indirizzo dalla posizione.")
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Permesso di localizzazione negato o posizione non disponibile.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium text-bronze hover:underline disabled:opacity-50"
      >
        <MapPin className="w-3.5 h-3.5" />
        {loading ? 'Localizzazione…' : 'Usa la mia posizione'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
