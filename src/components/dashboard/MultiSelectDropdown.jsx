import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MultiSelectDropdown({ label, allLabel, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(value) {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value))
    else onChange([...selected, value])
  }

  const buttonLabel = selected.length === 0 ? allLabel : `${selected.length} selezionat${selected.length === 1 ? 'o' : 'i'}`

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 border border-gray/40 rounded-sm px-3 py-2 text-sm bg-white hover:border-bronze transition-colors"
      >
        <span className="text-dgray/50">{label}:</span>
        <span>{buttonLabel}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-dgray/40" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-56 bg-white border border-gray/40 rounded-sm max-h-64 overflow-auto shadow-sm">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-offwhite cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-bronze"
              />
              {opt.label}
            </label>
          ))}
          {options.length === 0 && <p className="px-3 py-2 text-sm text-dgray/40">Nessuna opzione</p>}
        </div>
      )}
    </div>
  )
}
