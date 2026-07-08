import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import ChartTooltip from '../ChartTooltip'
import { BRONZE, CONCORRENZA_GRAY, GRID, AXIS_TEXT } from '../../../lib/chartColors'

export default function OrigineCategoriaBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="categoria"
          tick={{ fill: AXIS_TEXT, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={70}
        />
        <YAxis tick={{ fill: AXIS_TEXT, fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="nostra" name="Nostra" fill={BRONZE} radius={[4, 4, 0, 0]} barSize={16} />
        <Bar dataKey="concorrenza" name="Concorrenza" fill={CONCORRENZA_GRAY} radius={[4, 4, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
