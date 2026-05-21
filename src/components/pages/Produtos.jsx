import { useState } from 'react';
import { useCMV } from '../../hooks/useCMV';
import { Search } from 'lucide-react';

const brl = v => `R$ ${v.toFixed(2)}`;
const pct = v => `${(v * 100).toFixed(1)}%`;

export default function Produtos() {
  const { fichas } = useCMV();
  const [busca, setBusca] = useState('');
  const [ordenar, setOrdenar] = useState('cmvPct');

  const filtrados = fichas
    .filter(r => r.nomePa.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => ordenar === 'cmvPct' ? b.cmvPct - a.cmvPct
                  : ordenar === 'nome'   ? a.nomePa.localeCompare(b.nomePa)
                  : b.precoVenda - a.precoVenda);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Controles */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-8 pr-3 h-9 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:border-zinc-400" />
        </div>
        <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
          className="text-[12.5px] border border-surface-border rounded-lg px-3 h-9 bg-white focus:outline-none">
          <option value="cmvPct">Ordenar: CMV%</option>
          <option value="nome">Ordenar: Nome</option>
          <option value="preco">Ordenar: Preço</option>
        </select>
        <span className="text-xs text-zinc-400">{filtrados.length} produtos</span>
      </div>

      {/* Tabela */}
      <div className="bg-surface-card border border-surface-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                {['Produto','Categoria','Subcategoria','Preço Venda','Custo','CMV%','Preço Sug. 30%'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item, i) => {
                const status = item.cmvPct > 1 ? 'critico' : item.cmvPct >= 0.3 ? 'atencao' : 'ok';
                return (
                  <tr key={i} className="hover:bg-surface-muted border-b border-surface-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{item.categoria}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{item.subcategoria}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.precoVenda)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.custoIngr)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono font-semibold ${status === 'critico' ? 'text-brand-crimson' : status === 'atencao' ? 'text-amber-700' : 'text-brand-olive'}`}>
                      {pct(item.cmvPct)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{brl(item.precoSugerido)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
