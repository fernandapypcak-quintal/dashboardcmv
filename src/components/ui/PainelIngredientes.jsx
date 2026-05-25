import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const brl = v => `R$ ${(v||0).toFixed(2)}`;
const pct = v => `${((v||0)*100).toFixed(1)}%`;

export default function PainelIngredientes({ produto, histComp = [], onClose }) {
  if (!produto) return null;

  const status = produto.cmvPct > 1 ? 'Crítico' : produto.cmvPct >= 0.30 ? 'Atenção' : 'OK';
  const statusBg = produto.cmvPct > 1
    ? 'bg-red-50 text-brand-crimson border-red-200'
    : produto.cmvPct >= 0.30
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-green-50 text-brand-olive border-green-200';

  const ingredientes = produto.ingredientes || [];

  // Busca histórico de variação dos componentes deste produto
  const semanas = [...new Set(histComp.filter(r => r.codPa === produto.codPa).map(r => r.semanaISO))].sort();
  const semAtual = semanas.at(-1) ?? '';
  const semAnt   = semanas.at(-2) ?? '';
  const temHistorico = semanas.length >= 2;

  // Mapa de variação: codComponente → { atual, anterior, delta }
  const variacaoMap = {};
  if (temHistorico) {
    histComp
      .filter(r => r.codPa === produto.codPa && r.semanaISO === semAtual)
      .forEach(r => {
        const ant = histComp.find(h => h.codPa === produto.codPa && h.semanaISO === semAnt && h.codComponente === r.codComponente);
        variacaoMap[r.codComponente] = {
          custoAtual: r.custoUnit,
          custoAnt:   ant ? ant.custoUnit : r.custoUnit,
          delta:      ant ? r.custoUnit - ant.custoUnit : 0,
        };
      });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose}/>
      <div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                {produto.categoria} · {produto.subcategoria}
              </p>
              <h2 className="text-[18px] font-bold text-brand-black leading-tight">{produto.nomePa}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted shrink-0 mt-0.5">
              <X size={16} className="text-zinc-400"/>
            </button>
          </div>

          {/* KPIs do produto */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Preço venda</p>
              <p className="text-[16px] font-bold text-brand-black">{brl(produto.precoVenda)}</p>
            </div>
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">Custo total</p>
              <p className="text-[16px] font-bold text-brand-black">{brl(produto.custoIngr)}</p>
            </div>
            <div className={`rounded-lg p-3 border ${statusBg}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-70">CMV atual</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[18px] font-bold leading-none">{pct(produto.cmvPct)}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/60">{status}</span>
              </div>
            </div>
          </div>

          {/* Margem e sugestão */}
          <div className="flex items-center gap-4 mt-3 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Margem:</span>
              <span className={`font-semibold ${produto.margemContribPct>=0.65?'text-brand-olive':'text-amber-700'}`}>
                {pct(produto.margemContribPct)}
              </span>
            </div>
            {produto.cmvPct > 0.30 && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Preço sugerido (30%):</span>
                <span className="font-semibold text-brand-olive">{brl(produto.precoSugerido)}</span>
              </div>
            )}
          </div>

          {/* Banner histórico indisponível */}
          {!temHistorico && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-700">
              ℹ Grave 2 snapshots semanais para ver a variação de custo de cada ingrediente.
            </div>
          )}
        </div>

        {/* Ingredientes */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Composição — {ingredientes.length} ingrediente{ingredientes.length !== 1 ? 's' : ''}
              {temHistorico && <span className="ml-2 text-brand-olive">· variação {semAnt.replace('2026-','')} → {semAtual.replace('2026-','')}</span>}
            </p>

            {ingredientes.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">
                Nenhum ingrediente encontrado na ficha técnica.
              </p>
            ) : (
              <div className="space-y-2">
                {ingredientes
                  .sort((a, b) => b.custoIngr - a.custoIngr)
                  .map((ing, i) => {
                    const share = produto.custoIngr > 0 ? ing.custoIngr / produto.custoIngr : 0;
                    const hist  = variacaoMap[ing.codComponente];
                    const delta = hist ? hist.delta : 0;
                    const subiu = delta > 0.01;
                    const caiu  = delta < -0.01;

                    return (
                      <div key={i} className="bg-surface-base rounded-xl p-3.5">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-[13px] font-medium text-brand-black leading-tight flex-1">
                            {ing.descComponente || ing.codComponente || 'Ingrediente'}
                          </p>
                          <div className="text-right ml-3 shrink-0">
                            <p className="text-[14px] font-mono font-semibold text-brand-black">{brl(ing.custoIngr)}</p>
                            {/* Variação de custo unitário */}
                            {temHistorico && hist && (
                              <div className={`flex items-center justify-end gap-1 text-[11px] font-medium mt-0.5
                                ${subiu?'text-brand-crimson':caiu?'text-brand-olive':'text-zinc-400'}`}>
                                {subiu ? <TrendingUp size={11}/> : caiu ? <TrendingDown size={11}/> : <Minus size={11}/>}
                                {subiu?'+':''}{brl(delta)} unit.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Barra de participação */}
                        <div className="h-1.5 bg-surface-border rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full bg-brand-olive"
                            style={{ width: `${(share * 100).toFixed(0)}%` }}/>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>{ing.qtd} {ing.und} × {brl(ing.custoUnit)}/un</span>
                          <span className="font-semibold text-zinc-600">{(share * 100).toFixed(1)}% do custo</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Total */}
            <div className="mt-3 bg-brand-black rounded-xl p-3.5 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-white">Total</p>
              <div className="text-right">
                <p className="text-[16px] font-bold text-white">{brl(produto.custoIngr)}</p>
                <p className="text-[11px] text-zinc-400">de {brl(produto.precoVenda)} vendidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
