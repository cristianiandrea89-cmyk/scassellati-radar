import { X, Copy } from 'lucide-react'
import { CATEGORIE_MACCHINA, STATI_MACCHINA, ANNI_MACCHINA } from '../lib/constants'
import MarchioAutocomplete from './MarchioAutocomplete'

const fieldClass =
  'w-full border border-gray/40 rounded-sm px-3 py-2 text-sm focus:border-bronze outline-none'
const labelClass = 'block text-xs font-medium mb-1'

export default function MacchinaRowFields({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  onDuplicate,
  marchi,
  onMarchioCreato,
}) {
  function handleOrigineChange(origine) {
    onChange('origine', origine)
    onChange('marchioId', null)
  }

  return (
    <div className="relative border border-gray/40 rounded-md bg-offwhite/60 p-4">
      {(onDuplicate || canRemove) && (
        <div className="absolute top-3 right-3 flex items-center gap-3">
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Duplica macchina ${index + 1}`}
              title="Duplica macchina"
              className="text-gray hover:text-bronze transition-colors"
            >
              <Copy size={16} strokeWidth={1.5} />
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Rimuovi macchina ${index + 1}`}
              className="text-gray hover:text-bronze transition-colors"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      <p className="text-xs font-medium uppercase tracking-wide text-dgray/50 mb-3">
        Macchina {index + 1}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_0.8fr_0.7fr] gap-3">
        <div className="min-w-0">
          <label className={labelClass}>Origine *</label>
          <div className="flex gap-2">
            {[
              { value: 'nostra', label: 'Nostra' },
              { value: 'concorrenza', label: 'Concorrenza' },
            ].map(({ value: v, label }) => (
              <button
                type="button"
                key={v}
                onClick={() => handleOrigineChange(v)}
                className={`flex-1 min-w-0 px-2 py-2 rounded-sm border text-xs font-medium truncate transition-colors ${
                  value.origine === v
                    ? 'bg-bronze border-bronze text-dgray'
                    : 'border-gray/40 text-dgray hover:border-bronze hover:text-bronze'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Marchio *</label>
          <MarchioAutocomplete
            marchi={marchi}
            origine={value.origine}
            value={value.marchioId}
            disabled={!value.origine}
            onSelect={(m) => onChange('marchioId', m?.id ?? null)}
            onCreate={(nome) => onMarchioCreato(nome, value.origine)}
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Categoria *</label>
          <select
            value={value.categoria}
            onChange={(e) => onChange('categoria', e.target.value)}
            className={fieldClass}
          >
            {CATEGORIE_MACCHINA.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Modello</label>
          <input
            type="text"
            value={value.modello}
            onChange={(e) => onChange('modello', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass}>Anno</label>
          <select
            value={value.anno}
            onChange={(e) => onChange('anno', e.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            {ANNI_MACCHINA.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 mt-3 ${
          value.quantita !== undefined ? 'md:grid-cols-[1fr_0.6fr_1.4fr]' : 'md:grid-cols-2'
        }`}
      >
        <div className="min-w-0">
          <label className={labelClass}>Stato</label>
          <select
            value={value.stato}
            onChange={(e) => onChange('stato', e.target.value)}
            className={fieldClass}
          >
            {STATI_MACCHINA.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {value.quantita !== undefined && (
          <div className="min-w-0">
            <label className={labelClass}>Quantità</label>
            <input
              type="number"
              min="1"
              value={value.quantita}
              onChange={(e) => onChange('quantita', e.target.value)}
              title="Macchine identiche (stesso marchio, categoria, modello) da aggiungere insieme"
              className={fieldClass}
            />
          </div>
        )}
        <div className="min-w-0">
          <label className={labelClass}>Note</label>
          <input
            type="text"
            value={value.note}
            onChange={(e) => onChange('note', e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      {value.quantita !== undefined && Number(value.quantita) > 1 && (
        <p className="text-xs text-dgray/50 mt-2">
          Verranno create {value.quantita} macchine identiche (stesso marchio, categoria, modello e anno).
        </p>
      )}
    </div>
  )
}
