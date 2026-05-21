import { useCMV } from '../../hooks/useCMV';

const STATUS_COLOR = { 'OK': 'text-brand-olive bg-green-50', 'Atenção': 'text-amber-700 bg-amber-50', 'Crítico': 'text-brand-crimson bg-red-50' };
const pct = v => `${(v * 100).toFixed(1)}%`;
const brl = v => `R$ ${v.toFixed(2)}`;

export default function CMVCategorias() {
  const { fichas } = useCMV();

  // Agrupa por categoria > subcategoria
  const grupos = fichas.reduce((acc, r) => {
    const k = r.categoria;
    if (!acc[k]) acc[k] = {};
    if (!acc[k][r.subcategoria]) acc[k][r.subcategoria] = [];
    acc[k][r.subcategoria].push(r);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {Object.entries(grupos).map(([cat, subs]) => (
        <div key={cat} className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-border bg-surface-muted">
            <p className="font-semibold text-brand-black text-sm">{cat}</p>
          </div>
          {Object.entries(subs).map(([sub, itens]) => (
            <div key={sub}>
              <div className="px-5 py-2 border-b border-surface-border bg-surface-base">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{sub}</p>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-surface-border">
                    {['Produto','Preço Venda','Custo CMV','CMV %','Preço Sug. 30%','Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, i) => {
                    const status = item.cmvPct > 1 ? 'Crítico' : item.cmvPct >= 0.3 ? 'Atenção' : 'OK';
                    return (
                      <tr key={i} className="hover:bg-surface-muted border-b border-surface-border last:border-0">
                        <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.precoVenda)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.custoIngr)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono font-semibold ${item.cmvPct > 1 ? 'text-brand-crimson' : item.cmvPct >= 0.3 ? 'text-amber-700' : 'text-brand-olive'}`}>
                          {pct(item.cmvPct)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{brl(item.precoSugerido)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[status]}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
      {Object.keys(grupos).length === 0 && (
        <div className="text-center py-16 text-zinc-400 text-sm">
          Sem dados de fichas técnicas disponíveis
        </div>
      )}
    </div>
  );
}
