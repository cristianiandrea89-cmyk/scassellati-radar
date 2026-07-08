import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts'
import ChartTooltip from '../ChartTooltip'
import { BRONZE, GRID, AXIS_TEXT } from '../../../lib/chartColors'

const TOP_N = 10

export default function MarchioBarChart({ data }) {
  const [espanso, setEspanso] = useState(false)
  const visibili = espanso ? data : data.slice(0, TOP_N)
  const height = Math.max(200, visibili.length * 32 + 20)

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={visibili} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" tick={{ fill: AXIS_TEXT, fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="marchio"
            width={130}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" name="Macchine" fill={BRONZE} radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" fill={AXIS_TEXT} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > TOP_N && (
        <button
          type="button"
          onClick={() => setEspanso((e) => !e)}
          className="text-xs text-bronze hover:underline mt-2"
        >
          {espanso ? 'Mostra solo i primi 10' : `Mostra tutti (${data.length})`}
        </button>
      )}
    </div>
  )
}
