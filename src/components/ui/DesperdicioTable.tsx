import type { DesperdicioPorUnidade } from '@/types'

const brlK = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`

const DOT_COLORS = [
  '#97A624','#009e74','#8C1414','#D9B504','#e67e22',
  '#c0392b','#2980b9','#D9B504','#555','#009e74',
]

export default function DesperdicioTable({ data }: { data: DesperdicioPorUnidade[] }) {
  const grand = data.reduce((s, r) => s + r.total, 0)
  const max   = Math.max(...data.map(r => r.total))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {['Loja','Jan','Fev','Mar','Abr','Mai','Total','vs Média'].map(h => (
              <th key={h} className="px-4 py-2 text-[10px] font-semibold text-[#aaa]
                                     uppercase tracking-wide text-right first:text-left
                                     border-b border-[#e8e8e6]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const avgRow = grand / data.length
            const vs = ((row.total - avgRow) / avgRow * 100).toFixed(1)
            const vsClass = parseFloat(vs) > 15
              ? 'text-[#c0392b] font-semibold'
              : parseFloat(vs) < -15
              ? 'text-[#2d6a00] font-semibold'
              : 'text-[#888]'

            return (
              <tr key={row.unidade} className="hover:bg-[#fafaf8]">
                <td className="px-4 py-2.5 border-b border-[#f3f3f1]">
                  <div className="flex items-center gap-2 font-medium text-[#111]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: DOT_COLORS[i % DOT_COLORS.length] }} />
                    {row.unidade}
                    <span className="text-[10px] text-[#aaa] font-normal">
                      {(row.total / grand * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* mini bar */}
                  <div className="mt-1 ml-4 h-[2px] bg-[#f0f0ee] rounded-full w-16 overflow-hidden">
                    <div className="h-full rounded-full"
                         style={{
                           width: `${(row.total / max * 100).toFixed(0)}%`,
                           background: DOT_COLORS[i % DOT_COLORS.length],
                         }} />
                  </div>
                </td>
                {[row.jan, row.fev, row.mar, row.abr, row.mai].map((v, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-right border-b border-[#f3f3f1]
                                          font-mono text-[11px] text-[#555]">
                    {brlK(v)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right border-b border-[#f3f3f1]
                               font-mono text-[12px] font-semibold text-[#111]">
                  {brlK(row.total)}
                </td>
                <td className={`px-4 py-2.5 text-right border-b border-[#f3f3f1]
                                font-mono text-[11px] ${vsClass}`}>
                  {parseFloat(vs) > 0 ? '+' : ''}{vs}%
                </td>
              </tr>
            )
          })}
          {/* Total row */}
          <tr className="bg-[#fafaf8] font-semibold">
            <td className="px-4 py-2.5 text-[#111]">TOTAL</td>
            {(['jan','fev','mar','abr','mai'] as const).map(m => (
              <td key={m} className="px-4 py-2.5 text-right font-mono text-[11px] text-[#111]">
                {brlK(data.reduce((s,r) => s + r[m], 0))}
              </td>
            ))}
            <td className="px-4 py-2.5 text-right font-mono text-[12px] text-[#111]">
              {brlK(grand)}
            </td>
            <td className="px-4 py-2.5 text-right text-[#aaa] text-[11px]">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
