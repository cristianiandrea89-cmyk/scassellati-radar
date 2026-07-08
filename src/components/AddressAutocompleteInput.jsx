import { useEffect, useRef, useState } from 'react'
import { searchAddress } from '../lib/geocoding'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 3

export default function AddressAutocompleteInput({
  value,
  onChange,
  onPlaceSelected,
  className,
  placeholder,
  required,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function handleChange(e) {
    onChange(e)
    const query = e.target.value

    clearTimeout(debounceRef.current)
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(query)
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, DEBOUNCE_MS)
  }

  function handleSelect(result) {
    setSuggestions([])
    setOpen(false)
    onPlaceSelected({ address: result.label, lat: result.lat, lng: result.lng })
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={value}
        onChange={handleChange}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray/40 rounded-sm max-h-56 overflow-auto">
          {suggestions.map((s) => (
            <li key={`${s.lat},${s.lng}`}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-offwhite transition-colors"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
