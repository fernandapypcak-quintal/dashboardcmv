import { useCMV } from '../../hooks/useCMV';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const brlK = v => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const CORES = ['#97A624','#009e74','#8C1414','#D9B504','#e67e22','#c0392b','#2980b9','#777','#555','#009e74'];

export default function Desperdicio() {
  const { desperdicio, desperdicioByUnidade } = useCMV();

  // Por classificação
  const porClassificacao = desperdicio.reduce((acc, r) => {
    const k = r.classificacao || 'Sem classificação';
    acc[k] = (acc[k] || 0) + r.custoTotal;
    return acc;
  }, {});
  const classificacaoData = Object.entries(porClassificacao)
    .map(([k, v]) => ({ nome: k, total: parseFloat(v.toFixed(2)) }))
    .sort((a,b) => b.total - a.total);

  // Por unidade para o bar chart
  const unidadeData = desperdicioByUnidade.map(r => ({ nome: r.unidade.split(' ').at(-1), total: r.total }));

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por unidade */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Desperdício por loja</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={unidadeData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={v => brlK(v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [brlK(v), 'Desperdício']}
                  contentStyle={{ background: '#fff', border: '1px solid #e8e8e2', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" radius={[4,4,0,0]}>
                  {unidadeData.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por classificação */}
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Por motivo</p>
          </div>
          <div className="p-4 space-y-2 max-h-[280px] overflow-y-auto">
            {classificacaoData.map((item, i) => {
              const total = classificacaoData.reduce((s,r) => s + r.total, 0);
              const pct = total > 0 ? (item.total / total * 100) : 0;
              return (
                <div key={item.nome}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] text-brand-black font-medium">{item.nome}</span>
                    <span className="text-[11px] font-mono text-zinc-500">{brlK(item.total)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-olive transition-all"
                         style={{ width: `${pct.toFixed(0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Lançamentos detalhados</p>
          <p className="text-xs text-zinc-400 mt-0.5">{desperdicio.length} registros no período</p>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-surface-card">
              <tr className="border-b border-surface-border">
                {['Data','Unidade','Produto','Qtd','Custo Total','Classificação'].map(h => (
                  <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desperdicio.slice(0, 200).map((r, i) => (
                <tr key={i} className="hover:bg-surface-muted border-b border-surface-border">
                  <td className="px-4 py-2 text-zinc-500 whitespace-nowrap">{r.data}</td>
                  <td className="px-4 py-2 font-medium text-brand-black">{r.unidade}</td>
                  <td className="px-4 py-2 text-zinc-700">{r.produto}</td>
                  <td className="px-4 py-2 font-mono text-zinc-500">{r.quantidade}</td>
                  <td className="px-4 py-2 font-mono text-zinc-600">{brlK(r.custoTotal)}</td>
                  <td className="px-4 py-2">
                    <span className="text-[11px] bg-surface-muted px-2 py-0.5 rounded-full text-zinc-600">{r.classificacao}</span>
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
