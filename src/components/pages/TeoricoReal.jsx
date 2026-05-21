import { useCMV } from '../../hooks/useCMV';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

const pct = v => `${(v * 100).toFixed(1)}%`;
const brl = v => `R$ ${v.toFixed(2)}`;

export default function TeoricoReal() {
  const { fichas, kpis } = useCMV();

  const scatterData = fichas
    .filter(r => r.precoVenda > 0 && r.custoIngr > 0)
    .map(r => ({
      nome: r.nomePa,
      preco: parseFloat(r.precoVenda.toFixed(2)),
      custo: parseFloat(r.custoIngr.toFixed(2)),
      cmv: r.cmvPct,
    }));

  const criticos = fichas.filter(r => r.cmvPct > 1);
  const atencao  = fichas.filter(r => r.cmvPct >= 0.3 && r.cmvPct < 1);
  const ok       = fichas.filter(r => r.cmvPct < 0.3);

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1">Críticos (CMV &gt; 100%)</p>
          <p className="text-2xl font-bold text-brand-crimson">{criticos.length}</p>
          <p className="text-xs text-red-400 mt-1">produtos com prejuízo</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Atenção (30%–100%)</p>
          <p className="text-2xl font-bold text-amber-700">{atencao.length}</p>
          <p className="text-xs text-amber-500 mt-1">acima da meta de 30%</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-brand-olive uppercase tracking-wide mb-1">OK (abaixo 30%)</p>
          <p className="text-2xl font-bold text-brand-olive">{ok.length}</p>
          <p className="text-xs text-brand-olive mt-1">dentro da meta</p>
        </div>
      </div>

      {/* Scatter: custo × preço */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card">
        <div className="px-5 py-4 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Custo × Preço de venda</p>
          <p className="text-xs text-zinc-400 mt-0.5">Pontos acima da linha diagonal = CMV &gt; 100% (prejuízo)</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="preco" name="Preço" type="number" tick={{ fontSize: 11, fill: '#999' }}
                     tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} label={{ value: 'Preço de venda (R$)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#aaa' }} />
              <YAxis dataKey="custo" name="Custo" type="number" tick={{ fontSize: 11, fill: '#999' }}
                     tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-surface-border rounded-lg p-3 text-xs shadow-card">
                      <p className="font-semibold mb-1">{d.nome}</p>
                      <p>Preço: {brl(d.preco)}</p>
                      <p>Custo: {brl(d.custo)}</p>
                      <p className={d.cmv > 1 ? 'text-brand-crimson font-semibold' : d.cmv >= 0.3 ? 'text-amber-700' : 'text-brand-olive'}>
                        CMV: {pct(d.cmv)}
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine segment={[{x:0,y:0},{x:200,y:200}]} stroke="#ddd" strokeDasharray="4 4" />
              <Scatter data={scatterData} fill="#97A624">
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.cmv > 1 ? '#8C1414' : d.cmv >= 0.3 ? '#D9B504' : '#97A624'} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela só dos críticos */}
      {criticos.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <p className="font-semibold text-brand-crimson text-sm">Produtos com prejuízo — ação urgente</p>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border">
                {['Produto','Categoria','Preço Atual','Custo','CMV%','Novo Preço (30%)'].map(h => (
                  <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criticos.map((item, i) => (
                <tr key={i} className="bg-red-50 border-b border-red-100">
                  <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{item.subcategoria}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.precoVenda)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.custoIngr)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-brand-crimson">{pct(item.cmvPct)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-brand-olive">{brl(item.precoSugerido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
