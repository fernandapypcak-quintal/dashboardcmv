import { useCMV } from '../../hooks/useCMV';

const brl  = v => `R$ ${(v||0).toFixed(2)}`;
const brlK = v => v>=1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${(v||0).toFixed(0)}`;
const pct  = v => `${((v||0)*100).toFixed(1)}%`;

export default function Volume() {
  const { produtos } = useCMV();

  return (
    <div className="p-5 space-y-4">
      {/* Banner explicativo */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Conecte a API ZIG para ver volume de vendas</p>
        <p className="text-[13px] text-amber-700">
          Esta página cruza <strong>quantidade vendida</strong> (ZIG) com <strong>custo unitário</strong> (ficha técnica)
          para mostrar o impacto financeiro real de cada produto. Configure o Apps Script com o endpoint
          <code className="font-mono bg-amber-100 px-1 rounded mx-1">?tipo=vendas</code>
          para ativar esta visão.
        </p>
      </div>

      {/* Tabela de impacto estimado (com dados da ficha) */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Impacto por produto — ordenado por custo total estimado</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Quando a ZIG estiver conectada, esta tabela mostrará qtd. vendida × custo unitário real
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                {['Produto','Categoria','Preço Venda','Custo Unit.','CMV%','Margem Unit.','SKU ZIG'].map(h=>(
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...produtos].sort((a,b)=>b.cmvPct-a.cmvPct).map((item,i)=>(
                <tr key={item.codPa} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2.5 font-medium text-brand-black">{item.nomePa}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{item.subcategoria}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.precoVenda)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-600">{brl(item.custoIngr)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${item.cmvPct>1?'text-brand-crimson':item.cmvPct>=0.30?'text-amber-700':'text-brand-olive'}`}>
                    {pct(item.cmvPct)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${item.margemContribPct>=0.65?'text-brand-olive':'text-amber-700'}`}>
                    {brl(item.margemContribR)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-400 text-[11px]">
                    {item.skuZig || '—'}
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
