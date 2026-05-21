'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'

const DATA = [
  { semana: 'Jan', cmv: 32.8 },
  { semana: 'Fev', cmv: 34.1 },
  { semana: 'Mar', cmv: 35.2 },
  { semana: 'Abr', cmv: 34.6 },
  { semana: 'Mai', cmv: 34.2 },
]

export default function CMVEvolucaoChart() {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 11, fill: '#999', fontFamily: 'Inter' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          domain={[27, 38]}
          tick={{ fontSize: 11, fill: '#999', fontFamily: 'Inter' }}
          tickFormatter={v => `${v}%`}
          axisLine={false} tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'CMV Teórico']}
          contentStyle={{
            background: '#fff', border: '1px solid #e8e8e6',
            borderRadius: 8, fontSize: 12, fontFamily: 'Inter',
          }}
        />
        <ReferenceLine y={30} stroke="#ccc" strokeDasharray="5 4" strokeWidth={1.5} />
        <Line
          type="monotone" dataKey="cmv"
          stroke="#97A624" strokeWidth={2}
          dot={{ fill: '#97A624', r: 4 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
