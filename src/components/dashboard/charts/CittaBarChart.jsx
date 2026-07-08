import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts'
import ChartTooltip from '../ChartTooltip'
import { BRONZE, GRID, AXIS_TEXT } from '../../../lib/chartColors'

export default function CittaBarChart({ data }) {
  const height = Math.max(200, data.length * 32 + 20)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={{ fill: AXIS_TEXT, fontSize: 12 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="citta"
          width={130}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="count" name="Clienti" fill={BRONZE} radius={[0, 4, 4, 0]} barSize={18}>
          <LabelList dataKey="count" position="right" fill={AXIS_TEXT} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
