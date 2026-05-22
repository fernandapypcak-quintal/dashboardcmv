import { X } from 'lucide-react';

const brl = v => `R$ ${(v||0).toFixed(2)}`;
const pct = v => `${((v||0)*100).toFixed(1)}%`;

export default function PainelIngredientes({ produto, onClose }) {
  if (!produto) return null;

  const status = produto.cmvPct > 1 ? 'Crítico' : produto.cmvPct >= 0.30 ? 'Atenção' : 'OK';
  const statusColor = produto.cmvPct > 1 ? 'text-brand-crimson bg-red-50 border-red-100'
    : produto.cmvPct >= 0.30 ? 'text-amber-700 bg-amber-50 border-amber-100'
    : 'text-brand-olive bg-green-50 border-green-100';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Painel lateral */}
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
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted transition-colors shrink-0 mt-0.5">
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
            <div className="bg-surface-base rounded-lg p-3">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">CMV%</p>
              <div className="flex items-center gap-1.5">
                <p className={`text-[16px] font-bold ${produto.cmvPct>1?'text-brand-crimson':produto.cmvPct>=0.30?'text-amber-700':'text-brand-olive'}`}>
                  {pct(produto.cmvPct)}
                </p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColor}`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Margem e preço sugerido */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[12px]">
              <span className="text-zinc-400">Margem:</span>
              <span className={`font-semibold ${produto.margemContribPct>=0.65?'text-brand-olive':'text-amber-700'}`}>
                {pct(produto.margemContribPct)}
              </span>
            </div>
            {produto.cmvPct > 0.30 && (
              <div className="flex items-center gap-1.5 text-[12px]">
                <span className="text-zinc-400">Preço sugerido (30%):</span>
                <span className="font-semibold text-brand-olive">{brl(produto.precoSugerido)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ingredientes */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Composição — {produto.ingredientes.length} ingrediente{produto.ingredientes.length !== 1 ? 's' : ''}
            </p>

            <div className="space-y-2">
              {produto.ingredientes
                .sort((a, b) => b.custoIngr - a.custoIngr)
                .map((ing, i) => {
                  const share = produto.custoIngr > 0 ? ing.custoIngr / produto.custoIngr : 0;
                  return (
                    <div key={i} className="bg-surface-base rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[13px] font-medium text-brand-black">{ing.descComponente}</p>
                        <span className="text-[12px] font-mono font-semibold text-brand-black">
                          {brl(ing.custoIngr)}
                        </span>
                      </div>

                      {/* Barra de participação */}
                      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-brand-olive transition-all"
                          style={{ width: `${(share * 100).toFixed(0)}%` }}/>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{ing.qtd} {ing.und} × {brl(ing.custoUnit)}/un</span>
                        <span className="font-semibold text-zinc-600">
                          {(share * 100).toFixed(1)}% do custo
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

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
