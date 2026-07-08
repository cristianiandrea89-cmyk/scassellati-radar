// Geocoding via Nominatim (OpenStreetMap) — gratuito, nessuna API key richiesta.
// Uso a basso volume (rete vendita interna): rispettiamo la policy con un timeout
// e senza chiamate ripetute non necessarie (debounce lato componente autocomplete).
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const REQUEST_TIMEOUT_MS = 8000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Nominatim ha risposto ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function searchAddress(query) {
  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`
  const results = await fetchWithTimeout(url)
  return results.map((r) => ({
    label: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }))
}

export async function geocodeAddress(address) {
  const results = await searchAddress(address)
  if (!results.length) throw new Error('Geocoding fallito: nessun risultato trovato')
  const best = results[0]
  return { lat: best.lat, lng: best.lng, formattedAddress: best.label }
}

export async function reverseGeocode(lat, lng) {
  const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lng}`
  const result = await fetchWithTimeout(url)
  if (!result || !result.display_name) throw new Error('Impossibile determinare un indirizzo dalla posizione attuale')
  return { address: result.display_name, lat, lng }
}
