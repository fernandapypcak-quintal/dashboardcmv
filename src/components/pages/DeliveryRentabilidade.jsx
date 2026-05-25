import { useState, useEffect } from 'react';
import { useCMV } from '../../hooks/useCMV';
import { loadDeliveryData } from '../../data/loaderDelivery';
import PainelIngredientes from '../ui/PainelIngredientes';
import { Search } from 'lucide-react';

const brl  = v => `R$ ${(v||0).toFixed(2)}`;
const brlK = v => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${(v||0).toFixed(0)}`;
const pct  = v => `${((v||0)*100).toFixed(1)}%`;

export default function DeliveryRentabilidade() {
  const { produtos, histComp } = useCMV();
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [busca,   setBusca]   = useState('');
  const [ordenar, setOrdenar] = useState('custo');
  const [filtroCrit, setFiltroCrit] = useState('Todos');
  const [painel,  setPainel]  = useState(null);

  useEffect(() => {
    loadDeliveryData(produtos)
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [produtos]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-brand-olive border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-zinc-400">Carregando dados de delivery...</p>
      </div>
    </div>
  );

  if (!dados || dados.porProduto.length === 0) return (
    <div className="p-5">
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Sem dados de delivery</p>
        <p className="text-[13px] text-amber-700">
          Execute <strong>📦 Atualizar vendas ZIG</strong> pelo menu da planilha para carregar as vendas do delivery.
        </p>
      </div>
    </div>
  );

  const { porProduto, receitaTotal, custoTotal, receitaComFicha, cmvGeral, semFicha } = dados;

  // Filtra produtos
  const filtrados = porProduto.filter(r => {
    if (!r.nomePa.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroCrit === 'Crítico') return r.cmvReal > 1;
    if (filtroCrit === 'Atenção') return r.cmvReal >= 0.30 && r.cmvReal < 1;
    if (filtroCrit === 'OK')      return r.cmvReal < 0.30;
    return true;
  }).sort((a, b) =>
    ordenar === 'custo'   ? b.custoTotal - a.custoTotal :
    ordenar === 'receita' ? b.receitaTotal - a.receitaTotal :
    ordenar === 'cmv'     ? b.cmvReal - a.cmvReal :
    a.nomePa.localeCompare(b.nomePa)
  );

  // Busca produto completo das fichas para o painel
  function abrirPainel(item) {
    const prod = produtos.find(p => p.skuZig === item.skuZig);
    if (prod) setPainel(prod);
  }

  return (
    <div className="p-5 space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Receita Delivery</p>
          <p className="text-[26px] font-bold text-brand-black leading-none">{brlK(receitaTotal)}</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Custo Total</p>
          <p className="text-[26px] font-bold text-brand-black leading-none">{brlK(custoTotal)}</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">CMV Real Delivery</p>
          <p className={`text-[26px] font-bold leading-none ${cmvGeral>0.30?'text-amber-700':'text-brand-olive'}`}>
            {pct(cmvGeral)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">só produtos com ficha técnica</p>
          {semFicha > 0 && (
            <p className="text-[11px] text-amber-700 mt-0.5">{semFicha} produtos sem ficha excluídos</p>
          )}
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Produtos</p>
          <p className="text-[26px] font-bold text-brand-black leading-none">{porProduto.length}</p>
          {semFicha > 0 && (
            <p className="text-[12px] text-amber-700 mt-1.5">{semFicha} sem ficha técnica</p>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-8 pr-3 h-8 text-sm border border-surface-border rounded-lg bg-white focus:outline-none focus:border-zinc-400"/>
        </div>
        <div className="flex gap-1.5">
          {['Todos','Crítico','Atenção','OK'].map(op => (
            <button key={op} onClick={() => setFiltroCrit(op)}
              className={`px-3 h-8 rounded-lg text-[12px] font-medium transition-colors border
                ${filtroCrit===op
                  ? op==='Crítico'?'bg-brand-crimson text-white border-brand-crimson'
                  : op==='Atenção'?'bg-amber-500 text-white border-amber-500'
                  : op==='OK'?'bg-brand-olive text-white border-brand-olive'
                  : 'bg-brand-black text-white border-brand-black'
                  : 'bg-white text-zinc-500 border-surface-border hover:border-zinc-400'}`}>
              {op}
            </button>
          ))}
        </div>
        <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
          className="text-[12.5px] border border-surface-border rounded-lg px-2.5 h-8 bg-white focus:outline-none">
          <option value="custo">Ordenar: Maior custo</option>
          <option value="receita">Ordenar: Maior receita</option>
          <option value="cmv">Ordenar: CMV%</option>
          <option value="nome">Ordenar: Nome</option>
        </select>
        <span className="text-xs text-zinc-400">{filtrados.length} produtos</span>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                {['Produto','Categoria','Qtd Vendida','Receita','Custo Total','Preço Médio','Custo Unit.','CMV Real','Margem',''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left last:text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item, i) => (
                <tr key={item.skuZig} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                  <td className="px-4 py-2.5 text-zinc-500 text-[12px]">{item.categoria || item.subcategoria}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-brand-black">{item.qtdTotal}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brlK(item.receitaTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brlK(item.custoTotal)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{brl(item.precoMedio)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-500">{brl(item.custoUnit)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold
                    ${item.cmvReal>1?'text-brand-crimson':item.cmvReal>=0.30?'text-amber-700':'text-brand-olive'}`}>
                    {pct(item.cmvReal)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold
                    ${item.margemPct>=0.65?'text-brand-olive':'text-amber-700'}`}>
                    {pct(item.margemPct)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {item.temFicha ? (
                      <button onClick={() => abrirPainel(item)}
                        className="text-[11px] text-brand-olive hover:underline whitespace-nowrap">
                        ver →
                      </button>
                    ) : (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">sem ficha</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {painel && <PainelIngredientes produto={painel} histComp={histComp} onClose={() => setPainel(null)}/>}
    </div>
  );
}
