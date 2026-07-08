export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white border border-gray/40 rounded-sm px-3 py-2 text-sm shadow-sm">
      {label && <p className="text-dgray/50 text-xs mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-0.5" style={{ background: entry.color }} />
          <span className="font-semibold text-dgray">{entry.value}</span>
          <span className="text-dgray/50">{entry.name}</span>
        </p>
      ))}
    </div>
  )
}
