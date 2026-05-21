import { useState } from 'react';
import { useCMV } from '../../hooks/useCMV';
import StatusBadge from '../ui/StatusBadge';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

const brl = v => `R$ ${(v||0).toFixed(2)}`;
const pct = v => `${((v||0)*100).toFixed(1)}%`;

export default function Rentabilidade() {
  const { produtos, margemPorCategoria } = useCMV();
  const [busca,      setBusca]      = useState('');
  const [ordenar,    setOrdenar]    = useState('cmv');
  const [expandido,  setExpandido]  = useState(null);
  const [catAberta,  setCatAberta]  = useState(null);

  // Agrupa por categoria → subcategoria
  const grupos = {};
  produtos
    .filter(r => r.nomePa.toLowerCase().includes(busca.toLowerCase()))
    .forEach(r => {
      if (!grupos[r.categoria]) grupos[r.categoria] = {};
      if (!grupos[r.categoria][r.subcategoria]) grupos[r.categoria][r.subcategoria] = [];
      grupos[r.categoria][r.subcategoria].push(r);
    });

  // Ordena produtos dentro de cada subcategoria
  Object.values(grupos).forEach(subs => {
    Object.keys(subs).forEach(sub => {
      subs[sub].sort((a,b) =>
        ordenar==='cmv'     ? b.cmvPct - a.cmvPct :
        ordenar==='margem'  ? b.margemContribPct - a.margemContribPct :
        ordenar==='nome'    ? a.nomePa.localeCompare(b.nomePa) : 0
      );
    });
  });

  return (
    <div className="p-5 space-y-4">
      {/* Controles */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input value={busca} onChange={e=>setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-8 pr-3 h-8 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:border-zinc-400"/>
        </div>
        <select value={ordenar} onChange={e=>setOrdenar(e.target.value)}
          className="text-[12.5px] border border-surface-border rounded-lg px-2.5 h-8 bg-white focus:outline-none">
          <option value="cmv">Ordenar: CMV%</option>
          <option value="margem">Ordenar: Margem</option>
          <option value="nome">Ordenar: Nome</option>
        </select>
        <span className="text-xs text-zinc-400">{produtos.length} produtos</span>
      </div>

      {/* Resumo por categoria */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {margemPorCategoria.slice(0,4).map(r => (
          <div key={r.categoria}
            onClick={() => setCatAberta(catAberta===r.categoria ? null : r.categoria)}
            className="bg-white border border-surface-border rounded-xl p-3 cursor-pointer hover:border-zinc-400 transition-colors">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">{r.categoria}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-[18px] font-bold ${r.cmvMedio>1?'text-brand-crimson':r.cmvMedio>=0.30?'text-amber-700':'text-brand-olive'}`}>
                  {pct(r.cmvMedio)}
                </p>
                <p className="text-[11px] text-zinc-400">CMV médio</p>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-semibold text-zinc-700">{pct(r.margemMedia)}</p>
                <p className="text-[11px] text-zinc-400">margem</p>
              </div>
            </div>
            {r.criticos > 0 && (
              <div className="mt-2 text-[11px] text-brand-crimson font-semibold">
                ⚠ {r.criticos} produto{r.criticos>1?'s':''} crítico{r.criticos>1?'s':''}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabela agrupada */}
      {Object.entries(grupos).map(([cat, subs]) => (
        <div key={cat} className="bg-white border border-surface-border rounded-xl overflow-hidden">
          {/* Header categoria */}
          <div className="px-5 py-3 border-b border-surface-border bg-surface-muted flex items-center justify-between">
            <p className="font-semibold text-brand-black text-sm">{cat}</p>
            <div className="flex gap-4 text-[11px] text-zinc-400">
              {margemPorCategoria.find(r=>r.categoria===cat) && (
                <>
                  <span>CMV médio: <strong className="text-brand-black">{pct(margemPorCategoria.find(r=>r.categoria===cat).cmvMedio)}</strong></span>
                  <span>Margem: <strong className="text-brand-black">{pct(margemPorCategoria.find(r=>r.categoria===cat).margemMedia)}</strong></span>
                </>
              )}
            </div>
          </div>

          {Object.entries(subs).map(([sub, itens]) => (
            <div key={sub}>
              {/* Sub-header */}
              <div className="px-5 py-2 border-b border-surface-border bg-surface-base">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{sub}</p>
              </div>

              {/* Itens */}
              {itens.map(item => (
                <div key={item.codPa}>
                  {/* Linha do produto */}
                  <div
                    onClick={() => setExpandido(expandido===item.codPa ? null : item.codPa)}
                    className="flex items-center px-5 py-3 border-b border-surface-border hover:bg-surface-muted cursor-pointer transition-colors">
                    <div className="w-5 shrink-0 text-zinc-300">
                      {expandido===item.codPa ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-brand-black">{item.nomePa}</p>
                    </div>
                    <div className="flex items-center gap-6 ml-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] text-zinc-400">Preço venda</p>
                        <p className="text-[13px] font-mono text-zinc-700">{brl(item.precoVenda)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-zinc-400">Custo</p>
                        <p className="text-[13px] font-mono text-zinc-700">{brl(item.custoIngr)}</p>
                      </div>
                      <div className="text-right w-16">
                        <p className="text-[11px] text-zinc-400">CMV%</p>
                        <p className={`text-[13px] font-mono font-bold ${item.cmvPct>1?'text-brand-crimson':item.cmvPct>=0.30?'text-amber-700':'text-brand-olive'}`}>
                          {pct(item.cmvPct)}
                        </p>
                      </div>
                      <div className="text-right w-16">
                        <p className="text-[11px] text-zinc-400">Margem</p>
                        <p className={`text-[13px] font-mono font-semibold ${item.margemContribPct>=0.65?'text-brand-olive':'text-amber-700'}`}>
                          {pct(item.margemContribPct)}
                        </p>
                      </div>
                      <div className="w-16 text-right">
                        <StatusBadge cmvPct={item.cmvPct}/>
                      </div>
                      {item.cmvPct > 0.30 && (
                        <div className="text-right w-28">
                          <p className="text-[10px] text-zinc-400">Sug. 30%</p>
                          <p className="text-[12px] font-mono text-brand-olive font-semibold">{brl(item.precoSugerido)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhe ingredientes */}
                  {expandido === item.codPa && (
                    <div className="bg-surface-base border-b border-surface-border">
                      <table className="w-full text-[12px] ml-5">
                        <thead>
                          <tr className="border-b border-surface-border">
                            <th className="pl-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left w-8">#</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left">Ingrediente</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Qtd</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Und</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Custo Unit</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Custo Ingr</th>
                            <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">% do total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.ingredientes.map((ing,i) => (
                            <tr key={i} className={`border-b border-surface-border last:border-0 ${i%2===0?'':'bg-white'}`}>
                              <td className="pl-4 py-2 text-zinc-400">{i+1}</td>
                              <td className="px-4 py-2 text-zinc-700">{ing.descComponente}</td>
                              <td className="px-4 py-2 text-right font-mono text-zinc-600">{ing.qtd}</td>
                              <td className="px-4 py-2 text-right text-zinc-500">{ing.und}</td>
                              <td className="px-4 py-2 text-right font-mono text-zinc-600">{brl(ing.custoUnit)}</td>
                              <td className="px-4 py-2 text-right font-mono font-semibold text-zinc-700">{brl(ing.custoIngr)}</td>
                              <td className="px-4 py-2 text-right font-mono text-zinc-400">
                                {item.custoIngr>0?((ing.custoIngr/item.custoIngr)*100).toFixed(1):0}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-surface-muted font-semibold">
                            <td className="pl-4 py-2 text-zinc-400" colSpan={5}>Total</td>
                            <td className="px-4 py-2 text-right font-mono text-brand-black">{brl(item.custoIngr)}</td>
                            <td className="px-4 py-2 text-right font-mono text-brand-black">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
