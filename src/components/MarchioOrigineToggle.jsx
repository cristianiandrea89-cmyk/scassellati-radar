const OPZIONI = [
  { value: 'nostro', label: 'Nostro' },
  { value: 'concorrenza', label: 'Concorrenza' },
]

export default function MarchioOrigineToggle({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {OPZIONI.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-sm border text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-bronze border-bronze text-dgray'
              : 'border-gray/40 text-dgray hover:border-bronze hover:text-bronze'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
