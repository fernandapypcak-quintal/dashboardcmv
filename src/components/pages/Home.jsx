import { useCMV } from '../../hooks/useCMV';
import KpiCard from '../ui/KpiCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';

const brlK = v => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const pct  = v => `${(v*100).toFixed(1)}%`;
const CORES = ['#97A624','#D9B504','#8C1414','#2980b9','#e67e22','#9b59b6'];
const CORES_DESP = ['#97A624','#009e74','#8C1414','#D9B504','#e67e22','#c0392b','#2980b9','#777','#555','#009e74'];

export default function Home() {
  const { kpis, evolucaoCMV, desperdicioByUnidade, produtos, margemPorCategoria } = useCMV();

  const criticos = produtos.filter(r=>r.cmvPct>1).slice(0,5);
  const grandTotal = desperdicioByUnidade.reduce((s,r)=>s+r.total,0);
  const maxDesp = Math.max(...desperdicioByUnidade.map(r=>r.total),1);
  const mesesVis = desperdicioByUnidade[0] ? Object.keys(desperdicioByUnidade[0].porMes) : [];

  // Categorias para o gráfico de evolução
  const cats = margemPorCategoria.slice(0,4).map(r=>r.categoria);

  return (
    <div className="p-5 space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="📊" label="CMV Médio Teórico"
          value={pct(kpis.cmvAtual)}
          sub={kpis.deltaCMV>0 ? `↑ ${pct(Math.abs(kpis.deltaCMV))} vs semana ant.` : `↓ ${pct(Math.abs(kpis.deltaCMV))} vs semana ant.`}
          ok={kpis.cmvAtual<=0.30} />
        <KpiCard icon="💰" label="Margem de Contribuição Média"
          value={pct(kpis.margem)}
          sub={kpis.margem>=0.65 ? 'Acima da meta 65%' : 'Abaixo da meta 65%'}
          ok={kpis.margem>=0.65} />
        <KpiCard icon="🗑" label="Desperdício no Período"
          value={brlK(kpis.totalDesp)}
          sub="custo de perdas acumulado" />
        <KpiCard icon="⚠" label="Produtos Críticos"
          value={String(kpis.criticos)}
          sub={`${kpis.atencao} em atenção · ${kpis.okCount} OK`}
          ok={kpis.criticos===0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Evolução CMV */}
        <div className="lg:col-span-2 bg-white border border-surface-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">Evolução do CMV por semana</p>
            <p className="text-xs text-zinc-400 mt-0.5">linha tracejada = meta 30%</p>
          </div>
          <div className="p-5">
            {evolucaoCMV.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolucaoCMV} margin={{top:4,right:8,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
                  <XAxis dataKey="semana" tick={{fontSize:11,fill:'#999'}} axisLine={false} tickLine={false}/>
                  <YAxis domain={['auto','auto']} tick={{fontSize:11,fill:'#999'}} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v,n)=>[`${v.toFixed(1)}%`,n]} contentStyle={{background:'#fff',border:'1px solid #e8e8e2',borderRadius:8,fontSize:12}}/>
                  <ReferenceLine y={30} stroke="#ccc" strokeDasharray="5 4" strokeWidth={1.5}/>
                  <Line type="monotone" dataKey="cmv" name="CMV Geral" stroke="#97A624" strokeWidth={2.5} dot={{fill:'#97A624',r:3}} activeDot={{r:5}}/>
                  {cats.map((cat,i) => (
                    <Line key={cat} type="monotone" dataKey={cat} stroke={CORES[i+1]} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-zinc-400">
                Sem histórico disponível — conecte o Apps Script
              </div>
            )}
          </div>
        </div>

        {/* Alertas críticos */}
        <div className="bg-white border border-surface-border rounded-xl">
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="font-semibold text-brand-black text-sm">CMV acima de 100%</p>
            <p className="text-xs text-zinc-400 mt-0.5">prejuízo a cada venda</p>
          </div>
          <div className="p-4 space-y-2">
            {criticos.length === 0
              ? <p className="text-sm text-zinc-400 text-center py-6">Nenhum item crítico ✓</p>
              : criticos.map(item => (
                  <div key={item.codPa} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex justify-between items-start">
                      <p className="text-[12.5px] font-medium text-brand-black leading-snug">{item.nomePa}</p>
                      <span className="text-[13px] font-bold text-brand-crimson ml-2 shrink-0">{pct(item.cmvPct)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.subcategoria} · Sug: R$ {item.precoSugerido.toFixed(2)}</p>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Margem por categoria */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border">
          <p className="font-semibold text-brand-black text-sm">Margem de contribuição por categoria</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border">
                {['Categoria','Produtos','CMV Médio','Margem Média','Críticos','Atenção'].map(h=>(
                  <th key={h} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {margemPorCategoria.map((r,i)=>(
                <tr key={r.categoria} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2.5 font-medium text-brand-black">{r.categoria}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-500">{r.qtdProdutos}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${r.cmvMedio>1?'text-brand-crimson':r.cmvMedio>=0.30?'text-amber-700':'text-brand-olive'}`}>{pct(r.cmvMedio)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${r.margemMedia>=0.65?'text-brand-olive':'text-amber-700'}`}>{pct(r.margemMedia)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {r.criticos>0 && <span className="text-[11px] font-bold text-brand-crimson">{r.criticos}</span>}
                    {r.criticos===0 && <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.atencao>0 && <span className="text-[11px] font-semibold text-amber-700">{r.atencao}</span>}
                    {r.atencao===0 && <span className="text-zinc-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desperdício por loja */}
      <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-surface-border flex justify-between items-center">
          <p className="font-semibold text-brand-black text-sm">Desperdício por loja</p>
          <p className="text-xs text-zinc-400">Total: {brlK(grandTotal)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-left">Loja</th>
                {mesesVis.map(m=>(
                  <th key={m} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right capitalize">{m.slice(0,3)}</th>
                ))}
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Total</th>
                <th className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {desperdicioByUnidade.map((row,i)=>(
                <tr key={row.unidade} className={`border-b border-surface-border hover:bg-surface-muted ${i%2===0?'':'bg-surface-base'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:CORES_DESP[i%CORES_DESP.length]}}/>
                      <span className="font-medium text-brand-black">{row.unidade}</span>
                    </div>
                    <div className="mt-1 ml-4 h-[2px] bg-surface-muted rounded-full w-20 overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${(row.total/maxDesp*100).toFixed(0)}%`,background:CORES_DESP[i%CORES_DESP.length]}}/>
                    </div>
                  </td>
                  {mesesVis.map(m=>(
                    <td key={m} className="px-4 py-2.5 text-right font-mono text-[11px] text-zinc-500">{brlK(row.porMes[m]??0)}</td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] font-semibold text-brand-black">{brlK(row.total)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px] text-zinc-400">
                    {grandTotal>0?(row.total/grandTotal*100).toFixed(1):0}%
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
