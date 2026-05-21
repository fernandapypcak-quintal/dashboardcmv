import { useCMV } from '../../hooks/useCMV';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const brlK = v => v>=1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${(v||0).toFixed(0)}`;
const CORES = ['#97A624','#009e74','#8C1414','#D9B504','#e67e22','#c0392b','#2980b9','#777','#555','#009e74'];

export default function Desperdicio() {
  const { desperdicio, desperdicioByUnidade, desperdicioByClassificacao } = useCMV();

  const grandTotal = desperdicioByUnidade.reduce((s,r)=>s+r.total,0);
  const barData = desperdicioByUnidade.map(r=>({
    nome: r.unidade.split(' ').at(-1).substring(0,8),
    total: parseFloat(r.total.toFixed(0)),
  }));

  return (
    <div className="p-5 space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Total Acumulado</p>
          <p className="text-[26px] font-bold text-brand-black">{brlK(grandTotal)}</p>
          <p className="text-[12px] text-zinc-400 mt-1">{desperdicio.length} lançamentos</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Maior Unidade</p>
          <p className="text-[22px] font-bold text-brand-black">{desperdicioByUnidade[0]?.unidade ?? '—'}</p>
          <p className="text-[12px] text-brand-crimson mt-1 font-medium">{brlK(desperdicioByUnidade[0]?.total??0)}</p>
        </div>
        <div className="bg-white border border-surface-border rounded-xl p-4">
          <p className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Principal Motivo</p>
          <p className="text-[16px] font-bold text-brand-black leading-tight">{desperdicioByClassificacao[0]?.classificacao ?? '—'}</p>
          <p className="text-[12px] text-zinc-400 mt-1">{brlK(desperdicioByClassificacao[0]?.total??0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Barra por unidade */}
        <div className="bg-white border border-surface-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Por loja</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{top:4,right:8,left:-10,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
                <XAxis dataKey="nome" tick={{fontSize:10,fill:'#999'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#999'}} tickFormatter={v=>brlK(v)} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>[brlK(v),'Desperdício']} contentStyle={{background:'#fff',border:'1px solid #e8e8e2',borderRadius:8,fontSize:12}}/>
                <Bar dataKey="total" radius={[4,4,0,0]}>
                  {barData.map((_,i)=><Cell key={i} fill={CORES[i%CORES.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por motivo */}
        <div className="bg-white border border-surface-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Por motivo</p>
          </div>
          <div className="p-4 space-y-2.5 max-h-[280px] overflow-y-auto">
            {desperdicioByClassificacao.map((item,i) => {
              const share = grandTotal>0 ? item.total/grandTotal*100 : 0;
              return (
                <div key={item.classificacao}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] text-brand-black font-medium capitalize">{item.classificacao.toLowerCase()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{share.toFixed(1)}%</span>
                      <span className="text-[11px] font-mono text-zinc-600">{brlK(item.total)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${share.toFixed(0)}%`,background:CORES[i%CORES.length]}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela pivot por loja × mês */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Detalhe mensal por loja</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left">Loja</th>
                {desperdicioByUnidade[0] && Object.keys(desperdicioByUnidade[0].porMes).map(m=>(
                  <th key={m} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right capitalize">{m.slice(0,3)}</th>
                ))}
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {desperdicioByUnidade.map((row,i)=>(
                <tr key={row.unidade} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2.5 font-medium text-brand-black">{row.unidade}</td>
                  {Object.values(row.porMes).map((v,mi)=>(
                    <td key={mi} className="px-4 py-2.5 text-right font-mono text-[11px] text-zinc-500">{brlK(v)}</td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] font-semibold text-brand-black">{brlK(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lançamentos detalhados */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Lançamentos detalhados</p>
          <p className="text-xs text-zinc-400 mt-0.5">{desperdicio.length} registros no período</p>
        </div>
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-white border-b border-surface-border">
              <tr>
                {['Data','Loja','Produto','Qtd','Custo Total','Motivo'].map(h=>(
                  <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desperdicio.slice(0,300).map((r,i)=>(
                <tr key={i} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2 text-zinc-400 whitespace-nowrap">{r.data}</td>
                  <td className="px-4 py-2 font-medium text-brand-black">{r.unidade}</td>
                  <td className="px-4 py-2 text-zinc-700">{r.produto}</td>
                  <td className="px-4 py-2 font-mono text-zinc-500">{r.quantidade}</td>
                  <td className="px-4 py-2 font-mono text-zinc-600">{brlK(r.custoTotal)}</td>
                  <td className="px-4 py-2">
                    <span className="text-[10px] bg-surface-muted px-2 py-0.5 rounded-full text-zinc-500 capitalize">
                      {(r.classificacao||'').toLowerCase()}
                    </span>
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
