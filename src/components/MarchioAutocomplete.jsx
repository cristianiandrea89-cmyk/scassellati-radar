import { useState, useRef, useEffect, useMemo } from 'react'
import { ORIGINE_MACCHINA_TO_MARCHIO } from '../lib/marchi'

export default function MarchioAutocomplete({ marchi, origine, value, onSelect, onCreate, disabled }) {
  const selezionato = marchi.find((m) => m.id === value)
  const [inputText, setInputText] = useState(selezionato?.nome || '')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setInputText(selezionato?.nome || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const origineMarchio = ORIGINE_MACCHINA_TO_MARCHIO[origine]

  const suggerimenti = useMemo(() => {
    if (!origineMarchio) return []
    const testo = inputText.trim().toLowerCase()
    return marchi
      .filter((m) => m.origine === origineMarchio)
      .filter((m) => !testo || m.nome.toLowerCase().startsWith(testo))
      .slice(0, 8)
  }, [marchi, origineMarchio, inputText])

  const esisteEsatto = marchi.some(
    (m) => m.origine === origineMarchio && m.nome.trim().toLowerCase() === inputText.trim().toLowerCase()
  )

  function handleChange(e) {
    setInputText(e.target.value)
    setOpen(true)
    if (!e.target.value) onSelect(null)
  }

  function handleBlur() {
    // Se l'utente ha scritto esattamente il nome di un marchio esistente ma non ha
    // cliccato il suggerimento (es. per fretta sul campo), lo selezioniamo comunque:
    // altrimenti il salvataggio fallisce in silenzio perché marchioId resta vuoto.
    if (value) return
    const testo = inputText.trim().toLowerCase()
    if (!testo) return
    const match = marchi.find((m) => m.origine === origineMarchio && m.nome.trim().toLowerCase() === testo)
    if (match) {
      setInputText(match.nome)
      onSelect(match)
    }
  }

  function handleSelect(m) {
    setInputText(m.nome)
    setOpen(false)
    onSelect(m)
  }

  async function handleCreate() {
    const nome = inputText.trim()
    if (!nome || creating) return
    setCreating(true)
    try {
      const nuovo = await onCreate(nome)
      setInputText(nuovo.nome)
      setOpen(false)
      onSelect(nuovo)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputText}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={disabled ? "Scegli prima l'origine" : 'Cerca o aggiungi marchio…'}
        className="w-full border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none disabled:bg-gray/10"
      />
      {open && !disabled && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray/40 rounded-sm max-h-56 overflow-auto">
          {suggerimenti.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => handleSelect(m)}
                className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-sm hover:bg-offwhite transition-colors"
              >
                <span>{m.nome}</span>
                {!m.verificato && <span className="text-[10px] text-bronze shrink-0">da verificare</span>}
              </button>
            </li>
          ))}

          {inputText.trim() && !esisteEsatto && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-sm text-bronze hover:bg-offwhite transition-colors disabled:opacity-50"
              >
                {creating ? 'Aggiungo…' : `+ Aggiungi nuovo marchio: "${inputText.trim()}"`}
              </button>
            </li>
          )}

          {suggerimenti.length === 0 && !inputText.trim() && (
            <li className="px-3 py-2 text-sm text-dgray/40">Nessun marchio disponibile</li>
          )}
        </ul>
      )}
    </div>
  )
}
