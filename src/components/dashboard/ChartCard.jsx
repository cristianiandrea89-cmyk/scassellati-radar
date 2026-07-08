export default function ChartCard({ title, children, isEmpty }) {
  return (
    <div className="bg-white border border-gray/60 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-dgray mb-4">{title}</h3>
      {isEmpty ? (
        <p className="text-sm text-dgray/50 py-12 text-center">Nessun dato per i filtri selezionati.</p>
      ) : (
        children
      )}
    </div>
  )
}
