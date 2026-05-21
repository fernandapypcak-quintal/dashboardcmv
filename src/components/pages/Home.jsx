import { useCMV } from '../../hooks/useCMV';
import KpiCard from '../ui/KpiCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const brlK = v => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const CORES = ['#97A624','#009e74','#8C1414','#D9B504','#e67e22','#c0392b','#2980b9','#D9B504','#555','#009e74'];

export default function Home() {
  const { kpis, evolucaoCMV, desperdicioByUnidade, fichas } = useCMV();

  const criticos = fichas.filter(r => r.cmvPct > 1).slice(0, 4);
  const grandTotal = desperdicioByUnidade.reduce((s,r) => s + r.total, 0);
  const maxDesp    = Math.max(...desperdicioByUnidade.map(r => r.total), 1);
  const mesesVisiveis = desperdicioByUnidade[0]
    ? Object.keys(desperdicioByUnidade[0].porMes)
    : [];

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="CMV Médio Teórico"
          value={`${(kpis.cmvMedio * 100).toFixed(1)}%`}
          sub={kpis.cmvMedio > 0.30 ? `↑ acima da meta 30%` : `✓ dentro da meta 30%`}
          subOk={kpis.cmvMedio <= 0.30}
        />
        <KpiCard
          label="Desperdício Acum."
          value={brlK(kpis.totalDesp)}
          sub="custo de perdas no período"
        />
        <KpiCard
          label="Itens Críticos"
          value={String(kpis.criticos)}
          sub="CMV acima de 100%"
          subOk={kpis.criticos === 0}
        />
        <KpiCard
          label="Itens em Atenção"
          value={String(kpis.atencao)}
          sub="CMV entre 30% e 100%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico evolução */}
        <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Evolução do CMV Teórico</p>
            <p className="text-xs text-zinc-400 mt-0.5">% por semana · linha tracejada = meta 30%</p>
          </div>
          <div className="p-5">
            {evolucaoCMV.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={evolucaoCMV} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto','auto']} tick={{ fontSize: 11, fill: '#999' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'CMV']}
                    contentStyle={{ background: '#fff', border: '1px solid #e8e8e2', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={30} stroke="#ccc" strokeDasharray="5 4" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="cmv" stroke="#97A624" strokeWidth={2}
                    dot={{ fill: '#97A624', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-zinc-400">
                Sem histórico disponível ainda
              </div>
            )}
          </div>
        </div>

        {/* Alertas críticos */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Alertas críticos</p>
            <p className="text-xs text-zinc-400 mt-0.5">CMV acima de 100%</p>
          </div>
          <div className="p-4 space-y-2">
            {criticos.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">Nenhum item crítico ✓</p>
            )}
            {criticos.map(item => (
              <div key={item.codPa} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-[12.5px] font-medium text-brand-black">{item.nomePa}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-zinc-500">{item.subcategoria}</span>
                  <span className="text-[12px] font-bold text-brand-crimson">
                    {(item.cmvPct * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Sugerido: R$ {item.precoSugerido.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela desperdício */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex justify-between items-center">
          <p className="font-semibold text-brand-black text-sm">Desperdício por loja</p>
          <p className="text-xs text-zinc-400">acumulado no período</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr>
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left border-b border-surface-border">Loja</th>
                {mesesVisiveis.map(m => (
                  <th key={m} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right border-b border-surface-border capitalize">{m.slice(0,3)}</th>
                ))}
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right border-b border-surface-border">Total</th>
              </tr>
            </thead>
            <tbody>
              {desperdicioByUnidade.map((row, i) => (
                <tr key={row.unidade} className="hover:bg-surface-muted">
                  <td className="px-4 py-2.5 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: CORES[i % CORES.length] }} />
                      <span className="font-medium text-brand-black">{row.unidade}</span>
                      <span className="text-[10px] text-zinc-400">
                        {grandTotal > 0 ? (row.total / grandTotal * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="mt-1 ml-4 h-[2px] bg-surface-muted rounded-full w-16 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(row.total/maxDesp*100).toFixed(0)}%`, background: CORES[i%CORES.length] }} />
                    </div>
                  </td>
                  {mesesVisiveis.map(m => (
                    <td key={m} className="px-4 py-2.5 text-right border-b border-surface-border font-mono text-[11px] text-zinc-500">
                      {brlK(row.porMes[m] ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right border-b border-surface-border font-mono text-[12px] font-semibold text-brand-black">
                    {brlK(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
