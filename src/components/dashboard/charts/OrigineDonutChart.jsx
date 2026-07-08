import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import ChartTooltip from '../ChartTooltip'
import { BRONZE, CONCORRENZA_GRAY } from '../../../lib/chartColors'

const COLORI = [BRONZE, CONCORRENZA_GRAY]

export default function OrigineDonutChart({ data }) {
  const totale = data.reduce((s, d) => s + d.value, 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 24, right: 24, bottom: 8, left: 24 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          label={({ name, value }) => `${name} ${totale ? Math.round((value / totale) * 100) : 0}%`}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={COLORI[i % COLORI.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend verticalAlign="bottom" height={24} />
      </PieChart>
    </ResponsiveContainer>
  )
}
