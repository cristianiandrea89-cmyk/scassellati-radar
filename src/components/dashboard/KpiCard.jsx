export default function KpiCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-gray/60 rounded-lg p-5">
      <p className="text-xs uppercase tracking-wide text-dgray/50 mb-1">{label}</p>
      <p className={`text-3xl font-semibold ${accent ? 'text-bronze' : 'text-dgray'}`}>{value}</p>
    </div>
  )
}
